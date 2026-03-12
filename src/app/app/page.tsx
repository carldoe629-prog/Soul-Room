'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MOCK_USERS,
  MOCK_SPARK_MATCHES,
  MOCK_ROOMS,
  MOCK_WORLDS,
  MOCK_EVENTS,
  MOCK_CHALLENGES,
  CURRENT_USER,
  CONVERSATION_STARTERS,
  formatNumber,
  getVipInfo,
  type User,
} from '@/lib/mock-data';

// ===== ONLINE STATUS HELPERS =====
function OnlineIndicator({ user }: { user: User }) {
  if (user.isOnline && (user.lastOnlineMinutes === 0 || !user.lastOnlineMinutes)) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-vibe animate-pulse inline-block" />
        <span className="text-xs text-vibe font-medium">Online now</span>
      </span>
    );
  }
  if (user.lastOnlineMinutes && user.lastOnlineMinutes <= 30) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
        <span className="text-xs text-amber-400 font-medium">{user.lastOnlineMinutes} min ago</span>
      </span>
    );
  }
  return user.lastSeen ? (
    <span className="text-xs text-text-tertiary">Last seen {user.lastSeen}</span>
  ) : null;
}

function MatchScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-vibe' : 'text-amber-400';
  return score >= 60 ? (
    <span className={`text-xs font-semibold ${color}`}>🎯 {score}% match</span>
  ) : null;
}

// ===== SAY HI MODAL =====
function SayHiModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl glass-strong p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-text-primary mb-1">💬 Say Hi to {user.displayName}</h3>
        <p className="text-xs text-text-secondary mb-4">Choose a conversation starter or write your own:</p>

        <div className="space-y-2 mb-4">
          {CONVERSATION_STARTERS.map((starter, i) => (
            <button
              key={i}
              className={`w-full text-left p-3 rounded-2xl text-sm transition-all ${
                selected === i
                  ? 'bg-accent/15 border border-accent/30 text-text-primary'
                  : 'glass text-text-secondary hover:bg-dark-500/50'
              }`}
              onClick={() => { setSelected(i); setCustom(''); }}
            >
              {starter.emoji} {starter.text}
            </button>
          ))}
          <div>
            <textarea
              placeholder="✏️ Write your own message..."
              value={custom}
              maxLength={300}
              className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              rows={2}
              onClick={() => setSelected(null)}
              onChange={(e) => setCustom(e.target.value)}
            />
            <div className="text-[10px] text-text-tertiary text-right">{custom.length}/300</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-tertiary mb-4">
          <span>Free Say Hi remaining: <span className="text-accent font-bold">2 of 3</span></span>
          <span>💎 {formatNumber(CURRENT_USER.vibePoints)} VP</span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl glass text-text-secondary text-sm font-semibold">
            Cancel
          </button>
          <button className="flex-1 py-3 rounded-2xl gradient-accent text-white text-sm font-bold hover:opacity-90 transition-all">
            Send (FREE ✨)
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== SECTION 1: SPARK MATCHES =====
function SparkMatchesSection() {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">⚡ Your Spark Matches</h2>
          <p className="text-xs text-accent">1 free Spark call today</p>
        </div>
        <Link href="/app/spark" className="text-xs text-accent font-medium">See All →</Link>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-2 px-4 no-scrollbar snap-x snap-mandatory">
        {MOCK_SPARK_MATCHES.map((match) => (
          <div key={match.id} className="flex-shrink-0 w-40 rounded-2xl glass overflow-hidden snap-start hover:scale-[1.02] transition-all">
            <div className="relative h-44 bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center">
              <span className="text-5xl">{match.user.gender === 'Female' ? '👩🏾' : '👨🏾'}</span>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-dark-900/90 to-transparent">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm font-bold text-white leading-tight">{match.user.displayName}, {match.user.age}</span>
                  {getVipInfo(match.user.vipLevel).badge && <span className="text-xs">{getVipInfo(match.user.vipLevel).badge}</span>}
                </div>
                <div className="text-[10px] text-text-secondary">📍{match.user.city}</div>
                <div className="text-[10px] text-vibe font-semibold">{match.matchScore}% Match</div>
              </div>
            </div>
            <button className="w-full py-2 text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-all">
              ⚡ Spark
            </button>
          </div>
        ))}

        {/* Upgrade CTA card */}
        <div className="flex-shrink-0 w-40 rounded-2xl glass overflow-hidden snap-start flex flex-col items-center justify-center p-4 text-center">
          <div className="text-3xl mb-2">🔒</div>
          <p className="text-xs font-bold text-text-primary mb-1">Get Plus</p>
          <p className="text-[10px] text-text-secondary mb-3">for 5 Sparks per day</p>
          <Link href="/app/subscribe" className="text-[10px] px-4 py-1.5 rounded-full gradient-accent text-white font-bold">
            Upgrade
          </Link>
        </div>
      </div>
    </section>
  );
}

// ===== SECTION 2: DISCOVER MATCHES =====
function PeopleOnlineSection({ onSayHi }: { onSayHi: (user: User) => void }) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Women', 'Men', 'My Interests'];

  const filteredUsers = MOCK_USERS.filter(u => {
    if (u.isNew) return false;
    if (filter === 'Women') return u.gender === 'Female';
    if (filter === 'Men') return u.gender === 'Male';
    return true;
  }).sort((a, b) => (a.lastOnlineMinutes ?? 999) - (b.lastOnlineMinutes ?? 999));

  return (
    <section className="mb-6">
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-dark-600/50 flex items-center justify-center flex-shrink-0 border border-white/5">
               <img src={CURRENT_USER.photos[0]} alt="Me" className="w-full h-full rounded-full object-cover" />
            </button>
            <h2 className="text-xl font-bold text-white tracking-wide">Discover</h2>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-dark-600 transition-colors">
              🔔
            </button>
            <button className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-dark-600 transition-colors">
              ⚙️
            </button>
          </div>
        </div>

        <div className="glass-strong p-3 rounded-2xl flex items-center justify-between mb-4 border border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Unlock all your Likes</h3>
            <p className="text-[10px] text-text-secondary">See everyone who is interested in you</p>
          </div>
          <Link href="/app/subscribe" className="px-3 py-1.5 rounded-full bg-soul-600/30 text-soul-200 text-[10px] font-bold border border-soul-500/50">
            Go Premium
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f ? 'gradient-accent text-white shadow-[0_0_10px_rgba(244,53,221,0.3)]' : 'glass text-[#DCA8EE] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 px-4">
        {filteredUsers.slice(0, 4).map((user) => (
          <UserProfileCard key={user.id} user={user} onSayHi={onSayHi} />
        ))}
      </div>
    </section>
  );
}

// ===== USER PROFILE CARD (Feed Card) =====
function UserProfileCard({ user, onSayHi }: { user: User; onSayHi: (user: User) => void }) {
  return (
    <div className="block relative w-full aspect-[3/4] rounded-[24px] overflow-hidden group shadow-lg">
      <Link href={`/app/profile/${user.id}`}>
        <img src={user.photos[0]} alt={user.displayName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform" />
      </Link>
      {/* Top badges */}
      <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start z-10 pointer-events-none">
        {user.isOnline ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-vibe glow-vibe" />
            <span className="text-[9px] text-white font-semibold tracking-wider">Active</span>
          </div>
        ) : <div />}
        <button className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 text-white/80 hover:bg-black/50 transition-colors pointer-events-auto">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSayHi(user); }}
        className="absolute bottom-[70px] right-3 w-10 h-10 rounded-full gradient-accent flex items-center justify-center shadow-[0_4px_15px_rgba(244,53,221,0.5)] hover:scale-110 transition-transform duration-300 z-20"
      >
        <span className="text-white text-lg">🤍</span>
      </button>

      {/* Info Overlay */}
      <Link href={`/app/profile/${user.id}`} className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#160824] via-[#160824]/80 to-transparent p-3 pt-12 flex flex-col justify-end z-10 pointer-events-auto">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base font-bold text-white leading-tight">{user.displayName} {user.age}</span>
          {getVipInfo(user.vipLevel).badge && <span className="text-sm">{getVipInfo(user.vipLevel).badge}</span>}
          {user.isVerified && (
            <span className="text-blue flex items-center justify-center w-3 h-3 bg-blue/20 rounded-full text-[8px]">✓</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#DCA8EE]">
          <span className="flex items-center gap-0.5">📍 1.2km</span>
          {user.vibeRatingCount > 0 && <span>• ⭐ {user.vibeRating}</span>}
        </div>
      </Link>
    </div>
  );
}

// ===== AD CARD (Free tier) =====
function AdCard() {
  return (
    <div className="mx-4 mb-3 p-4 rounded-2xl glass border border-dark-400/30 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Sponsored</span>
          <p className="text-sm font-bold text-white mt-1">Upgrade to remove ads</p>
        </div>
        <Link href="/app/subscribe" className="text-xs px-4 py-2 rounded-full gradient-accent text-white font-bold shadow-md">
          Spark Plus $7.99/mo
        </Link>
      </div>
    </div>
  );
}

// ===== SECTION 3: LIVE VOICE ROOMS =====
function LiveRoomsSection() {
  const rooms = MOCK_ROOMS.slice(0, 2);
  return (
    <section className="mb-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-text-primary">🎤 Live Rooms From Your Worlds</h2>
        <Link href="/app/worlds" className="text-xs text-accent font-medium">Browse All →</Link>
      </div>
      <div className="space-y-3">
        {rooms.map(room => {
          const world = MOCK_WORLDS.find(w => w.id === room.worldId);
          return (
            <Link
              key={room.id}
              href={`/app/worlds/${room.worldId}/rooms/${room.id}`}
              className="block p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all border border-white/5 shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">🔴 LIVE</span>
                <span className="text-sm font-bold text-white flex-1 truncate">{room.title}</span>
                {room.isTrending && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold">🔥 TRENDING</span>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">{world?.emoji} <span className="font-medium">{world?.name}</span></div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-text-tertiary">
                  🎤 Hosted by @{room.hostName} {'⭐'.repeat(room.hostRating)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-vibe">{room.speakerCount}</span>
                  <span className="text-xs text-text-tertiary">/ 10 speakers</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ===== MAIN PAGE COMPONENT =====
export default function AppHomePage() {
  const [showSayHiModal, setShowSayHiModal] = useState<User | null>(null);

  return (
    <div className="pb-10 pt-4 font-[Outfit]">
      <SparkMatchesSection />
      <AdCard />
      <PeopleOnlineSection onSayHi={setShowSayHiModal} />
      <LiveRoomsSection />
      
      {showSayHiModal && (
        <SayHiModal user={showSayHiModal} onClose={() => setShowSayHiModal(null)} />
      )}
    </div>
  );
}
