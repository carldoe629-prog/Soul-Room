'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { fetchWorlds, fetchRooms } from '@/lib/db';
import { MOCK_WORLDS, MOCK_ROOMS } from '@/lib/mock-data';

interface World {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description: string;
  member_count: number;
  active_room_count: number;
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
  speaker_count: number;
  listener_count: number;
  is_live: boolean;
  worlds?: { name: string; emoji: string };
}

export default function WorldsPage() {
  const { isDemoMode } = useAuth();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingWorlds, setLoadingWorlds] = useState(true);
  const [joinedWorlds, setJoinedWorlds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');

  useEffect(() => {
    if (isDemoMode) {
      setWorlds(MOCK_WORLDS.map((w) => ({
        id: w.id, name: w.name, slug: w.slug, emoji: w.emoji,
        description: w.description, member_count: w.memberCount,
        active_room_count: w.activeRoomCount, color_primary: w.colorPrimary,
        color_secondary: w.colorSecondary, topics: w.topics, category: 'general',
      })));
      setRooms(MOCK_ROOMS.map((r) => ({
        id: r.id, world_id: r.worldId, title: r.title, host_name: r.hostName,
        speaker_count: r.speakerCount, listener_count: r.listenerCount, is_live: r.isLive,
      })));
      setLoadingWorlds(false);
      return;
    }
    fetchWorlds()
      .then((data) => setWorlds(data as World[]))
      .catch(() => {})
      .finally(() => setLoadingWorlds(false));

    fetchRooms()
      .then((data) => setRooms(data as Room[]))
      .catch(() => {});
  }, [isDemoMode]);

  const toggleJoin = (worldId: string) => {
    setJoinedWorlds((prev) =>
      prev.includes(worldId) ? prev.filter((id) => id !== worldId) : [...prev, worldId]
    );
  };

  const displayedWorlds = activeTab === 'joined'
    ? worlds.filter((w) => joinedWorlds.includes(w.id))
    : worlds;

  const liveRooms = rooms.filter((r) => r.is_live).slice(0, 3);

  return (
    <div className="animate-fade-in font-[Outfit]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-text-primary">Worlds</h1>
        <p className="text-sm text-text-secondary mt-1">Find your people, find your world</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(['all', 'joined'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'gradient-accent text-white' : 'bg-dark-600 text-text-secondary hover:bg-dark-500'
            }`}
          >
            {tab === 'all' ? 'All Worlds' : `My Worlds (${joinedWorlds.length})`}
          </button>
        ))}
      </div>

      {/* Live Rooms Banner */}
      {liveRooms.length > 0 && (
        <div className="px-4 mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-start/10 to-soul-500/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
              <span className="text-sm font-medium text-text-primary">{rooms.filter((r) => r.is_live).length} rooms live now</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {liveRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/app/worlds/${room.world_id}/rooms/${room.id}`}
                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-dark-700/50 hover:bg-dark-600 transition-all"
                >
                  <div className="text-xs font-medium text-text-primary truncate max-w-[120px]">{room.title}</div>
                  <div className="text-[10px] text-text-tertiary mt-0.5">🎙 {room.speaker_count} · 👥 {room.listener_count}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* World Grid */}
      <div className="px-4 space-y-3 pb-6">
        {loadingWorlds
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl glass animate-pulse" />
            ))
          : displayedWorlds.map((world) => {
              const isJoined = joinedWorlds.includes(world.id);
              const worldRooms = rooms.filter((r) => r.world_id === world.id && r.is_live);
              return (
                <div key={world.id} className="p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${world.color_primary ?? '#FF4B6E'}22, ${world.color_secondary ?? '#8B5CF6'}22)` }}
                    >
                      {world.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Link href={`/app/worlds/${world.id}`} className="text-base font-semibold text-text-primary hover:text-accent transition-colors">
                          {world.name}
                        </Link>
                        <button
                          onClick={() => toggleJoin(world.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ml-2 ${
                            isJoined
                              ? 'bg-dark-500 text-text-secondary hover:bg-red/20 hover:text-red'
                              : 'gradient-accent text-white hover:opacity-90'
                          }`}
                        >
                          {isJoined ? 'Joined' : 'Join'}
                        </button>
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{world.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-text-secondary">👥 {world.member_count >= 1000 ? `${(world.member_count / 1000).toFixed(1)}K` : world.member_count}</span>
                        {worldRooms.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-vibe">
                            <span className="w-1.5 h-1.5 rounded-full bg-vibe animate-pulse" />
                            {worldRooms.length} live
                          </span>
                        )}
                      </div>

                      {/* Topics */}
                      {world.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {world.topics.slice(0, 4).map((topic) => (
                            <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-dark-500 text-text-tertiary">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Room previews for joined worlds */}
                      {worldRooms.length > 0 && isJoined && (
                        <div className="mt-3 space-y-2">
                          {worldRooms.slice(0, 2).map((room) => (
                            <Link
                              key={room.id}
                              href={`/app/worlds/${world.id}/rooms/${room.id}`}
                              className="flex items-center gap-2 p-2 rounded-xl bg-dark-700/50 hover:bg-dark-600 transition-all"
                            >
                              <span className="w-2 h-2 rounded-full bg-red animate-pulse flex-shrink-0" />
                              <span className="text-xs text-text-primary truncate flex-1">{room.title}</span>
                              <span className="text-[10px] text-text-tertiary flex-shrink-0">🎙 {room.speaker_count}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

        {!loadingWorlds && displayedWorlds.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-sm">{activeTab === 'joined' ? "You haven't joined any worlds yet" : 'No worlds found'}</p>
            {activeTab === 'joined' && (
              <button onClick={() => setActiveTab('all')} className="text-xs text-accent mt-2">Browse all worlds →</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
