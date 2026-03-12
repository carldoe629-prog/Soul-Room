'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CURRENT_USER,
  CURRENT_USER_VIP,
  VIP_LEVELS,
  XP_EARNING_RATES,
  VIP_LEADERBOARD,
  getVipInfo,
  formatNumber,
} from '@/lib/mock-data';

type EarnTab = 'spending' | 'activity';
type LeaderboardFilter = 'global' | 'city' | 'world';

export default function VipLevelPage() {
  const [earnTab, setEarnTab] = useState<EarnTab>('spending');
  const [lbFilter, setLbFilter] = useState<LeaderboardFilter>('global');

  const vip = CURRENT_USER_VIP;
  const currentTier = getVipInfo(vip.currentLevel);
  const nextTier = vip.currentLevel < 8 ? getVipInfo(vip.currentLevel + 1) : null;
  const progressToNext = nextTier ? ((vip.totalXp - currentTier.xpRequired) / (nextTier.xpRequired - currentTier.xpRequired)) * 100 : 100;
  const maintenanceProgress = vip.monthlyXpRequired > 0 ? (vip.monthlyXp / vip.monthlyXpRequired) * 100 : 100;

  return (
    <div className="animate-fade-in pb-8">
      {/* ═══ HEADER: Current Level ═══ */}
      <div className="relative px-4 pt-6 pb-5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-start/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="text-5xl mb-2">{currentTier.badge || '🆕'}</div>
          <h1 className="text-2xl font-bold text-text-primary font-[Outfit]">{currentTier.name}</h1>
          <p className="text-xs text-text-tertiary mt-1">VIP Level {vip.currentLevel} of 8</p>
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
                {formatNumber(vip.totalXp)} / {formatNumber(nextTier.xpRequired)} XP
              </div>
              <div className="text-[10px] text-accent mt-0.5">
                {formatNumber(nextTier.xpRequired - vip.totalXp)} XP to {nextTier.name}
              </div>
            </div>
          )}
          {!nextTier && (
            <div className="mt-4 text-sm text-soul-400 font-bold">✨ Maximum level reached!</div>
          )}
        </div>
      </div>

      {/* ═══ MONTHLY MAINTENANCE ═══ */}
      {currentTier.monthlyMaintenanceXp > 0 && (
        <div className="px-4 mb-4">
          <div className={`p-4 rounded-2xl ${vip.maintenanceMet ? 'glass' : 'glass border border-amber-500/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-text-primary">
                {vip.maintenanceMet ? '✅ Monthly Maintenance' : '⚠️ VIP Level At Risk'}
              </h3>
              <span className="text-[10px] text-text-tertiary">{vip.daysRemainingInMonth} days left</span>
            </div>
            <div className="h-2.5 rounded-full bg-dark-600 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${vip.maintenanceMet ? 'bg-vibe' : maintenanceProgress >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(maintenanceProgress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-secondary">{formatNumber(vip.monthlyXp)} / {formatNumber(vip.monthlyXpRequired)} XP</span>
              {!vip.maintenanceMet && (
                <span className="text-amber-400 font-bold">
                  Need {formatNumber(vip.monthlyXpRequired - vip.monthlyXp)} more XP
                </span>
              )}
            </div>
            {!vip.maintenanceMet && (
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
            { icon: '💬', label: `+${currentTier.extraSayHiPerDay === 'unlimited' ? '∞' : currentTier.extraSayHiPerDay} Say Hi/day` },
            { icon: '💰', label: `${currentTier.vpDiscount}% VP discount` },
            { icon: '🚀', label: `${currentTier.freeBoostsPerWeek} Boost${currentTier.freeBoostsPerWeek !== 1 ? 's' : ''}/wk` },
            { icon: '📌', label: `${currentTier.maxPinnedConvos >= 999 ? '∞' : currentTier.maxPinnedConvos} pinned chats` },
            ...(currentTier.hasEntranceAnimation ? [{ icon: '🎭', label: 'Room entrance' }] : []),
            ...(currentTier.hasNameColor ? [{ icon: '🎨', label: 'Name color' }] : []),
            ...(currentTier.hasChatThemes ? [{ icon: '💜', label: 'Chat themes' }] : []),
            ...(currentTier.hasVoiceEffects ? [{ icon: '🎤', label: 'Voice effects' }] : []),
            ...(currentTier.canCreateRoomsFree ? [{ icon: '🏠', label: 'Free rooms' }] : []),
            ...(currentTier.hasReadReceipts ? [{ icon: '✓✓', label: 'Read receipts' }] : []),
            ...(currentTier.hasExclusiveWorld ? [{ icon: '🌍', label: 'VIP World' }] : []),
            ...(currentTier.hasBetaAccess ? [{ icon: '🧪', label: 'Beta access' }] : []),
          ].filter(p => p.label !== '0 Boosts/wk' && p.label !== '+0 Say Hi/day' && p.label !== '0% VP discount').map(perk => (
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
              const isCurrent = tier.level === vip.currentLevel;
              const isLocked = tier.level > vip.currentLevel;
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
                    {tier.vpDiscount > 0 && <div className="text-text-secondary">💰 {tier.vpDiscount}% VP disc.</div>}
                    {tier.extraSayHiPerDay !== 0 && (
                      <div className="text-text-secondary">💬 +{tier.extraSayHiPerDay === 'unlimited' ? '∞' : tier.extraSayHiPerDay} Say Hi</div>
                    )}
                    {tier.freeBoostsPerWeek > 0 && <div className="text-text-secondary">🚀 {tier.freeBoostsPerWeek} Boost/wk</div>}
                    {tier.hasEntranceAnimation && <div className="text-text-secondary">🎭 Entrance anim.</div>}
                    {tier.hasExclusiveWorld && <div className="text-text-secondary">🌍 VIP World</div>}
                    {tier.hasBetaAccess && <div className="text-text-secondary">🧪 Beta access</div>}
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
          {VIP_LEADERBOARD.map((user, i) => (
            <div key={user.rank} className={`flex items-center gap-3 p-3 rounded-xl ${
              i < 3 ? 'glass border border-accent/10' : 'glass'
            }`}>
              <span className={`w-6 text-center text-sm font-bold ${
                i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-text-tertiary'
              }`}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : user.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-sm">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-text-primary">@{user.name}</span>
                  <span className="text-xs">{user.badge}</span>
                </div>
                <div className="text-[10px] text-text-tertiary">{formatNumber(user.xp)} XP • {user.city}</div>
              </div>
              <span className="text-[10px] text-text-secondary font-medium">{user.level}</span>
            </div>
          ))}

          {/* Your position */}
          <div className="mt-2 flex items-center gap-3 p-3 rounded-xl glass border border-accent/20">
            <span className="w-6 text-center text-sm font-bold text-accent">247</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-sm">
              👩🏾
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-accent">@{CURRENT_USER.displayName}</span>
                <span className="text-xs">{currentTier.badge}</span>
              </div>
              <div className="text-[10px] text-text-tertiary">{formatNumber(vip.totalXp)} XP • {CURRENT_USER.city}</div>
            </div>
            <span className="text-[10px] text-accent font-medium">{currentTier.name}</span>
          </div>
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
