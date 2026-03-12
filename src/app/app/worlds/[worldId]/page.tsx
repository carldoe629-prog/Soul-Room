'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_WORLDS, MOCK_ROOMS, MOCK_USERS } from '@/lib/mock-data';
import { useParams } from 'next/navigation';

export default function WorldDetailPage() {
  const params = useParams();
  const worldId = params.worldId as string;
  const world = MOCK_WORLDS.find(w => w.id === worldId) || MOCK_WORLDS[0];
  const rooms = MOCK_ROOMS.filter(r => r.worldId === worldId);
  const [activeTab, setActiveTab] = useState<'rooms' | 'feed' | 'members'>('rooms');

  return (
    <div className="animate-fade-in pb-6">
      {/* World Header */}
      <div className="relative h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${world.colorPrimary}33, ${world.colorSecondary}33, transparent)` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{world.emoji}</div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary font-[Outfit]">{world.name}</h1>
              <p className="text-sm text-text-secondary">{world.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-text-secondary">👥 {(world.memberCount / 1000).toFixed(1)}K members</span>
            <span className="flex items-center gap-1 text-xs text-vibe">
              <span className="w-1.5 h-1.5 rounded-full bg-vibe animate-pulse" />
              {rooms.length} rooms live
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-3 mb-4">
        {(['rooms', 'feed', 'members'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'gradient-accent text-white' : 'bg-dark-600 text-text-secondary hover:bg-dark-500'
            }`}
          >
            {tab === 'rooms' ? '🎤 Rooms' : tab === 'feed' ? '📝 Feed' : '👥 Members'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === 'rooms' && (
          <div className="space-y-3 animate-fade-in">
            {/* Create room button */}
            <button className="w-full p-4 rounded-2xl border-2 border-dashed border-dark-400 hover:border-accent/50 flex items-center justify-center gap-2 text-text-tertiary hover:text-accent transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Voice Room
            </button>

            {rooms.map(room => (
              <Link
                key={room.id}
                href={`/app/worlds/${worldId}/rooms/${room.id}`}
                className="block p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
                  <span className="text-xs text-text-tertiary">LIVE • {room.startedMinutesAgo}m ago</span>
                </div>
                <h3 className="text-base font-semibold text-text-primary">{room.title}</h3>
                <div className="text-xs text-text-tertiary mt-1">Hosted by {room.hostName}</div>

                <div className="flex items-center gap-4 mt-3">
                  {/* Speaker avatars */}
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(room.speakerCount, 4))].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-dark-500 border-2 border-dark-700 flex items-center justify-center text-xs">
                        {['👩🏾', '👨🏾', '👩🏻', '👨🏿'][i % 4]}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span>🎙 {room.speakerCount} speaking</span>
                    <span>👂 {room.listenerCount} listening</span>
                  </div>
                </div>

                <div className="flex gap-1.5 mt-3">
                  {room.topics.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-dark-500 text-text-tertiary">{t}</span>
                  ))}
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

        {activeTab === 'feed' && (
          <div className="space-y-3 animate-fade-in">
            {[
              { user: MOCK_USERS[0], text: 'Just had the most amazing conversation in the Late Night Vibes room! 🌙', time: '15 min ago', likes: 12 },
              { user: MOCK_USERS[5], text: 'Who else is into Amapiano? Drop your favorite artists 🇿🇦', time: '1 hour ago', likes: 23 },
              { user: MOCK_USERS[2], text: 'New to this world! Any recommendations for good rooms to join?', time: '2 hours ago', likes: 8 },
            ].map((post, i) => (
              <div key={i} className="p-4 rounded-2xl glass">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-lg">
                    {post.user.gender === 'Female' ? '👩🏾' : '👨🏾'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{post.user.displayName}</div>
                    <div className="text-[10px] text-text-tertiary">{post.time}</div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{post.text}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
                  <button className="hover:text-accent transition-colors">❤️ {post.likes}</button>
                  <button className="hover:text-accent transition-colors">💬 Reply</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-2 animate-fade-in">
            {MOCK_USERS.map(user => (
              <Link
                key={user.id}
                href={`/app/profile/${user.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl glass hover:bg-dark-600/50 transition-all"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-xl">
                    {user.gender === 'Female' ? '👩🏾' : '👨🏾'}
                  </div>
                  {user.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-vibe border-2 border-dark-800" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-text-primary">{user.displayName}, {user.age}</span>
                    {user.isVerified && <span className="text-xs text-blue">✓</span>}
                  </div>
                  <div className="text-xs text-text-tertiary">📍 {user.city} • ⭐ {user.vibeRating}</div>
                </div>
                <span className="text-xs text-text-tertiary">{user.isOnline ? '🟢' : '⚪'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
