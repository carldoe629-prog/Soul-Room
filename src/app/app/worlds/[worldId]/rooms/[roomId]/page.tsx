'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { joinRoom, leaveRoom, sendGift, promoteToSpeaker } from '@/lib/db';
import { GIFT_TYPES, formatNumber } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase';
import { useAgoraVoice } from '@/hooks/useAgoraVoice';

interface Room {
  id: string;
  title: string;
  host_id: string;
  host_name: string;
  world_id: string;
  is_live: boolean;
  speaker_count: number;
  listener_count: number;
  created_at: string;
}

interface Participant {
  user_id: string;
  role: 'host' | 'speaker' | 'listener';
  is_muted: boolean;
  user: {
    id: string;
    display_name: string;
    photos: string[];
    gender: string;
  };
}

interface RoomMessage {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function VoiceRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user, profile, refreshProfile } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [newChat, setNewChat] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [sendingGift, setSendingGift] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const hasJoined = useRef(false);

  const supabase = useMemo(() => createClient(), []);

  // Determine this user's role in the room
  const myParticipant = participants.find(p => p.user_id === user?.id);
  const myRole = myParticipant?.role ?? 'listener';
  const isSpeakerOrHost = myRole === 'host' || myRole === 'speaker';

  // Agora voice
  const { isJoined: voiceJoined, isMuted, error: voiceError, toggleMute } = useAgoraVoice({
    channelName: roomId,
    userId: user?.id ?? null,
    role: isSpeakerOrHost ? 'host' : 'audience',
    roomId,
  });

  const fetchParticipants = useCallback(async () => {
    const { data } = await supabase
      .from('room_participants')
      .select('*, user:users(id, display_name, photos, gender)')
      .eq('room_id', roomId);
    if (data) setParticipants(data as Participant[]);
  }, [roomId, supabase]);

  // Fetch room + participants + chat
  useEffect(() => {
    if (!roomId) return;

    Promise.allSettled([
      supabase.from('rooms').select('*').eq('id', roomId).single()
        .then(({ data }: { data: any }) => { if (data) setRoom(data as Room); }),
      fetchParticipants(),
      supabase.from('room_messages').select('*').eq('room_id', roomId)
        .order('created_at').limit(50)
        .then(({ data }: { data: any }) => { if (data) setChatMessages(data as RoomMessage[]); }),
    ]).finally(() => setLoading(false));
  }, [roomId, supabase, fetchParticipants]);

  // Join on mount, leave on unmount
  useEffect(() => {
    if (!user || !roomId || hasJoined.current) return;
    hasJoined.current = true;
    joinRoom(roomId, user.id).catch(() => {});
    return () => { leaveRoom(roomId, user.id).catch(() => {}); };
  }, [user, roomId]);

  // Real-time: participant changes
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room-participants:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        () => fetchParticipants())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [roomId, supabase, fetchParticipants]);

  // Real-time: room chat
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room-chat:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          setChatMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as RoomMessage];
          });
        })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [roomId, supabase]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = useCallback(async () => {
    const trimmed = newChat.trim();
    if (!trimmed || !user || sendingChat) return;
    setSendingChat(true);
    setNewChat('');
    try {
      await supabase.from('room_messages').insert({
        room_id: roomId,
        user_id: user.id,
        display_name: profile?.display_name ?? 'You',
        content: trimmed,
      });
    } catch {
      setNewChat(trimmed);
    } finally {
      setSendingChat(false);
    }
  }, [newChat, user, profile, sendingChat, roomId, supabase]);

  const handleSendGift = async (gift: typeof GIFT_TYPES[0]) => {
    if (!user || !room || sendingGift) return;
    setSendingGift(gift.id);
    try {
      await sendGift(user.id, room.host_id, gift.id, gift.vpCost);
      await refreshProfile();
    } catch {
      // silently ignore
    } finally {
      setSendingGift(null);
      setShowGifts(false);
    }
  };

  const handleLeave = async () => {
    if (user && hasJoined.current) {
      await leaveRoom(roomId, user.id).catch(() => {});
      hasJoined.current = false;
    }
    router.back();
  };

  const handleRaiseHand = async () => {
    if (!user) return;
    setIsHandRaised(r => !r);
    // When host taps raise-hand indicator they can promote the listener
  };

  const handlePromote = async (targetUserId: string) => {
    if (!user || myRole !== 'host') return;
    await promoteToSpeaker(roomId, targetUserId).catch(() => {});
  };

  const speakers = participants.filter(p => p.role === 'host' || p.role === 'speaker');
  const listeners = participants.filter(p => p.role === 'listener');
  const vpBalance = profile?.vibe_points ?? 0;

  if (loading) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="h-20 glass animate-pulse" />
        <div className="px-4 py-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full glass animate-pulse" />
                <div className="w-12 h-2 rounded glass animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in relative font-[Outfit]">
      {/* Room Header */}
      <div className="px-4 py-3 glass-strong">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
            <span className="text-xs text-text-tertiary">
              LIVE{room?.created_at ? ` · ${timeAgo(room.created_at)}` : ''}
            </span>
          </div>
        </div>
        <h1 className="text-lg font-bold text-text-primary mt-2">{room?.title ?? 'Voice Room'}</h1>
        <div className="text-xs text-text-tertiary mt-0.5">Hosted by {room?.host_name || 'Unknown'}</div>
      </div>

      {/* Speakers Stage */}
      <div className="px-4 py-5">
        <div className="text-xs text-text-tertiary font-medium mb-3">🎙 Speakers ({speakers.length})</div>
        {speakers.length === 0 ? (
          <div className="text-center py-3 text-text-tertiary text-xs">No speakers yet</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {speakers.map((p, i) => {
              const avatar = p.user?.photos?.[0];
              return (
                <div key={p.user_id} className="flex flex-col items-center gap-1.5">
                  <div className={`relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl ${
                    i === 0 ? 'ring-2 ring-accent ring-offset-2 ring-offset-dark-900' : 'bg-gradient-to-br from-dark-600 to-dark-800'
                  }`}>
                    {avatar ? (
                      <img src={avatar} alt={p.user?.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{p.user?.gender === 'Female' ? '👩🏾' : '👨🏾'}</span>
                    )}
                    {!p.is_muted && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {[1, 2, 3].map(b => (
                          <div
                            key={b}
                            className="w-0.5 bg-vibe rounded-full animate-pulse"
                            style={{ height: `${4 + b * 2}px`, animationDelay: `${b * 120}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-text-secondary truncate w-16 text-center">
                    {p.user?.display_name ?? '...'}
                  </span>
                  {p.role === 'host' && <span className="text-[9px] text-accent">Host</span>}
                  {p.is_muted && <span className="text-[9px] text-text-tertiary">🔇</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Listeners */}
      <div className="px-4 pb-4">
        <div className="text-xs text-text-tertiary font-medium mb-2">
          👂 Listeners ({room?.listener_count ?? listeners.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {listeners.slice(0, 12).map(p => {
            const avatar = p.user?.photos?.[0];
            return (
              <div key={p.user_id} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 overflow-hidden flex items-center justify-center text-base">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{p.user?.gender === 'Female' ? '👩🏾' : '👨🏾'}</span>
                  )}
                </div>
                <span className="text-[8px] text-text-tertiary truncate w-10 text-center">
                  {p.user?.display_name?.split(' ')[0] ?? '...'}
                </span>
              </div>
            );
          })}
          {(room?.listener_count ?? 0) > listeners.length && (
            <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-[10px] text-text-tertiary font-bold">
              +{(room?.listener_count ?? 0) - listeners.length}
            </div>
          )}
        </div>
      </div>

      {/* Room Chat */}
      <div className="flex-1 px-4 border-t border-dark-600/30 pt-3 overflow-y-auto min-h-0">
        <div className="text-xs text-text-tertiary font-medium mb-2">💬 Room Chat</div>
        {chatMessages.length === 0 ? (
          <div className="text-center py-4 text-text-tertiary text-xs">No messages yet — say something!</div>
        ) : (
          <div className="space-y-2 pb-2">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className={`font-medium ${msg.user_id === user?.id ? 'text-vibe' : 'text-accent'}`}>
                  {msg.display_name}:{' '}
                </span>
                <span className="text-text-secondary">{msg.content}</span>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Gift Panel */}
      {showGifts && (
        <div className="absolute bottom-20 left-0 right-0 mx-4 p-4 rounded-3xl glass-strong border border-dark-500 shadow-2xl animate-slide-up z-20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">Send a Gift</h3>
            <button
              onClick={() => setShowGifts(false)}
              className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-secondary"
            >✕</button>
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto no-scrollbar">
            {GIFT_TYPES.slice(0, 8).map(gift => (
              <button
                key={gift.id}
                onClick={() => handleSendGift(gift)}
                disabled={!!sendingGift || vpBalance < gift.vpCost}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-dark-600/50 hover:bg-dark-500 hover:scale-105 transition-all disabled:opacity-40"
              >
                <div className="text-3xl">{gift.emoji}</div>
                <div className="text-[9px] font-bold text-text-secondary truncate max-w-full">{gift.name}</div>
                <div className="text-[9px] text-accent font-semibold">💎 {gift.vpCost}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-dark-600/50 flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Your balance</span>
            <span className="text-sm font-bold text-text-primary">💎 {formatNumber(vpBalance)} VP</span>
          </div>
        </div>
      )}

      {/* Voice status bar */}
      {voiceError && (
        <div className="px-4 py-1.5 bg-red/10 border-t border-red/20">
          <p className="text-xs text-red/80">🎙 Voice error: {voiceError}</p>
        </div>
      )}
      {!voiceError && voiceJoined && (
        <div className="px-4 py-1 bg-green-500/10 border-t border-green-500/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400">
            {isSpeakerOrHost ? (isMuted ? 'Mic off' : 'Live · speaking') : 'Listening'}
          </span>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="px-4 py-3 glass-strong border-t border-dark-600/30">
        <div className="flex items-center gap-2">
          <input
            value={newChat}
            onChange={(e) => setNewChat(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            placeholder="Say something..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-dark-600 text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-accent/20"
          />

          {newChat.trim() ? (
            <button
              onClick={handleSendChat}
              disabled={sendingChat}
              className="p-2.5 rounded-full gradient-accent text-white disabled:opacity-50 flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <>
              {/* Mic toggle — only for host/speaker */}
              {isSpeakerOrHost && (
                <button
                  onClick={toggleMute}
                  className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                    isMuted
                      ? 'bg-red/20 text-red'
                      : 'bg-vibe/20 text-vibe animate-pulse'
                  }`}
                  title={isMuted ? 'Unmute mic' : 'Mute mic'}
                >
                  {isMuted ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                    </svg>
                  )}
                </button>
              )}

              {/* Raise hand — listeners only */}
              {!isSpeakerOrHost && (
                <button
                  onClick={handleRaiseHand}
                  className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                    isHandRaised ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-600 text-text-tertiary hover:bg-dark-500'
                  }`}
                >
                  ✋
                </button>
              )}

              <button
                onClick={() => setShowGifts(!showGifts)}
                className="p-2.5 rounded-full bg-dark-600 text-text-tertiary hover:bg-dark-500 transition-all flex-shrink-0"
              >
                🎁
              </button>
            </>
          )}

          <button
            onClick={handleLeave}
            className="px-4 py-2.5 rounded-2xl bg-red/20 text-red text-sm font-medium hover:bg-red/30 transition-all flex-shrink-0"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
