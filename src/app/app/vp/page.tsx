'use client';

import { useState } from 'react';
import { GIFT_TYPES, VP_PACKAGES, MOCK_CHALLENGES, CURRENT_USER, formatNumber } from '@/lib/mock-data';

type Tab = 'earn' | 'buy' | 'spend';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'earn', label: 'Earn', emoji: '🎯' },
    { id: 'buy', label: 'Buy', emoji: '💰' },
    { id: 'spend', label: 'Spend', emoji: '🎁' },
  ];
  return (
    <div className="flex gap-2 px-4 mb-6">
      {tabs.map(t => (
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

function EarnTab() {
  return (
    <div className="px-4 space-y-4 animate-slide-up">
      {/* Daily Activities */}
      <div>
        <h3 className="text-base font-bold text-text-primary mb-3">Daily Activities</h3>
        <div className="space-y-3">
          {MOCK_CHALLENGES.map(c => (
            <div key={c.id} className="p-4 rounded-2xl glass">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{c.title}</div>
                    <div className="text-xs text-text-secondary">{c.description}</div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${c.isCompleted ? 'text-vibe' : 'text-accent'}`}>
                  {c.isCompleted ? '✓' : `+${c.vpReward} VP`}
                </span>
              </div>
              {!c.isCompleted && (
                <div className="w-full h-1.5 rounded-full bg-dark-500 mt-1">
                  <div
                    className="h-full rounded-full gradient-accent transition-all"
                    style={{ width: `${(c.progress / c.target) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Earning Overview */}
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
          ].map(item => (
            <div key={item.text} className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-sm text-text-secondary"><span className="text-base mr-2">{item.emoji}</span>{item.text}</span>
              <span className="text-xs text-vibe font-bold">{item.vp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Watch Ads */}
      <div className="p-4 rounded-2xl glass border border-vibe/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-text-primary">🎬 Watch ad → Earn 50 VP</div>
            <div className="text-xs text-text-tertiary mt-0.5">7 of 10 remaining today</div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-vibe/10 text-vibe text-xs font-bold">Watch Now</button>
        </div>
      </div>
    </div>
  );
}

function BuyTab() {
  const [firstBuy] = useState(true);

  return (
    <div className="px-4 space-y-4 animate-slide-up">
      {/* First Purchase Banner */}
      {firstBuy && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-start/15 to-accent-end/15 border border-accent/20">
          <div className="text-sm font-bold text-accent mb-1">🎁 FIRST PURCHASE BONUS</div>
          <div className="text-xs text-text-secondary">Double VP on your first buy! One-time only.</div>
        </div>
      )}

      {/* VP Packages Grid */}
      <div className="grid grid-cols-2 gap-3">
        {VP_PACKAGES.map(pkg => (
          <button
            key={pkg.id}
            className={`relative p-4 rounded-2xl text-center transition-all hover:scale-[1.02] ${
              pkg.label === 'Best Value'
                ? 'glass border-2 border-accent/30 glow-accent'
                : pkg.label === 'Popular'
                ? 'glass border border-soul-500/30'
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
            {pkg.bonus > 0 && (
              <div className="text-[10px] text-vibe font-bold mt-1">+{pkg.bonus}% bonus</div>
            )}
            <div className="mt-2 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold">
              ${pkg.price.toFixed(2)}
            </div>
          </button>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="text-center text-xs text-text-tertiary py-2">
        <div>Payment: Stripe • Paystack • Flutterwave • Mobile Money</div>
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

  const filteredGifts = GIFT_TYPES.filter(g => g.tier === giftTier);

  return (
    <div className="px-4 space-y-4 animate-slide-up">
      {/* Spend Overview */}
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
          ].map(item => (
            <div key={item.text} className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-sm text-text-secondary"><span className="text-base mr-2">{item.emoji}</span>{item.text}</span>
              <span className="text-xs text-accent font-bold">{item.cost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gift Catalog */}
      <div>
        <h3 className="text-base font-bold text-text-primary mb-3">Virtual Gifts</h3>

        {/* Tier Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {tiers.map(t => (
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
          {filteredGifts.map(gift => (
            <button key={gift.id} className="p-3 rounded-2xl glass text-center hover:bg-dark-500/50 transition-all hover:scale-105">
              <div className="text-3xl mb-1">{gift.emoji}</div>
              <div className="text-[10px] font-semibold text-text-primary truncate">{gift.name}</div>
              <div className="text-[10px] text-accent font-bold">{formatNumber(gift.vpCost)} VP</div>
              <div className="text-[9px] text-text-tertiary">${gift.usdEquivalent.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Split Info */}
      <div className="p-3 rounded-xl bg-soul-500/10 border border-soul-500/20">
        <div className="text-xs text-soul-400 font-medium mb-1">💜 Gift Economy</div>
        <div className="text-xs text-text-tertiary">Recipients earn 30% of gift VP value. Send gifts to support your favorite hosts!</div>
      </div>
    </div>
  );
}

export default function VPStorePage() {
  const [tab, setTab] = useState<Tab>('buy');

  return (
    <div className="py-4 animate-fade-in">
      {/* Balance Header */}
      <div className="px-4 mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass">
          <span className="text-2xl">💎</span>
          <div>
            <div className="text-2xl font-extrabold text-text-primary">{formatNumber(CURRENT_USER.vibePoints)}</div>
            <div className="text-xs text-text-tertiary">Vibe Points</div>
          </div>
        </div>
        <div className="text-xs text-text-tertiary mt-2">1 USD ≈ 1,000 VP</div>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'earn' && <EarnTab />}
      {tab === 'buy' && <BuyTab />}
      {tab === 'spend' && <SpendTab />}
    </div>
  );
}
