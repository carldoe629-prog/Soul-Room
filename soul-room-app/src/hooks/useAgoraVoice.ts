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

/** Fetch a signed Agora token from the Supabase Edge Function. */
async function fetchAgoraToken(channelName: string, uid: number, role: AgoraRole): Promise<string | null> {
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
      body: JSON.stringify({ channelName, uid, role }),
    });

    if (!res.ok) return null;
    const { token } = await res.json();
    return token ?? null;
  } catch {
    return null;
  }
}

export function useAgoraVoice({ channelName, userId, role, roomId }: UseAgoraVoiceOptions) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef   = useRef<any>(null);
  const micTrackRef = useRef<any>(null);
  const joinedRef   = useRef(false);

  const join = useCallback(async () => {
    if (!userId || !APP_ID || joinedRef.current) return;

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;
      await client.setClientRole(role);

      // Deterministic numeric UID from UUID string
      const uid = Math.abs(userId.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)) % 1_000_000;

      // Fetch signed token; fall back to null (works if certificate auth is not yet enforced)
      const token = await fetchAgoraToken(channelName, uid, role);

      await client.join(APP_ID, channelName, token, uid);

      if (role === 'host') {
        const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        micTrackRef.current = micTrack;
        await client.publish(micTrack);
      }

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
      setIsJoined(false);
      setIsMuted(false);
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

  useEffect(() => {
    join();
    return () => { leave(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isJoined, isMuted, error, toggleMute, leave };
}
