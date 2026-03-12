'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_WORLDS, MOCK_ROOMS } from '@/lib/mock-data';

export default function WorldsPage() {
  const [joinedWorlds, setJoinedWorlds] = useState<string[]>(['w1', 'w6', 'w8']);
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');

  const toggleJoin = (worldId: string) => {
    setJoinedWorlds(prev =>
      prev.includes(worldId) ? prev.filter(id => id !== worldId) : [...prev, worldId]
    );
  };

  const displayedWorlds = activeTab === 'joined'
    ? MOCK_WORLDS.filter(w => joinedWorlds.includes(w.id))
    : MOCK_WORLDS;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-text-primary font-[Outfit]">Worlds</h1>
        <p className="text-sm text-text-secondary mt-1">Find your people, find your world</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(['all', 'joined'] as const).map(tab => (
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
      <div className="px-4 mb-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-start/10 to-soul-500/10 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
            <span className="text-sm font-medium text-text-primary">{MOCK_ROOMS.length} rooms live now</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {MOCK_ROOMS.slice(0, 3).map(room => (
              <Link
                key={room.id}
                href={`/app/worlds/${room.worldId}/rooms/${room.id}`}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-dark-700/50 hover:bg-dark-600 transition-all"
              >
                <div className="text-xs font-medium text-text-primary truncate">{room.title}</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">🎙 {room.speakerCount} • 👥 {room.listenerCount}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* World Grid */}
      <div className="px-4 space-y-3 pb-6">
        {displayedWorlds.map(world => {
          const isJoined = joinedWorlds.includes(world.id);
          const worldRooms = MOCK_ROOMS.filter(r => r.worldId === world.id);
          return (
            <div key={world.id} className="p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${world.colorPrimary}22, ${world.colorSecondary}22)` }}
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
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isJoined
                          ? 'bg-dark-500 text-text-secondary hover:bg-red/20 hover:text-red'
                          : 'gradient-accent text-white hover:opacity-90'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{world.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-text-secondary">👥 {(world.memberCount / 1000).toFixed(1)}K</span>
                    {world.activeRoomCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-vibe">
                        <span className="w-1.5 h-1.5 rounded-full bg-vibe animate-pulse" />
                        {world.activeRoomCount} live
                      </span>
                    )}
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {world.topics.slice(0, 4).map(topic => (
                      <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-dark-500 text-text-tertiary">
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Room previews */}
                  {worldRooms.length > 0 && isJoined && (
                    <div className="mt-3 space-y-2">
                      {worldRooms.slice(0, 2).map(room => (
                        <Link
                          key={room.id}
                          href={`/app/worlds/${world.id}/rooms/${room.id}`}
                          className="flex items-center gap-2 p-2 rounded-xl bg-dark-700/50 hover:bg-dark-600 transition-all"
                        >
                          <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
                          <span className="text-xs text-text-primary truncate flex-1">{room.title}</span>
                          <span className="text-[10px] text-text-tertiary">🎙 {room.speakerCount}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
