'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { setParticipantMuted } from '@/lib/db';
import { createClient } from '@/lib/supabase';

const APP_ID        = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? '';
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export type AgoraRole = 'host' | 'audience';

interface UseAgoraVoiceOptions {
  channelName: string;
  userId: string | null;
  role: AgoraRole;
  roomId: string;
}

/** Server-side UID derivation — must match the edge function exactly */
function deriveAgoraUid(userId: string): number {
  let uid = 0;
  for (let i = 0; i < userId.length; i++) {
    uid = ((uid * 31) + userId.charCodeAt(i)) | 0;
  }
  uid = Math.abs(uid) % 2_147_483_647;
  if (uid === 0) uid = 1;
  return uid;
}

/** Fetch a signed Agora token from the Supabase Edge Function.
 *  UID is now derived server-side — the client only sends channelName + role.
 *  The server verifies room membership and determines the actual Agora role
 *  from the DB participant record (not the client-supplied role).
 */
async function fetchAgoraToken(channelName: string, role: AgoraRole): Promise<{ token: string; uid: number } | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-agora-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ channelName, role }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.token ? { token: data.token, uid: data.uid } : null;
  } catch {
    return null;
  }
}

export function useAgoraVoice({ channelName, userId, role, roomId }: UseAgoraVoiceOptions) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Map of numeric Agora UID → speaking boolean
  const [speakingUids, setSpeakingUids] = useState<Record<number, boolean>>({});

  const clientRef   = useRef<any>(null);
  const micTrackRef = useRef<any>(null);
  const joinedRef   = useRef(false);
  // Store own numeric UID so the room page can match it to a user
  const ownUidRef   = useRef<number | null>(null);

  const join = useCallback(async () => {
    if (!userId || !APP_ID || joinedRef.current) return;

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;
      await client.setClientRole(role);

      // Fetch signed token — server derives UID and verifies room membership
      const result = await fetchAgoraToken(channelName, role);
      if (!result) throw new Error('Failed to securely authenticate voice connection');

      const { token, uid } = result;
      ownUidRef.current = uid;

      await client.join(APP_ID, channelName, token, uid);

      if (role === 'host') {
        const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        micTrackRef.current = micTrack;
        await client.publish(micTrack);
      }

      // Enable VAD — fires 'volume-indicator' every 2 s with per-UID volumes
      client.enableAudioVolumeIndicator();
      client.on('volume-indicator', (volumes: Array<{ uid: number; level: number }>) => {
        const next: Record<number, boolean> = {};
        volumes.forEach(({ uid: u, level }) => {
          next[u] = level > 5; // threshold: >5 = actively speaking
        });
        setSpeakingUids(next);
      });

      joinedRef.current = true;
      setIsJoined(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to join voice channel');
    }
  }, [channelName, userId, role]);

  const leave = useCallback(async () => {
    try {
      micTrackRef.current?.stop();
      micTrackRef.current?.close();
      micTrackRef.current = null;
      await clientRef.current?.leave();
      clientRef.current = null;
      joinedRef.current = false;
      ownUidRef.current = null;
      setIsJoined(false);
      setIsMuted(false);
      setSpeakingUids({});
    } catch {}
  }, []);

  const toggleMute = useCallback(async () => {
    const track = micTrackRef.current;
    if (!track || !userId) return;
    const next = !isMuted;
    await track.setMuted(next);
    setIsMuted(next);
    setParticipantMuted(roomId, userId, next).catch(() => {});
  }, [isMuted, roomId, userId]);

  /** Returns true if the given Soul Room userId is currently speaking */
  const isSpeaking = useCallback((uid: string): boolean => {
    const numeric = deriveAgoraUid(uid);
    return speakingUids[numeric] ?? false;
  }, [speakingUids]);

  useEffect(() => {
    join();
    return () => { leave(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isJoined, isMuted, error, toggleMute, leave, isSpeaking };
}
