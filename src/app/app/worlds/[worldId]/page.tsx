'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchWorld, fetchRooms, fetchNearbyUsers, createRoom } from '@/lib/db';

interface World {
  id: string;
  name: string;
  emoji: string;
  description: string;
  member_count: number;
  color_primary: string;
  color_secondary: string;
  topics: string[];
  category: string;
}

interface Room {
  id: string;
  world_id: string;
  title: string;
  host_name: string;
  host_id: string;
  speaker_count: number;
  listener_count: number;
  is_live: boolean;
  created_at: string;
}

interface Member {
  id: string;
  display_name: string;
  gender: string;
  age: number;
  city: string;
  photos: string[];
  is_online: boolean;
  is_verified: boolean;
  vibe_rating: number;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function WorldDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const worldId = params.worldId as string;

  const [world, setWorld] = useState<World | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'members'>('rooms');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!worldId) return;

    Promise.all([
      fetchWorld(worldId).then((w) => setWorld(w as World)).catch(() => {}),
      fetchRooms(worldId).then((r) => setRooms(r as Room[])).catch(() => {}),
      fetchNearbyUsers({ limit: 20 }).then((u) => setMembers(u as Member[])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [worldId]);

  const handleCreateRoom = async () => {
    if (!user || !newRoomTitle.trim()) return;
    setCreating(true);
    try {
      const room = await createRoom(worldId, user.id, newRoomTitle.trim(), profile?.display_name ?? '');
      router.push(`/app/worlds/${worldId}/rooms/${room.id}`);
    } catch (e) {
      console.error('Failed to create room', e);
    } finally {
      setCreating(false);
      setShowCreateRoom(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in pb-6">
        <div className="h-44 glass animate-pulse" />
        <div className="px-4 mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl glass animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="text-4xl">🌍</div>
        <p className="text-text-secondary text-sm">World not found</p>
        <button onClick={() => router.back()} className="text-accent text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-6 font-[Outfit]">
      {/* World Header */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${world.color_primary ?? '#FF4B6E'}33, ${world.color_secondary ?? '#8B5CF6'}33, transparent)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
        <div className="absolute top-4 left-4">
          <button onClick={() => router.back()} className="p-2 rounded-full glass text-text-secondary hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{world.emoji}</div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{world.name}</h1>
              <p className="text-sm text-text-secondary line-clamp-1">{world.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-text-secondary">
              👥 {world.member_count >= 1000 ? `${(world.member_count / 1000).toFixed(1)}K` : world.member_count} members
            </span>
            {rooms.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-vibe">
                <span className="w-1.5 h-1.5 rounded-full bg-vibe animate-pulse" />
                {rooms.length} live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-3 mb-4">
        {(['rooms', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'gradient-accent text-white' : 'bg-dark-600 text-text-secondary hover:bg-dark-500'
            }`}
          >
            {tab === 'rooms' ? '🎤 Rooms' : '👥 Members'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === 'rooms' && (
          <div className="space-y-3 animate-fade-in">
            {/* Create room */}
            {!showCreateRoom ? (
              <button
                onClick={() => setShowCreateRoom(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-dark-400 hover:border-accent/50 flex items-center justify-center gap-2 text-text-tertiary hover:text-accent transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Voice Room
              </button>
            ) : (
              <div className="p-4 rounded-2xl glass space-y-3">
                <input
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="Room title…"
                  maxLength={80}
                  className="w-full bg-dark-700 px-4 py-2.5 rounded-xl text-sm text-text-primary placeholder-text-tertiary outline-none focus:ring-2 focus:ring-accent/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 py-2.5 rounded-xl glass text-text-secondary text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomTitle.trim() || creating}
                    className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-bold disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Go Live 🎤'}
                  </button>
                </div>
              </div>
            )}

            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/app/worlds/${worldId}/rooms/${room.id}`}
                className="block p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
                  <span className="text-xs text-text-tertiary">LIVE · {timeAgo(room.created_at)}</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary">{room.title}</h3>
                <div className="text-xs text-text-tertiary mt-1">Hosted by {room.host_name || 'Unknown'}</div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(room.speaker_count, 4) }).map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-dark-500 border-2 border-dark-700 flex items-center justify-center text-xs">
                        {['👩🏾', '👨🏾', '👩🏻', '👨🏿'][i % 4]}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span>🎙 {room.speaker_count} speaking</span>
                    <span>👂 {room.listener_count} listening</span>
                  </div>
                </div>
              </Link>
            ))}

            {rooms.length === 0 && (
              <div className="text-center py-12 text-text-tertiary">
                <div className="text-4xl mb-3">🎤</div>
                <p className="text-sm">No rooms live right now</p>
                <p className="text-xs mt-1">Be the first to start a conversation!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-2 animate-fade-in">
            {members.map((member) => {
              const avatar = member.photos?.[0];
              return (
                <Link
                  key={member.id}
                  href={`/app/profile/${member.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl glass hover:bg-dark-600/50 transition-all"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 overflow-hidden flex-shrink-0">
                      {avatar ? (
                        <img src={avatar} alt={member.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          {member.gender === 'Female' ? '👩🏾' : '👨🏾'}
                        </div>
                      )}
                    </div>
                    {member.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-vibe border-2 border-dark-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-text-primary truncate">{member.display_name}, {member.age}</span>
                      {member.is_verified && <span className="text-xs text-blue flex-shrink-0">✓</span>}
                    </div>
                    <div className="text-xs text-text-tertiary truncate">
                      {member.city && `📍 ${member.city}`}
                      {member.vibe_rating > 0 && ` · ⭐ ${member.vibe_rating}`}
                    </div>
                  </div>
                  <span className="text-xs text-text-tertiary flex-shrink-0">{member.is_online ? '🟢' : '⚪'}</span>
                </Link>
              );
            })}
            {members.length === 0 && (
              <div className="text-center py-12 text-text-tertiary">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-sm">No members found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
