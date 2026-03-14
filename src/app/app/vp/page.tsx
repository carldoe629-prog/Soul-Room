'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserChallenges, fetchVPTransactions } from '@/lib/db';
import { GIFT_TYPES, VP_PACKAGES, formatNumber } from '@/lib/mock-data';

type Tab = 'earn' | 'buy' | 'spend';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'earn', label: 'Earn', emoji: '🎯' },
    { id: 'buy', label: 'Buy', emoji: '💰' },
    { id: 'spend', label: 'Spend', emoji: '🎁' },
  ];
  return (
    <div className="flex gap-2 px-4 mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
            active === t.id ? 'gradient-accent text-white' : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}

function EarnTab({ userId }: { userId: string }) {
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserChallenges(userId)
      .then(setUserChallenges)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchVPTransactions(userId, 15)
      .then(setTransactions)
      .catch(() => {});
  }, [userId]);

  return (
    <div className="px-4 space-y-4 animate-slide-up">
      {/* Daily Challenges */}
      <div>
        <h3 className="text-base font-bold text-text-primary mb-3">Daily Activities</h3>
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl glass animate-pulse" />
              ))
            : userChallenges.length === 0
            ? (
              <div className="p-4 rounded-2xl glass text-center text-text-tertiary text-sm">
                No daily challenges yet — check back soon!
              </div>
            )
            : userChallenges.map((uc) => {
                const c = uc.challenge;
                if (!c) return null;
                const isCompleted = uc.progress >= (c.target_count ?? 1);
                return (
                  <div key={uc.id ?? c.id} className="p-4 rounded-2xl glass">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.emoji ?? '🎯'}</span>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">{c.title}</div>
                          {c.description && <div className="text-xs text-text-secondary">{c.description}</div>}
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${isCompleted ? 'text-vibe' : 'text-accent'}`}>
                        {isCompleted ? '✓' : `+${c.reward_vp ?? 0} VP`}
                      </span>
                    </div>
                    {!isCompleted && (
                      <div className="w-full h-1.5 rounded-full bg-dark-500 mt-1">
                        <div
                          className="h-full rounded-full gradient-accent transition-all"
                          style={{ width: `${Math.min((uc.progress / (c.target_count ?? 1)) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* More ways to earn */}
      <div>
        <h3 className="text-base font-bold text-text-primary mb-3">More Ways to Earn</h3>
        <div className="space-y-2">
          {[
            { emoji: '📅', text: 'Daily login', vp: '+100 VP' },
            { emoji: '🔥', text: '7-day streak bonus', vp: '+500 VP' },
            { emoji: '🎬', text: 'Watch rewarded ad', vp: '+50 VP (max 10/day)' },
            { emoji: '⚡', text: 'Get a mutual Spark', vp: '+250 VP' },
            { emoji: '⭐', text: 'Get a Good Vibe rating', vp: '+150 VP' },
            { emoji: '🎤', text: 'Host a voice room (30+ min)', vp: '+300 VP' },
            { emoji: '🔗', text: 'Refer a friend', vp: '+1,000 VP' },
            { emoji: '✓', text: 'Complete profile 100%', vp: '+500 VP' },
          ].map((item) => (
            <div key={item.text} className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-sm text-text-secondary"><span className="text-base mr-2">{item.emoji}</span>{item.text}</span>
              <span className="text-xs text-vibe font-bold">{item.vp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Watch ad */}
      <div className="p-4 rounded-2xl glass border border-vibe/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-text-primary">🎬 Watch ad → Earn 50 VP</div>
            <div className="text-xs text-text-tertiary mt-0.5">7 of 10 remaining today</div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-vibe/10 text-vibe text-xs font-bold">Watch Now</button>
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-text-primary mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl glass">
                  <div>
                    <div className="text-sm text-text-primary">{tx.description ?? (isCredit ? 'VP Received' : 'VP Spent')}</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${isCredit ? 'text-vibe' : 'text-accent'}`}>
                    {isCredit ? '+' : ''}{formatNumber(tx.amount)} VP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BuyTab() {
  return (
    <div className="px-4 space-y-4 animate-slide-up">
      {/* First purchase banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-start/15 to-accent-end/15 border border-accent/20">
        <div className="text-sm font-bold text-accent mb-1">🎁 FIRST PURCHASE BONUS</div>
        <div className="text-xs text-text-secondary">Double VP on your first buy! One-time only.</div>
      </div>

      {/* VP Packages */}
      <div className="grid grid-cols-2 gap-3">
        {VP_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            className={`relative p-4 rounded-2xl text-center transition-all hover:scale-[1.02] ${
              pkg.label === 'Best Value' ? 'glass border-2 border-accent/30 glow-accent'
              : pkg.label === 'Popular' ? 'glass border border-soul-500/30'
              : 'glass'
            }`}
          >
            {pkg.label && (
              <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] px-3 py-0.5 rounded-full font-bold text-white ${
                pkg.label === 'Best Value' ? 'gradient-accent' : 'gradient-soul'
              }`}>
                {pkg.label}
              </span>
            )}
            <div className="text-2xl mb-1">{pkg.emoji}</div>
            <div className="text-xs font-bold text-text-primary">{pkg.name}</div>
            <div className="text-lg font-extrabold text-text-primary mt-0.5">{formatNumber(pkg.amount)}</div>
            <div className="text-[10px] text-text-tertiary">VP</div>
            {pkg.bonus > 0 && <div className="text-[10px] text-vibe font-bold mt-1">+{pkg.bonus}% bonus</div>}
            <div className="mt-2 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold">
              ${pkg.price.toFixed(2)}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center text-xs text-text-tertiary py-2">
        <div>Payment: Stripe · Paystack · Flutterwave · Mobile Money</div>
        <div className="mt-1">Prices shown in USD. Local currencies available at checkout.</div>
      </div>
    </div>
  );
}

function SpendTab() {
  const [giftTier, setGiftTier] = useState(1);
  const tiers = [
    { id: 1, label: 'Casual', range: '100–500 VP' },
    { id: 2, label: 'Affection', range: '1K–5K VP' },
    { id: 3, label: 'Luxury', range: '10K–20K VP' },
    { id: 4, label: 'Legendary', range: '50K–100K VP' },
  ];
  const filteredGifts = GIFT_TYPES.filter((g) => g.tier === giftTier);

  return (
    <div className="px-4 space-y-4 animate-slide-up">
      <div>
        <h3 className="text-base font-bold text-text-primary mb-3">What VP Can Buy</h3>
        <div className="space-y-2">
          {[
            { emoji: '💬', text: 'Say Hi (first message)', cost: '200 VP' },
            { emoji: '💌', text: 'Stranger reply (msg 2-10)', cost: '50 VP' },
            { emoji: '🎙️', text: 'Voice note (stranger)', cost: '100 VP' },
            { emoji: '⚡', text: 'Extra Spark round', cost: '500 VP' },
            { emoji: '🚀', text: 'Profile Boost (30 min)', cost: '3,000 VP' },
            { emoji: '💫', text: 'Super Spark', cost: '1,500 VP' },
            { emoji: '🌟', text: 'Spotlight (1 hour)', cost: '5,000 VP' },
          ].map((item) => (
            <div key={item.text} className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-sm text-text-secondary"><span className="text-base mr-2">{item.emoji}</span>{item.text}</span>
              <span className="text-xs text-accent font-bold">{item.cost}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-text-primary mb-3">Virtual Gifts</h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => setGiftTier(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                giftTier === t.id ? 'gradient-accent text-white' : 'glass text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filteredGifts.map((gift) => (
            <button key={gift.id} className="p-3 rounded-2xl glass text-center hover:bg-dark-500/50 transition-all hover:scale-105">
              <div className="text-3xl mb-1">{gift.emoji}</div>
              <div className="text-[10px] font-semibold text-text-primary truncate">{gift.name}</div>
              <div className="text-[10px] text-accent font-bold">{formatNumber(gift.vpCost)} VP</div>
              <div className="text-[9px] text-text-tertiary">${gift.usdEquivalent.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-soul-500/10 border border-soul-500/20">
        <div className="text-xs text-soul-400 font-medium mb-1">💜 Gift Economy</div>
        <div className="text-xs text-text-tertiary">Recipients earn 30% of gift VP value. Send gifts to support your favorite hosts!</div>
      </div>
    </div>
  );
}

export default function VPStorePage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('buy');
  const vpBalance = profile?.vibe_points ?? 0;

  return (
    <div className="py-4 animate-fade-in font-[Outfit]">
      {/* Balance Header */}
      <div className="px-4 mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass">
          <span className="text-2xl">💎</span>
          <div>
            <div className="text-2xl font-extrabold text-text-primary">{formatNumber(vpBalance)}</div>
            <div className="text-xs text-text-tertiary">Vibe Points</div>
          </div>
        </div>
        <div className="text-xs text-text-tertiary mt-2">1 USD ≈ 1,000 VP</div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'earn' && user && <EarnTab userId={user.id} />}
      {tab === 'buy' && <BuyTab />}
      {tab === 'spend' && <SpendTab />}
    </div>
  );
}
