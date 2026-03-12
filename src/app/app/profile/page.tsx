'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CURRENT_USER,
  INTEREST_TAGS,
  SUBSCRIPTION_TIERS,
  MOCK_WORLDS,
  MOCK_POPULARITY,
  CURRENT_USER_VIP,
  getVipInfo,
  SOCIAL_STATS,
  EARNINGS_WALLET,
  USER_INVENTORY,
  USER_ACHIEVEMENTS,
  DAILY_CHALLENGE,
  formatNumber,
} from '@/lib/mock-data';

// ===== RED DOT INDICATOR =====
function RedDot() {
  return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red border-2 border-dark-900 animate-pulse" />;
}

// ===== CONTROL CENTER USER CARD =====
function UserCard() {
  const vip = getVipInfo(CURRENT_USER.vipLevel);
  const [copied, setCopied] = useState(false);
  const userId = '8829102';

  const copyId = () => {
    navigator.clipboard?.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-4 mt-4 p-5 rounded-3xl glass relative overflow-hidden">
      {/* Background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-start/5 via-transparent to-soul-500/5" />

      <div className="relative flex items-center gap-4">
        {/* Round avatar with VIP frame ring */}
        <div className="relative flex-shrink-0">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl border-[3px] ${
            CURRENT_USER.vipLevel >= 5 ? 'border-soul-400 shadow-[0_0_12px_rgba(155,93,229,0.3)]' :
            CURRENT_USER.vipLevel >= 3 ? 'border-accent shadow-[0_0_10px_rgba(255,107,107,0.2)]' :
            'border-dark-400'
          } bg-gradient-to-br from-dark-600 to-dark-800`}>
            👩🏾
          </div>
          {CURRENT_USER.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue flex items-center justify-center border-2 border-dark-900">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Name, ID, info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-text-primary font-[Outfit]">{CURRENT_USER.displayName}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-text-tertiary">ID: {userId}</span>
            <button onClick={copyId} className="text-[10px] text-accent hover:text-accent/80 transition-colors">
              {copied ? '✓ Copied' : '📋'}
            </button>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {CURRENT_USER.gender === 'Female' ? '♀️' : '♂️'} {CURRENT_USER.age} &nbsp;📍 {CURRENT_USER.country}
          </div>

          {/* VP + VIP badges */}
          <div className="flex items-center gap-2 mt-2.5">
            <Link href="/app/vp" className="px-3 py-1 rounded-full bg-soul-500/15 text-soul-400 text-xs font-bold hover:bg-soul-500/25 transition-all">
              💎 {formatNumber(CURRENT_USER.vibePoints)} VP
            </Link>
            <Link href="/app/vip-level" className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-all">
              {vip.badge || '🆕'} Level {CURRENT_USER.vipLevel} {vip.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SOCIAL STATS ROW (Friends / Following / Followers / Visitors) =====
function SocialStatsRow() {
  const stats = SOCIAL_STATS;
  return (
    <div className="grid grid-cols-4 gap-2 px-4 mt-3">
      {[
        { value: stats.friends, label: 'Friends' },
        { value: stats.following, label: 'Following' },
        { value: stats.followers, label: 'Followers' },
        { value: stats.visitors, label: 'Visitors', dot: stats.newVisitors > 0 },
      ].map(s => (
        <button key={s.label} className="relative p-2.5 rounded-2xl glass text-center hover:bg-dark-600/50 transition-all">
          {s.dot && <RedDot />}
          <div className="text-lg font-bold text-text-primary">{s.value}</div>
          <div className="text-[10px] text-text-tertiary">{s.label}</div>
        </button>
      ))}
    </div>
  );
}

// ===== PRIMARY ACTION BUTTONS (Money Buttons) =====
function PrimaryActions() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 mt-4">
      <Link
        href="/app/vp"
        className="relative p-4 rounded-2xl text-center overflow-hidden group hover:scale-[1.02] transition-transform"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative">
          <span className="text-2xl">💰</span>
          <div className="text-sm font-bold text-white mt-1">RECHARGE VP</div>
          <div className="text-[10px] text-white/70">Buy Vibe Points</div>
        </div>
      </Link>
      <Link
        href="/app/vip-level"
        className="relative p-4 rounded-2xl text-center overflow-hidden group hover:scale-[1.02] transition-transform"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative">
          <span className="text-2xl">👑</span>
          <div className="text-sm font-bold text-white mt-1">VIP / NOBILITY</div>
          <div className="text-[10px] text-white/70">{getVipInfo(CURRENT_USER.vipLevel).name} → {CURRENT_USER_VIP.nextLevelName}</div>
        </div>
      </Link>
    </div>
  );
}

// ===== TASK BANNER (Daily Challenge) =====
function TaskBanner() {
  const challenge = DAILY_CHALLENGE;
  return (
    <div className="px-4 mt-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-soul-900/60 to-dark-700/60 border border-soul-500/10 hover:border-soul-500/20 transition-all">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">🎯</span>
          <span className="text-xs font-bold text-soul-400 tracking-wide">DAILY CHALLENGE</span>
        </div>
        <p className="text-sm text-text-primary">
          &ldquo;{challenge.emoji} {challenge.title} to get <span className="text-soul-400 font-bold">{challenge.reward} VP</span>&rdquo;
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <div className="h-1.5 flex-1 rounded-full bg-dark-600 overflow-hidden mr-3">
            <div
              className="h-full rounded-full bg-soul-400 transition-all"
              style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-text-tertiary">{challenge.progress}/{challenge.target} {challenge.unit}</span>
        </div>
        <button className="mt-2 text-xs text-accent font-bold hover:underline">
          Go Complete →
        </button>
      </div>
    </div>
  );
}

// ===== GRID BUTTON (reused for Financials / Assets / Services) =====
function GridButton({ emoji, label, href, hasDot, sublabel, danger }: {
  emoji: string; label: string; href?: string; hasDot?: boolean; sublabel?: string; danger?: boolean;
}) {
  const content = (
    <div className={`relative p-4 rounded-2xl glass flex flex-col items-center gap-1.5 hover:bg-dark-600/50 transition-all ${danger ? 'hover:bg-red/5' : ''}`}>
      {hasDot && <RedDot />}
      <span className="text-2xl">{emoji}</span>
      <span className={`text-xs font-medium ${danger ? 'text-red' : 'text-text-primary'}`}>{label}</span>
      {sublabel && <span className="text-[9px] text-text-tertiary -mt-0.5">{sublabel}</span>}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return <button className="text-left">{content}</button>;
}

// ===== SECTION DIVIDER =====
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 mt-5 mb-2 flex items-center gap-2">
      <div className="h-px flex-1 bg-dark-400/30" />
      <span className="text-[10px] text-text-tertiary font-bold tracking-widest uppercase">{label}</span>
      <div className="h-px flex-1 bg-dark-400/30" />
    </div>
  );
}

// ===== POPULARITY DASHBOARD =====
function PopularityDashboard() {
  const stats = MOCK_POPULARITY;
  const tierEmoji: Record<string, string> = { rising: '💜', popular: '🔥', star: '⭐', icon: '👑' };
  const tierLabel: Record<string, string> = { rising: 'Rising', popular: 'Popular', star: 'Star', icon: 'Icon' };

  return (
    <div className="px-4 mt-4">
      <div className="p-4 rounded-2xl glass">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-primary">💜 Your Soul Room This Week</h3>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-bold">
            {tierEmoji[stats.popularityTier]} {tierLabel[stats.popularityTier]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { emoji: '💌', value: stats.messagesThisWeek, label: 'messages received' },
            { emoji: '👁️', value: stats.profileViewsThisWeek, label: 'profile views' },
            { emoji: '🎁', value: stats.giftsThisWeek, label: 'gifts received' },
            { emoji: '⚡', value: stats.sparkRequestsThisWeek, label: 'Spark requests' },
            { emoji: '⭐', value: stats.vibeRating, label: 'Vibe rating' },
            { emoji: '🏆', value: `Top ${stats.cityRankPercent}%`, label: 'in your city' },
          ].map(s => (
            <div key={s.label} className="p-2.5 rounded-xl bg-dark-600/40 text-center">
              <div className="text-sm font-bold text-text-primary">{s.emoji} {s.value}</div>
              <div className="text-[9px] text-text-tertiary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs">
          <span className="text-vibe font-bold">📈 {stats.changeFromLastWeek}% more popular than last week!</span>
        </div>
      </div>
    </div>
  );
}

// ===== PROFILE SECTION =====
function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-5">
      <h3 className="text-sm font-semibold text-text-secondary mb-2">{title}</h3>
      {children}
    </div>
  );
}

// ===== PHOTO GRID =====
function PhotoGrid() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="aspect-square rounded-2xl bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-4xl">
        👩🏾
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="aspect-square rounded-2xl bg-dark-600 flex items-center justify-center border-2 border-dashed border-dark-400 hover:border-accent/50 transition-colors cursor-pointer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4D4D66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN PAGE =====
export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const earnedBadges = USER_ACHIEVEMENTS.filter(a => a.earned).length;
  const totalBadges = USER_ACHIEVEMENTS.length;

  return (
    <div className="animate-fade-in pb-6">
      {/* Top bar: Settings + Support */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <button className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
          <span>⚙️</span> <span className="text-xs">Settings</span>
        </button>
        <button className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
          <span className="text-xs">Support</span> <span>🎧</span>
        </button>
      </div>

      {/* Control Center User Card */}
      <UserCard />

      {/* Social Stats: Friends / Following / Followers / Visitors */}
      <SocialStatsRow />

      {/* ═══ PRIMARY ACTIONS (Money Buttons) ═══ */}
      <PrimaryActions />

      {/* ═══ TASK BANNER ═══ */}
      <TaskBanner />

      {/* ═══ FINANCIALS ═══ */}
      <SectionLabel label="Financials" />
      <div className="grid grid-cols-3 gap-2 px-4">
        <GridButton emoji="💰" label="Income" hasDot={EARNINGS_WALLET.hasUnclaimed} sublabel={`${formatNumber(EARNINGS_WALLET.balanceDiamonds)} 💎`} />
        <GridButton emoji="🏪" label="Store" href="/app/vp" sublabel="Gift Shop" />
        <GridButton emoji="🏰" label="Mall" sublabel="Cosmetics" />
      </div>

      {/* ═══ MY ASSETS ═══ */}
      <SectionLabel label="My Assets" />
      <div className="grid grid-cols-4 gap-2 px-4">
        <GridButton emoji="🎒" label="Inventory" hasDot={USER_INVENTORY.length > 0} sublabel={`${USER_INVENTORY.length} items`} />
        <GridButton emoji="🛡️" label="My Level" href="/app/vip-level" sublabel={`Lvl ${CURRENT_USER.vipLevel}`} />
        <GridButton emoji="🏅" label="Badges" sublabel={`${earnedBadges}/${totalBadges}`} />
        <GridButton
          emoji={CURRENT_USER.isVerified ? '✅' : '❌'}
          label={CURRENT_USER.isVerified ? 'Verified' : 'Verify'}
          sublabel={CURRENT_USER.isVerified ? undefined : 'Unverified'}
          danger={!CURRENT_USER.isVerified}
        />
      </div>

      {/* ═══ SERVICES ═══ */}
      <SectionLabel label="Services" />
      <div className="grid grid-cols-3 gap-2 px-4">
        <GridButton emoji="👪" label="Referrals" sublabel="Earn VP" />
        <GridButton emoji="📝" label="Feedback" sublabel="Report" />
        <GridButton emoji="⚙️" label="Settings" sublabel="Privacy" />
      </div>

      {/* ═══ POPULARITY DASHBOARD ═══ */}
      <PopularityDashboard />

      {/* ═══ VIP Level XP Progress ═══ */}
      <Link href="/app/vip-level" className="block px-4 mt-4">
        <div className="p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getVipInfo(CURRENT_USER.vipLevel).badge || '🆕'}</span>
              <span className="text-sm font-bold text-text-primary">
                {getVipInfo(CURRENT_USER.vipLevel).name} • Level {CURRENT_USER.vipLevel}
              </span>
            </div>
            <span className="text-xs text-accent font-medium">View VIP →</span>
          </div>
          <div className="h-2.5 rounded-full bg-dark-600 overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-start to-accent-end transition-all"
              style={{ width: `${CURRENT_USER.vipLevel < 8 ? ((CURRENT_USER_VIP.totalXp - getVipInfo(CURRENT_USER.vipLevel).xpRequired) / (getVipInfo(CURRENT_USER.vipLevel + 1).xpRequired - getVipInfo(CURRENT_USER.vipLevel).xpRequired)) * 100 : 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-secondary">{formatNumber(CURRENT_USER_VIP.totalXp)} XP</span>
            {CURRENT_USER.vipLevel < 8 && (
              <span className="text-text-tertiary">
                {formatNumber(getVipInfo(CURRENT_USER.vipLevel + 1).xpRequired - CURRENT_USER_VIP.totalXp)} XP to {CURRENT_USER_VIP.nextLevelBadge} {CURRENT_USER_VIP.nextLevelName}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ═══ EDIT PROFILE ═══ */}
      <div className="px-4 mt-4">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="w-full py-3 rounded-2xl glass text-sm font-semibold text-text-primary hover:bg-dark-500 transition-all"
        >
          {isEditing ? '✓ Done Editing' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* Bio */}
      <ProfileSection title="About Me">
        <div className="p-4 rounded-2xl glass">
          {isEditing ? (
            <textarea
              defaultValue={CURRENT_USER.bio}
              className="w-full bg-transparent text-sm text-text-primary outline-none resize-none h-20"
              placeholder="Write something about yourself..."
            />
          ) : (
            <p className="text-sm text-text-primary">{CURRENT_USER.bio}</p>
          )}
        </div>
      </ProfileSection>

      {/* Photos */}
      <ProfileSection title="Photos">
        <PhotoGrid />
      </ProfileSection>

      {/* Info */}
      <ProfileSection title="Details">
        <div className="space-y-2">
          {[
            { icon: '👤', label: 'Looking for', value: CURRENT_USER.lookingFor },
            { icon: '🌐', label: 'Languages', value: CURRENT_USER.languages.join(', ') },
            { icon: '💼', label: 'Occupation', value: CURRENT_USER.occupation || 'Not set' },
            { icon: '🏠', label: 'Home World', value: CURRENT_USER.homeWorld },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl glass">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="text-xs text-text-tertiary">{item.label}</div>
                <div className="text-sm text-text-primary">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </ProfileSection>

      {/* Interests */}
      <ProfileSection title="Interests">
        <div className="flex flex-wrap gap-2">
          {CURRENT_USER.interests.map(interest => {
            const tag = INTEREST_TAGS.find(t => t.tag === interest);
            return (
              <span key={interest} className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium flex items-center gap-1">
                {tag?.emoji} {interest}
              </span>
            );
          })}
          {isEditing && (
            <button className="px-3 py-1.5 rounded-full border-2 border-dashed border-dark-400 text-text-tertiary text-sm hover:border-accent/50 hover:text-accent transition-colors">
              + Add
            </button>
          )}
        </div>
      </ProfileSection>

      {/* Subscription */}
      <ProfileSection title="Subscription">
        <Link href="/app/subscribe" className="block p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⭐</div>
              <div>
                <div className="text-sm font-semibold text-text-primary">Spark Plus</div>
                <div className="text-xs text-text-tertiary">$7.99/month</div>
              </div>
            </div>
            <span className="text-xs text-soul-400 font-medium">Upgrade →</span>
          </div>
        </Link>
      </ProfileSection>

      {/* Sign Out (at the bottom) */}
      <div className="px-4 mt-6 mb-4">
        <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl glass hover:bg-red/10 transition-all">
          <span className="text-lg">🚪</span>
          <span className="text-sm text-red font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
