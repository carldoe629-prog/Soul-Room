'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { SUBSCRIPTION_TIERS, formatNumber } from '@/lib/mock-data';

export default function SubscribePage() {
  const { profile } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const currentTier = profile?.subscription_tier ?? 'free';

  const comparisonRows = [
    { feature: 'Daily Sparks', free: '1', plus: '5', premium: '∞', vip: '∞' },
    { feature: 'AI Companion messages/day', free: '10', plus: '50', premium: '∞', vip: '∞' },
    { feature: 'Monthly VP bonus', free: '0', plus: '2,000', premium: '5,000', vip: '10,000' },
    { feature: 'XP multiplier', free: '1x', plus: '1.2x', premium: '1.5x', vip: '2x' },
    { feature: 'Read receipts (outgoing)', free: '100 VP ea', plus: '5 free/day', premium: '✅ Free', vip: '✅ Free' },
    { feature: 'Reveal who liked you', free: 'Pay VP', plus: 'Pay VP', premium: '✅ Free', vip: '✅ Free' },
    { feature: 'Companion Memory', free: '❌', plus: '❌', premium: '✅', vip: '✅' },
    { feature: 'Delete message window', free: '24h', plus: '72h', premium: '7 days', vip: '30 days' },
    { feature: 'Edit message window', free: '15 min', plus: '60 min', premium: '6 hours', vip: '∞' },
    { feature: 'Rewarded ads (AI ext.)', free: '✅', plus: '❌', premium: '❌', vip: '❌' },
    { feature: 'Feed priority', free: '—', plus: 'Slight', premium: 'Strong', vip: 'Strongest' },
    { feature: 'Say Hi discount', free: '0%', plus: '0%', premium: '10%', vip: '20%' },
    { feature: 'Profile Boost discount', free: '0%', plus: '0%', premium: '15%', vip: '25%' },
  ];

  return (
    <div className="py-4 px-4 animate-fade-in font-[Outfit]">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Upgrade Your Experience</h1>
        <p className="text-sm text-text-secondary mt-1">Connect more. Spend less. Stand out.</p>
        {currentTier !== 'free' && (
          <div className="mt-2 text-xs text-vibe font-medium">
            Current plan: {SUBSCRIPTION_TIERS.find(t => t.id === currentTier)?.name ?? currentTier}
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setBilling('monthly')}
          className={`text-sm font-medium py-2 px-4 rounded-xl transition-all ${
            billing === 'monthly' ? 'gradient-accent text-white' : 'text-text-secondary'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling('annual')}
          className={`text-sm font-medium py-2 px-4 rounded-xl transition-all ${
            billing === 'annual' ? 'gradient-accent text-white' : 'text-text-secondary'
          }`}
        >
          Annual
          <span className="ml-1 text-[10px] text-vibe font-bold">Save 25%</span>
        </button>
      </div>

      {/* Tier Cards */}
      <div className="space-y-4 mb-8">
        {SUBSCRIPTION_TIERS.filter(t => t.id !== 'free').map(tier => {
          const price = billing === 'monthly' ? tier.price : tier.annualPrice;
          const isPopular = tier.id === 'premium';
          const isCurrent = tier.id === currentTier;

          return (
            <div
              key={tier.id}
              className={`relative p-5 rounded-3xl transition-all ${
                isCurrent
                  ? 'glass border-2 border-vibe/40'
                  : isPopular
                  ? 'glass border-2 border-soul-500/30 glow-soul'
                  : 'glass'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-vibe/20 border border-vibe/40 text-[10px] font-bold text-vibe">
                  CURRENT PLAN
                </span>
              )}
              {!isCurrent && isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-soul text-[10px] font-bold text-white">
                  MOST POPULAR
                </span>
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tier.badge}</span>
                    <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-extrabold" style={{ color: tier.color }}>
                      ${price}
                    </span>
                    <span className="text-sm text-text-tertiary">/month</span>
                    {billing === 'annual' && (
                      <span className="ml-2 text-xs text-text-tertiary line-through">${tier.price}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key highlights */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-[10px] px-2 py-1 rounded-lg bg-dark-500/50 text-text-secondary text-center">
                  ⚡ {tier.dailySparks === Infinity ? '∞' : tier.dailySparks} Sparks/day
                </div>
                <div className="text-[10px] px-2 py-1 rounded-lg bg-dark-500/50 text-text-secondary text-center">
                  💎 {formatNumber(tier.monthlyVpBonus)} VP/mo
                </div>
                <div className="text-[10px] px-2 py-1 rounded-lg bg-dark-500/50 text-text-secondary text-center">
                  🤖 {tier.aiMessagesPerDay === Infinity ? '∞' : tier.aiMessagesPerDay} AI msg/day
                </div>
                <div className="text-[10px] px-2 py-1 rounded-lg bg-dark-500/50 text-text-secondary text-center">
                  📈 {tier.xpMultiplier}x XP
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {tier.features.slice(0, 6).map(f => (
                  <li key={f.text} className="flex items-center gap-2 text-xs">
                    {f.included ? (
                      <svg className="w-3.5 h-3.5 text-vibe flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-dark-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={f.included ? 'text-text-secondary' : 'text-dark-300'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-dark-500 text-text-tertiary cursor-default'
                    : isPopular
                    ? 'gradient-soul text-white hover:opacity-90'
                    : tier.id === 'vip'
                    ? 'gradient-accent text-white hover:opacity-90'
                    : 'bg-dark-500 text-text-primary hover:bg-dark-400'
                }`}
              >
                {isCurrent
                  ? 'Active'
                  : billing === 'annual'
                  ? `Subscribe — $${(price * 12).toFixed(0)}/year`
                  : `Subscribe — $${price}/month`}
              </button>
            </div>
          );
        })}
      </div>

      {/* 7-Day Free Trial Banner */}
      {currentTier === 'free' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-start/10 to-accent-end/10 border border-accent/20 text-center mb-8">
          <div className="text-sm font-bold text-accent mb-1">🎉 Try 7 Days Free</div>
          <div className="text-xs text-text-secondary">Cancel anytime during trial. No charge.</div>
        </div>
      )}

      {/* Full Comparison Table */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-text-primary mb-4">Full Feature Comparison</h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[500px] text-xs">
            <thead>
              <tr className="border-b border-dark-500/50">
                <th className="text-left py-2 text-text-tertiary font-normal w-[40%]">Feature</th>
                <th className="text-center py-2 text-text-tertiary font-normal">Free</th>
                <th className="text-center py-2 text-amber-400 font-bold">Plus</th>
                <th className="text-center py-2 text-soul-400 font-bold">Premium</th>
                <th className="text-center py-2 text-accent font-bold">VIP</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-dark-600/20' : ''}>
                  <td className="py-2 px-1 text-text-secondary">{row.feature}</td>
                  <td className="py-2 text-center text-text-tertiary">{row.free}</td>
                  <td className="py-2 text-center text-text-secondary">{row.plus}</td>
                  <td className="py-2 text-center text-text-secondary">{row.premium}</td>
                  <td className="py-2 text-center text-text-primary font-medium">{row.vip}</td>
                </tr>
              ))}
              {/* Price row */}
              <tr className="border-t border-dark-500/50">
                <td className="py-3 text-text-primary font-bold">Price / month</td>
                <td className="py-3 text-center text-text-tertiary">$0</td>
                <td className="py-3 text-center text-amber-400 font-bold">${billing === 'monthly' ? '7.99' : '5.99'}</td>
                <td className="py-3 text-center text-soul-400 font-bold">${billing === 'monthly' ? '19.99' : '14.99'}</td>
                <td className="py-3 text-center text-accent font-bold">${billing === 'monthly' ? '39.99' : '29.99'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-4">
        <Link
          href="/app"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Continue with Free plan →
        </Link>
      </div>
    </div>
  );
}
