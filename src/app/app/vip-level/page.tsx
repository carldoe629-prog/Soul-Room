'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { fetchXPLeaderboard, fetchUserXPRank } from '@/lib/db';
import {
  VIP_LEVELS,
  XP_EARNING_RATES,
  getVipInfo,
  formatNumber,
} from '@/lib/mock-data';

type EarnTab = 'spending' | 'activity';
type LeaderboardFilter = 'global' | 'city' | 'world';

const VIP_THRESHOLDS = [0, 1000, 5000, 10000, 40000, 100000, 250000, 500000, 1000000];

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export default function VipLevelPage() {
  const { user, profile } = useAuth();
  const [earnTab, setEarnTab] = useState<EarnTab>('spending');
  const [lbFilter, setLbFilter] = useState<LeaderboardFilter>('global');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  const currentLevel = profile?.subscription_tier === 'founder' ? 999 : (profile?.vip_level ?? 0);
  const totalXp = profile?.total_xp ?? 0;
  const monthlyXp = profile?.monthly_xp ?? 0;

  const currentTier = getVipInfo(currentLevel);
  const nextTier = currentLevel < 8 ? getVipInfo(currentLevel + 1) : null;
  const currentXpRequired = VIP_THRESHOLDS[currentLevel] ?? 0;
  const nextXpRequired = nextTier ? (VIP_THRESHOLDS[currentLevel + 1] ?? 0) : 0;
  const progressToNext = nextTier
    ? ((totalXp - currentXpRequired) / (nextXpRequired - currentXpRequired)) * 100
    : 100;

  const monthlyMaintenanceXp = currentTier.monthlyMaintenanceXp ?? 0;
  const maintenanceMet = monthlyMaintenanceXp === 0 || monthlyXp >= monthlyMaintenanceXp;
  const maintenanceProgress = monthlyMaintenanceXp > 0 ? (monthlyXp / monthlyMaintenanceXp) * 100 : 100;
  const daysRemainingInMonth = getDaysRemainingInMonth();

  const displayName = profile?.display_name ?? 'You';
  const city = profile?.city ?? '';

  useEffect(() => {
    if (!user) return;
    const filter = lbFilter === 'city' ? 'city' : 'global';
    fetchXPLeaderboard(filter, city || null, 10)
      .then(setLeaderboard)
      .catch(() => {});
    fetchUserXPRank(user.id, filter, city || null)
      .then(setUserRank)
      .catch(() => {});
  }, [user, lbFilter, city]);

  return (
    <div className="animate-fade-in pb-8">
      {/* ═══ HEADER: Current Level ═══ */}
      <div className="relative px-4 pt-6 pb-5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-start/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="text-5xl mb-2">{currentTier.badge || '🆕'}</div>
          <h1 className="text-2xl font-bold text-text-primary font-[Outfit]">{currentTier.name}</h1>
          <p className="text-xs text-text-tertiary mt-1">VIP Level {currentLevel} of 8</p>
          <p className="text-[11px] text-text-secondary mt-2 italic">&ldquo;{currentTier.tagline}&rdquo;</p>

          {/* XP Progress to next level */}
          {nextTier && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1.5">
                <span>{currentTier.badge} {currentTier.name}</span>
                <span>{nextTier.badge} {nextTier.name}</span>
              </div>
              <div className="h-3 rounded-full bg-dark-600 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-start to-accent-end transition-all"
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                />
              </div>
              <div className="text-xs text-text-secondary mt-1.5 font-medium">
                {formatNumber(totalXp)} / {formatNumber(nextXpRequired)} XP
              </div>
              <div className="text-[10px] text-accent mt-0.5">
                {formatNumber(nextXpRequired - totalXp)} XP to {nextTier.name}
              </div>
            </div>
          )}
          {!nextTier && (
            <div className="mt-4 text-sm text-soul-400 font-bold">✨ Maximum level reached!</div>
          )}
        </div>
      </div>

      {/* ═══ MONTHLY MAINTENANCE ═══ */}
      {monthlyMaintenanceXp > 0 && (
        <div className="px-4 mb-4">
          <div className={`p-4 rounded-2xl ${maintenanceMet ? 'glass' : 'glass border border-amber-500/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-text-primary">
                {maintenanceMet ? '✅ Monthly Maintenance' : '⚠️ VIP Level At Risk'}
              </h3>
              <span className="text-[10px] text-text-tertiary">{daysRemainingInMonth} days left</span>
            </div>
            <div className="h-2.5 rounded-full bg-dark-600 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${maintenanceMet ? 'bg-vibe' : maintenanceProgress >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(maintenanceProgress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-secondary">{formatNumber(monthlyXp)} / {formatNumber(monthlyMaintenanceXp)} XP</span>
              {!maintenanceMet && (
                <span className="text-amber-400 font-bold">
                  Need {formatNumber(monthlyMaintenanceXp - monthlyXp)} more XP
                </span>
              )}
            </div>
            {!maintenanceMet && (
              <div className="mt-3 text-[10px] text-text-tertiary">
                Quick ways: Send gifts (+1.5 XP/VP) • Host a room (+30 XP) • Daily challenges (+20 XP)
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ YOUR PERKS ═══ */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-text-primary mb-2">🎁 Your {currentTier.name} Perks</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '💰', label: `${currentTier.giftEarningRate}% gift earn rate` },
            ...(currentTier.hasCustomBorderColor ? [{ icon: '🎨', label: 'Custom border colour' }] : []),
            ...(currentTier.hasExtendedSparkCall ? [{ icon: '⚡', label: '10-min Spark call' }] : []),
            ...(currentTier.hasHideLastSeen ? [{ icon: '🙈', label: 'Hide Last Seen' }] : []),
            ...(currentTier.hasGhostMode ? [{ icon: '👻', label: 'Ghost Mode' }] : []),
            ...(currentTier.hasEntranceAnimation ? [{ icon: '🎭', label: 'Room entrance' }] : []),
            ...(currentTier.hasReadReceiptControl ? [{ icon: '✓✓', label: 'Read receipt control' }] : []),
            ...(currentTier.hasPlatinumRooms ? [{ icon: '💠', label: 'Platinum rooms' }] : []),
            ...(currentTier.hasInvisibleBrowsing ? [{ icon: '👁️', label: 'Invisible browsing' }] : []),
            ...(currentTier.hasDiamondEntrance ? [{ icon: '💎', label: 'Diamond entrance' }] : []),
            ...(currentTier.hasWorldCreation ? [{ icon: '🌍', label: 'World creation' }] : []),
            ...(currentTier.reducedSafeExitTollVp ? [{ icon: '🚪', label: `Exit toll: ${formatNumber(currentTier.reducedSafeExitTollVp)} VP` }] : []),
            ...(currentTier.hasConcierge ? [{ icon: '🎩', label: 'Concierge access' }] : []),
            ...(currentTier.hasPriorityMatchmaking ? [{ icon: '🚀', label: 'Priority matching' }] : []),
            ...(currentTier.hasLegendaryFrame ? [{ icon: '🖼️', label: 'Legendary frame' }] : []),
            ...(currentTier.hasCoHosting ? [{ icon: '🎤', label: 'Co-hosting' }] : []),
            ...(currentTier.hasIncognitoSpark ? [{ icon: '🕶️', label: 'Incognito Spark' }] : []),
            ...(currentTier.hasUnlimitedWorlds ? [{ icon: '∞', label: 'Unlimited Worlds' }] : []),
            ...(currentTier.hasCustomAnimation ? [{ icon: '✨', label: 'Profile animation' }] : []),
            ...(currentTier.hasGlobalLeaderboard ? [{ icon: '🏆', label: 'Global leaderboard' }] : []),
          ].map(perk => (
            <div key={perk.label} className="p-2.5 rounded-xl bg-dark-600/40 flex items-center gap-2">
              <span className="text-sm">{perk.icon}</span>
              <span className="text-[10px] text-text-primary font-medium">{perk.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ HOW TO EARN XP ═══ */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-text-primary mb-2">📈 How to Earn XP</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {([
            { id: 'spending' as EarnTab, label: '💰 Spend VP → XP' },
            { id: 'activity' as EarnTab, label: '🏃 Activity' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setEarnTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                earnTab === tab.id ? 'gradient-accent text-white' : 'glass text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {earnTab === 'spending' && (
          <div className="space-y-2">
            {XP_EARNING_RATES.vpSpending.map(item => (
              <div key={item.source} className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1">
                  <div className="text-xs text-text-primary">{item.source}</div>
                  <div className="text-[10px] text-accent font-bold">{item.rate}</div>
                </div>
              </div>
            ))}
            {/* Subscription multiplier */}
            <div className="p-3 rounded-xl glass border border-soul-500/15 mt-2">
              <div className="text-[10px] text-text-tertiary mb-2 font-medium">Subscription XP Multiplier</div>
              <div className="flex gap-2">
                {XP_EARNING_RATES.subscriptionMultipliers.map(m => (
                  <div key={m.tier} className="flex-1 text-center p-2 rounded-lg bg-dark-600/40">
                    <div className={`text-sm font-bold ${m.color}`}>{m.multiplier}</div>
                    <div className="text-[9px] text-text-tertiary">{m.tier}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {earnTab === 'activity' && (
          <div className="space-y-3">
            {[
              { title: '📅 Daily', items: XP_EARNING_RATES.dailyActivity },
              { title: '💜 Social', items: XP_EARNING_RATES.socialActivity },
              { title: '🌍 Community', items: XP_EARNING_RATES.communityActivity },
            ].map(section => (
              <div key={section.title}>
                <div className="text-[10px] text-text-tertiary font-bold mb-1.5">{section.title}</div>
                <div className="space-y-1">
                  {section.items.map((item: { source: string; xp: number; emoji: string; note?: string }) => (
                    <div key={item.source} className="flex items-center gap-3 p-2.5 rounded-xl glass">
                      <span className="text-sm">{item.emoji}</span>
                      <span className="text-xs text-text-primary flex-1">{item.source}</span>
                      <span className="text-xs text-vibe font-bold">+{item.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ ALL LEVELS ═══ */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-text-primary mb-2">🏆 VIP Level Tiers</h3>
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
          <div className="flex gap-2.5 pb-2" style={{ width: 'max-content' }}>
            {VIP_LEVELS.map(tier => {
              const isCurrent = tier.level === currentLevel;
              const isLocked = tier.level > currentLevel;
              return (
                <div
                  key={tier.level}
                  className={`w-[160px] flex-shrink-0 p-3 rounded-2xl transition-all ${
                    isCurrent ? 'glass border-2 border-accent/40' : isLocked ? 'glass opacity-60' : 'glass'
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-2xl">{tier.badge || '🆕'}</div>
                    <div className="text-xs font-bold text-text-primary mt-1">{tier.name}</div>
                    <div className="text-[9px] text-text-tertiary">
                      {tier.xpRequired > 0 ? `${formatNumber(tier.xpRequired)} XP` : 'Start'}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="text-[9px] text-accent text-center font-bold mb-1.5">← YOU ARE HERE</div>
                  )}
                  <div className="space-y-1 text-[9px]">
                    <div className="text-text-secondary">{tier.keyPrivilege}</div>
                    {tier.giftEarningRate > 30 && <div className="text-text-secondary">💰 {tier.giftEarningRate}% gift rate</div>}
                    {tier.hasEntranceAnimation && <div className="text-text-secondary">🎭 Entrance anim.</div>}
                  </div>
                  {tier.levelUpVpBonus > 0 && (
                    <div className="mt-2 text-center text-[9px] text-soul-400 font-bold">
                      🎁 +{formatNumber(tier.levelUpVpBonus)} VP
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ LEADERBOARD ═══ */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-text-primary">👑 Top Members</h3>
        </div>
        <div className="flex gap-2 mb-3">
          {([
            { id: 'global' as LeaderboardFilter, label: '🌐 Global' },
            { id: 'city' as LeaderboardFilter, label: '🏙️ My City' },
            { id: 'world' as LeaderboardFilter, label: '🌍 My World' },
          ]).map(f => (
            <button
              key={f.id}
              onClick={() => setLbFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                lbFilter === f.id ? 'gradient-accent text-white' : 'glass text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {leaderboard.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl glass animate-pulse" />
              ))
            : leaderboard.map((entry, i) => {
                const tierInfo = getVipInfo(entry.vip_level ?? 0);
                const avatar = entry.photos?.[0] ?? entry.avatar_url;
                return (
                  <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                    i < 3 ? 'glass border border-accent/10' : 'glass'
                  }`}>
                    <span className={`w-6 text-center text-sm font-bold ${
                      i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-text-tertiary'
                    }`}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 overflow-hidden flex-shrink-0">
                      {avatar
                        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-text-primary truncate">@{entry.display_name ?? 'User'}</span>
                        <span className="text-xs">{tierInfo.badge}</span>
                      </div>
                      <div className="text-[10px] text-text-tertiary">{formatNumber(entry.total_xp ?? 0)} XP{entry.city ? ` • ${entry.city}` : ''}</div>
                    </div>
                    <span className="text-[10px] text-text-secondary font-medium">{tierInfo.name}</span>
                  </div>
                );
              })}

          {/* Your position */}
          {user && (
            <div className="mt-2 flex items-center gap-3 p-3 rounded-xl glass border border-accent/20">
              <span className="w-6 text-center text-sm font-bold text-accent">{userRank ?? '—'}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 overflow-hidden flex-shrink-0">
                {(profile?.photos?.[0] ?? profile?.avatar_url)
                  ? <img src={profile.photos?.[0] ?? profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-sm">👤</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-accent">@{displayName}</span>
                  <span className="text-xs">{currentTier.badge}</span>
                </div>
                <div className="text-[10px] text-text-tertiary">{formatNumber(totalXp)} XP{city ? ` • ${city}` : ''}</div>
              </div>
              <span className="text-[10px] text-accent font-medium">{currentTier.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LEVEL-UP REWARDS TABLE ═══ */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-text-primary mb-2">🎁 Level-Up VP Bonuses</h3>
        <div className="space-y-1.5">
          {VIP_LEVELS.filter(t => t.levelUpVpBonus > 0).map(tier => (
            <div key={tier.level} className="flex items-center gap-3 p-2.5 rounded-xl glass">
              <span className="text-lg">{tier.badge}</span>
              <span className="text-xs text-text-primary flex-1">{tier.name}</span>
              <span className="text-xs text-soul-400 font-bold">+{formatNumber(tier.levelUpVpBonus)} VP</span>
            </div>
          ))}
          <div className="text-center text-[10px] text-text-tertiary mt-2">
            Total from all levels: <span className="text-accent font-bold">442,500 VP</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4">
        <Link href="/app/vp" className="block w-full py-3 rounded-2xl gradient-accent text-white text-sm font-bold text-center hover:opacity-90 transition-all">
          Buy VP to Earn XP Faster →
        </Link>
        <Link href="/app/subscribe" className="block w-full py-3 rounded-2xl glass text-text-secondary text-sm font-semibold text-center mt-2 hover:bg-dark-600/50 transition-all">
          Subscribe for XP Multiplier ⚡
        </Link>
      </div>
    </div>
  );
}
