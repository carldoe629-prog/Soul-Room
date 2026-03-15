'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { claimDailyReward, type DailyRewardResult } from '@/lib/db';
import { formatNumber } from '@/lib/mock-data';

export default function DailyRewardPage() {
  const router = useRouter();
  const { user, profile, isDemoMode, refreshProfile } = useAuth();

  const [state, setState] = useState<'loading' | 'claimed' | 'already_claimed' | 'error'>('loading');
  const [result, setResult] = useState<DailyRewardResult | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      // Simulate a claim for demo mode
      setResult({
        alreadyClaimed: false,
        vpAwarded: 100,
        bonusVp: 0,
        totalVp: 100,
        streak: 6,
        streakMilestone: false,
        nextRewardAt: new Date(Date.now() + 86400000).toISOString(),
      });
      setState('claimed');
      setTimeout(() => setAnimate(true), 100);
      return;
    }

    claimDailyReward(user.id)
      .then((res) => {
        setResult(res);
        if (res.alreadyClaimed) {
          setState('already_claimed');
        } else {
          setState('claimed');
          setTimeout(() => setAnimate(true), 100);
          // Refresh profile to update VP balance in context
          refreshProfile();
        }
      })
      .catch(() => {
        setState('error');
      });
  }, [user, isDemoMode, refreshProfile]);

  function formatNextReward(isoString: string) {
    const d = new Date(isoString);
    const hours = Math.max(0, Math.floor((d.getTime() - Date.now()) / 3600000));
    const mins = Math.max(0, Math.floor(((d.getTime() - Date.now()) % 3600000) / 60000));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 animate-fade-in font-[Outfit]">
      {/* Close button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-vibe border-t-transparent animate-spin" />
          <p className="text-text-secondary text-sm">Claiming your reward...</p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">😕</span>
          <p className="text-text-primary font-bold text-lg">Something went wrong</p>
          <p className="text-text-secondary text-sm">Could not claim your daily reward. Try again later.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-2xl glass text-text-primary font-medium"
          >
            Close
          </button>
        </div>
      )}

      {/* Already Claimed */}
      {state === 'already_claimed' && result && (
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <span className="text-6xl">✅</span>
          <h1 className="text-2xl font-extrabold text-text-primary">Already Claimed!</h1>
          <p className="text-text-secondary text-sm">
            You've already collected today's reward. Come back in{' '}
            <span className="text-vibe font-bold">{formatNextReward(result.nextRewardAt)}</span>
          </p>

          {/* Streak badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-amber-500/20">
            <span className="text-lg">🔥</span>
            <span className="text-amber-400 font-bold text-sm">{result.streak} day streak</span>
          </div>

          <button
            onClick={() => router.back()}
            className="mt-2 px-8 py-3 rounded-2xl glass text-text-secondary font-medium hover:text-text-primary transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Claimed Successfully */}
      {state === 'claimed' && result && (
        <div className={`flex flex-col items-center gap-5 text-center max-w-sm transition-all duration-500 ${animate ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>

          {/* Streak milestone celebration */}
          {result.streakMilestone ? (
            <>
              <span className="text-7xl animate-bounce-slow">🏆</span>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                {result.streak} Day Streak!
              </h1>
              <p className="text-text-secondary text-sm">Streak milestone bonus unlocked!</p>

              {/* VP breakdown */}
              <div className="w-full p-5 rounded-2xl glass border border-dark-400/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Daily reward</span>
                  <span className="text-text-primary font-bold">+{formatNumber(result.vpAwarded)} VP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Streak bonus</span>
                  <span className="text-vibe font-bold">+{formatNumber(result.bonusVp)} VP 🎉</span>
                </div>
                <div className="h-px bg-dark-400/30" />
                <div className="flex items-center justify-center">
                  <div className="px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/30">
                    <span className="text-xl font-extrabold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                      +{formatNumber(result.totalVp)} VP
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-7xl">🔥</span>
              <h1 className="text-2xl font-extrabold text-text-primary">Daily Reward Claimed!</h1>

              {/* VP total */}
              <div className="px-8 py-3 rounded-full bg-amber-500/10 border border-amber-500/30">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  +{formatNumber(result.totalVp)} VP
                </span>
              </div>

              {/* Streak badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-amber-500/20">
                <span className="text-lg">🔥</span>
                <span className="text-amber-400 font-bold text-sm">{result.streak} day streak</span>
              </div>
            </>
          )}

          {/* Next reward */}
          <p className="text-text-tertiary text-xs">
            Next reward in {formatNextReward(result.nextRewardAt)}
          </p>

          {/* Done button */}
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 rounded-2xl gradient-accent text-white font-bold text-base hover:opacity-90 transition-opacity"
          >
            Nice! 👊
          </button>
        </div>
      )}
    </div>
  );
}
