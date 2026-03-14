'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchNearbyUsers, fetchSparkMatches, fetchRooms, getOrCreateConversation, createSpark, sendSayHi } from '@/lib/db';
import {
  CONVERSATION_STARTERS,
  formatNumber,
  getVipInfo,
  MOCK_USERS,
  MOCK_ROOMS,
  MOCK_SPARK_MATCHES,
} from '@/lib/mock-data';

// ── Types ─────────────────────────────────────────────────

interface DbUser {
  id: string;
  display_name: string;
  age: number;
  gender: string;
  photos: string[];
  is_online: boolean;
  last_online_at: string | null;
  vip_level: number;
  is_verified: boolean;
  vibe_rating: number;
  vibe_rating_count: number;
  city: string;
}

interface SparkMatch {
  id: string;
  matchedUser: DbUser;
  match_score: number;
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

// ── Helpers ───────────────────────────────────────────────

function getLastOnlineMinutes(user: DbUser): number | undefined {
  if (user.is_online) return 0;
  if (!user.last_online_at) return undefined;
  return Math.floor((Date.now() - new Date(user.last_online_at).getTime()) / 60000);
}

// ── Say Hi Modal ──────────────────────────────────────────

const SAY_HI_LIMITS: Record<string, { free: number; vpCost: number }> = {
  free:    { free: 3,          vpCost: 200 },
  plus:    { free: 15,         vpCost: 100 },
  premium: { free: 50,         vpCost: 50  },
  vip:     { free: Infinity,   vpCost: 0   },
};

function getSayHiUsedToday(userId: string): number {
  try {
    const key = `sayhi_${userId}_${new Date().toDateString()}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  } catch { return 0; }
}

function incrementSayHiUsed(userId: string) {
  try {
    const key = `sayhi_${userId}_${new Date().toDateString()}`;
    localStorage.setItem(key, String(getSayHiUsedToday(userId) + 1));
  } catch {}
}

function SayHiModal({
  user,
  currentUserId,
  subscriptionTier,
  vpBalance,
  onClose,
  onSent,
}: {
  user: DbUser;
  currentUserId: string;
  subscriptionTier: string;
  vpBalance: number;
  onClose: () => void;
  onSent: (conversationId: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [sending, setSending] = useState(false);

  const tier = SAY_HI_LIMITS[subscriptionTier] ?? SAY_HI_LIMITS.free;
  const usedToday = getSayHiUsedToday(currentUserId);
  const freeRemaining = tier.free === Infinity ? Infinity : Math.max(0, tier.free - usedToday);
  const isFree = freeRemaining > 0;
  const vpCost = isFree ? 0 : tier.vpCost;
  const canAfford = isFree || vpBalance >= vpCost;

  const handleSend = async () => {
    const msg =
      custom.trim() ||
      (selected !== null ? `${CONVERSATION_STARTERS[selected].emoji} ${CONVERSATION_STARTERS[selected].text}` : '');
    if (!msg || !canAfford) return;
    setSending(true);
    try {
      await sendSayHi(currentUserId, user.id, msg, vpCost);
      const convo = await getOrCreateConversation(currentUserId, user.id);
      incrementSayHiUsed(currentUserId);
      onSent(convo.id);
    } catch {
      // ignore
    } finally {
      setSending(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-3xl glass-strong p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-text-primary mb-1">
          💬 Say Hi to {user.display_name}
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Choose a conversation starter or write your own:
        </p>

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
          {tier.free === Infinity ? (
            <span className="text-accent font-bold">∞ free Say Hi (VIP)</span>
          ) : (
            <span>Free remaining: <span className="text-accent font-bold">{freeRemaining} of {tier.free}</span></span>
          )}
          <span>💎 {formatNumber(vpBalance)} VP</span>
        </div>

        {!canAfford && (
          <p className="text-xs text-red-400 mb-3 text-center">Not enough VP. <Link href="/app/vp" className="underline">Get more →</Link></p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl glass text-text-secondary text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (!custom.trim() && selected === null) || !canAfford}
            className="flex-1 py-3 rounded-2xl gradient-accent text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {sending ? 'Sending…' : isFree ? 'Send (FREE ✨)' : `Send (💎 ${vpCost} VP)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section 1: Spark Matches ──────────────────────────────

function SparkMatchesSection({
  matches,
  currentUserId,
  loading,
}: {
  matches: SparkMatch[];
  currentUserId: string;
  loading: boolean;
}) {
  const handleSpark = async (toId: string) => {
    await createSpark(currentUserId, toId, 75);
  };

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
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40 h-56 rounded-2xl glass animate-pulse snap-start" />
            ))
          : matches.map((match) => {
              const u = match.matchedUser;
              const vipInfo = getVipInfo(u.vip_level);
              const avatar = u.photos?.[0];
              return (
                <div key={match.id} className="flex-shrink-0 w-40 rounded-2xl glass overflow-hidden snap-start hover:scale-[1.02] transition-all">
                  <div className="relative h-44 bg-gradient-to-br from-dark-600 to-dark-800">
                    {avatar ? (
                      <img src={avatar} alt={u.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {u.gender === 'Female' ? '👩🏾' : '👨🏾'}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-dark-900/90 to-transparent">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-sm font-bold text-white leading-tight">{u.display_name}, {u.age}</span>
                        {vipInfo.badge && <span className="text-xs">{vipInfo.badge}</span>}
                      </div>
                      {u.city && <div className="text-[10px] text-text-secondary">📍{u.city}</div>}
                      <div className="text-[10px] text-vibe font-semibold">{match.match_score}% Match</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSpark(u.id)}
                    className="w-full py-2 text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-all"
                  >
                    ⚡ Spark
                  </button>
                </div>
              );
            })}

        {/* Upgrade CTA */}
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

// ── Section 2: Discover ───────────────────────────────────

function PeopleOnlineSection({
  users,
  loading,
  avatarUrl,
  onSayHi,
}: {
  users: DbUser[];
  loading: boolean;
  avatarUrl?: string;
  onSayHi: (user: DbUser) => void;
}) {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Women', 'Men', 'My Interests'];

  const filtered = users
    .filter((u) => {
      if (filter === 'Women') return u.gender === 'Female';
      if (filter === 'Men') return u.gender === 'Male';
      return true;
    })
    .sort((a, b) => (getLastOnlineMinutes(a) ?? 999) - (getLastOnlineMinutes(b) ?? 999));

  return (
    <section className="mb-6">
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-dark-600/50 flex items-center justify-center flex-shrink-0 border border-white/5 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Me" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xs text-text-secondary">Me</span>
              )}
            </button>
            <h2 className="text-xl font-bold text-white tracking-wide">Discover</h2>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-dark-600 transition-colors">🔔</button>
            <button className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-dark-600 transition-colors">⚙️</button>
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
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f
                  ? 'gradient-accent text-white shadow-[0_0_10px_rgba(244,53,221,0.3)]'
                  : 'glass text-[#DCA8EE] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 px-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full aspect-[3/4] rounded-[24px] glass animate-pulse" />
            ))
          : filtered.slice(0, 4).map((user) => (
              <UserProfileCard key={user.id} user={user} onSayHi={onSayHi} />
            ))}
      </div>
    </section>
  );
}

// ── User Profile Card ─────────────────────────────────────

function UserProfileCard({ user, onSayHi }: { user: DbUser; onSayHi: (u: DbUser) => void }) {
  const vipInfo = getVipInfo(user.vip_level);
  const avatar = user.photos?.[0];

  return (
    <div className="block relative w-full aspect-[3/4] rounded-[24px] overflow-hidden group shadow-lg">
      <Link href={`/app/profile/${user.id}`}>
        {avatar ? (
          <img
            src={avatar}
            alt={user.display_name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-6xl">
            {user.gender === 'Female' ? '👩🏾' : '👨🏾'}
          </div>
        )}
      </Link>

      {/* Top badges */}
      <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start z-10 pointer-events-none">
        {user.is_online ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-vibe glow-vibe" />
            <span className="text-[9px] text-white font-semibold tracking-wider">Active</span>
          </div>
        ) : <div />}
        <button className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 text-white/80 hover:bg-black/50 transition-colors pointer-events-auto">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* Say Hi FAB */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSayHi(user); }}
        className="absolute bottom-[70px] right-3 w-10 h-10 rounded-full gradient-accent flex items-center justify-center shadow-[0_4px_15px_rgba(244,53,221,0.5)] hover:scale-110 transition-transform duration-300 z-20"
      >
        <span className="text-white text-lg">🤍</span>
      </button>

      {/* Info overlay */}
      <Link
        href={`/app/profile/${user.id}`}
        className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#160824] via-[#160824]/80 to-transparent p-3 pt-12 flex flex-col justify-end z-10 pointer-events-auto"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base font-bold text-white leading-tight">{user.display_name} {user.age}</span>
          {vipInfo.badge && <span className="text-sm">{vipInfo.badge}</span>}
          {user.is_verified && (
            <span className="text-blue flex items-center justify-center w-3 h-3 bg-blue/20 rounded-full text-[8px]">✓</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#DCA8EE]">
          {user.city && <span className="flex items-center gap-0.5">📍 {user.city}</span>}
          {user.vibe_rating_count > 0 && <span>• ⭐ {user.vibe_rating}</span>}
        </div>
      </Link>
    </div>
  );
}

// ── Ad Card ───────────────────────────────────────────────

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

// ── Section 3: Live Rooms ─────────────────────────────────

function LiveRoomsSection({ rooms, loading }: { rooms: Room[]; loading: boolean }) {
  return (
    <section className="mb-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-text-primary">🎤 Live Rooms From Your Worlds</h2>
        <Link href="/app/worlds" className="text-xs text-accent font-medium">Browse All →</Link>
      </div>
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl glass animate-pulse" />
            ))
          : rooms.slice(0, 2).map((room) => (
              <Link
                key={room.id}
                href={`/app/worlds/${room.world_id}/rooms/${room.id}`}
                className="block p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all border border-white/5 shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">🔴 LIVE</span>
                  <span className="text-sm font-bold text-white flex-1 truncate">{room.title}</span>
                  {room.listener_count > 50 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold">🔥 TRENDING</span>
                  )}
                </div>
                {room.worlds && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
                    {room.worlds.emoji} <span className="font-medium">{room.worlds.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-text-tertiary">🎤 Hosted by @{room.host_name}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-vibe">{room.speaker_count}</span>
                    <span className="text-xs text-text-tertiary">/ 10 speakers</span>
                  </div>
                </div>
              </Link>
            ))}
        {!loading && rooms.length === 0 && (
          <div className="p-6 rounded-2xl glass text-center">
            <p className="text-text-tertiary text-sm">No live rooms right now</p>
            <Link href="/app/worlds" className="text-xs text-accent mt-2 block">Browse worlds →</Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function AppHomePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, isDemoMode } = useAuth();

  const [nearbyUsers, setNearbyUsers] = useState<DbUser[]>([]);
  const [sparkMatches, setSparkMatches] = useState<SparkMatch[]>([]);
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSparks, setLoadingSparks] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showSayHiModal, setShowSayHiModal] = useState<DbUser | null>(null);

  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      setNearbyUsers(MOCK_USERS.map((u) => ({
        id: u.id, display_name: u.displayName, age: u.age, gender: u.gender,
        photos: u.photos ?? [], is_online: u.isOnline, last_online_at: null,
        vip_level: u.vipLevel, is_verified: u.isVerified,
        vibe_rating: u.vibeRating, vibe_rating_count: u.vibeRatingCount, city: u.city,
      })));
      setSparkMatches(MOCK_SPARK_MATCHES.map((m) => ({
        id: m.id,
        matchedUser: {
          id: m.user.id, display_name: m.user.displayName, age: m.user.age,
          gender: m.user.gender, photos: m.user.photos ?? [], is_online: m.user.isOnline,
          last_online_at: null, vip_level: m.user.vipLevel, is_verified: m.user.isVerified,
          vibe_rating: m.user.vibeRating, vibe_rating_count: m.user.vibeRatingCount, city: m.user.city,
        },
        match_score: m.matchScore,
      })));
      setLiveRooms(MOCK_ROOMS.filter((r) => r.isLive).map((r) => ({
        id: r.id, world_id: r.worldId, title: r.title, host_name: r.hostName,
        speaker_count: r.speakerCount, listener_count: r.listenerCount, is_live: r.isLive,
      })));
      setLoadingUsers(false);
      setLoadingSparks(false);
      setLoadingRooms(false);
      return;
    }

    fetchNearbyUsers({ limit: 20 })
      .then((data) => setNearbyUsers((data as DbUser[]).filter((u) => u.id !== user.id)))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));

    fetchSparkMatches(user.id)
      .then((data) => setSparkMatches(data as SparkMatch[]))
      .catch(() => {})
      .finally(() => setLoadingSparks(false));

    fetchRooms()
      .then((data) => setLiveRooms(data as Room[]))
      .catch(() => {})
      .finally(() => setLoadingRooms(false));
  }, [user, isDemoMode]);

  const vpBalance = profile?.vibe_points ?? 0;
  const avatarUrl = profile?.photos?.[0] || profile?.avatar_url || undefined;

  return (
    <div className="pb-10 pt-4 font-[Outfit]">
      <SparkMatchesSection
        matches={sparkMatches}
        currentUserId={user?.id ?? ''}
        loading={loadingSparks}
      />
      <AdCard />
      <PeopleOnlineSection
        users={nearbyUsers}
        loading={loadingUsers}
        avatarUrl={avatarUrl}
        onSayHi={setShowSayHiModal}
      />
      <LiveRoomsSection rooms={liveRooms} loading={loadingRooms} />

      {showSayHiModal && user && (
        <SayHiModal
          user={showSayHiModal}
          currentUserId={user.id}
          subscriptionTier={profile?.subscription_tier ?? 'free'}
          vpBalance={vpBalance}
          onClose={() => setShowSayHiModal(null)}
          onSent={(conversationId) => {
            refreshProfile();
            router.push(`/app/chat/${conversationId}`);
          }}
        />
      )}
    </div>
  );
}
