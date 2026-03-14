'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchNearbyUsers, createSpark, getOrCreateConversation } from '@/lib/db';
import { getVipInfo, INTEREST_TAGS } from '@/lib/mock-data';

interface Candidate {
  id: string;
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  city: string;
  country: string;
  photos: string[];
  interests: string[];
  is_verified: boolean;
  vip_level: number;
}

type SparkPhase = 'queue' | 'match_card' | 'call' | 'voting' | 'result';

// ── Match Card ────────────────────────────────────────────

function MatchCard({
  candidate,
  matchScore,
  sharedInterests,
  onAccept,
  onSkip,
}: {
  candidate: Candidate;
  matchScore: number;
  sharedInterests: string[];
  onAccept: () => void;
  onSkip: () => void;
}) {
  const vipInfo = getVipInfo(candidate.vip_level);
  const avatar = candidate.photos?.[0];

  return (
    <div className="relative mx-4 rounded-3xl overflow-hidden glass animate-scale-in">
      {/* Photo */}
      <div className="relative h-[420px] bg-gradient-to-br from-dark-600 to-dark-800">
        {avatar ? (
          <img src={avatar} alt={candidate.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            {candidate.gender === 'Female' ? '👩🏾' : '👨🏾'}
          </div>
        )}

        {/* Match score */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full gradient-accent text-white text-sm font-bold">
          {matchScore}% Match
        </div>

        {/* Verified badge */}
        {candidate.is_verified && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-blue/20 backdrop-blur-sm text-blue text-xs font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white font-[Outfit]">{candidate.display_name}, {candidate.age}</h2>
            {vipInfo.badge && <span className="text-lg">{vipInfo.badge}</span>}
          </div>
          {(candidate.city || candidate.country) && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-text-secondary">📍 {[candidate.city, candidate.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {candidate.bio && (
            <p className="text-sm text-text-secondary mt-2 line-clamp-2">{candidate.bio}</p>
          )}
          {sharedInterests.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-text-tertiary mb-1.5">Shared Interests</div>
              <div className="flex flex-wrap gap-1.5">
                {sharedInterests.map((interest) => (
                  <span key={interest} className="text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent font-medium">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 p-6 bg-dark-800/50">
        <button
          onClick={onSkip}
          className="w-16 h-16 rounded-full bg-dark-500 flex items-center justify-center text-2xl hover:bg-dark-400 transition-all hover:scale-110 active:scale-95"
        >
          ✕
        </button>
        <button className="w-12 h-12 rounded-full bg-dark-500 flex items-center justify-center text-lg hover:bg-dark-400 transition-all">
          ⭐
        </button>
        <button
          onClick={onAccept}
          className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-2xl hover:scale-110 transition-all glow-accent active:scale-95"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}

// ── Call Screen ───────────────────────────────────────────

function CallScreen({ candidate, onEnd }: { candidate: Candidate; onEnd: () => void }) {
  const [seconds, setSeconds] = useState(300);
  const avatar = candidate.photos?.[0];

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (seconds === 0) onEnd();
  }, [seconds, onEnd]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 overflow-hidden animate-pulse-glow">
          {avatar ? (
            <img src={avatar} alt={candidate.display_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {candidate.gender === 'Female' ? '👩🏾' : '👨🏾'}
            </div>
          )}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full glass text-xs text-vibe font-medium whitespace-nowrap">
          Connected
        </div>
      </div>

      <h2 className="text-2xl font-bold text-text-primary font-[Outfit]">{candidate.display_name}</h2>
      <p className="text-text-secondary mt-1">Spark Voice Call</p>

      <div className="mt-6 text-4xl font-mono font-bold text-accent">
        {mins}:{secs.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-text-tertiary mt-1">Time remaining</div>

      <div className="mt-8 w-full max-w-xs">
        <div className="text-xs text-text-tertiary mb-2 text-center">💡 Conversation starters</div>
        <div className="space-y-2">
          {["What's the best trip you've ever taken?", "If you could master any skill, what would it be?", "What's your comfort food?"].map((q, i) => (
            <div key={i} className="p-3 rounded-xl bg-dark-700/50 text-sm text-text-secondary text-center">{q}</div>
          ))}
        </div>
      </div>

      <button onClick={onEnd} className="mt-8 w-16 h-16 rounded-full bg-red flex items-center justify-center hover:bg-red/80 transition-all">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
        </svg>
      </button>
    </div>
  );
}

// ── Voting Screen ─────────────────────────────────────────

function VotingScreen({ candidate, onVote }: { candidate: Candidate; onVote: (sparked: boolean) => void }) {
  const [timer, setTimer] = useState(60);
  const avatar = candidate.photos?.[0];

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer === 0) onVote(false);
  }, [timer, onVote]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-4 animate-fade-in text-center">
      <h2 className="text-2xl font-bold text-text-primary mb-2 font-[Outfit]">Did you feel the Spark?</h2>
      <p className="text-text-secondary text-sm mb-1">Vote within {timer} seconds</p>
      <div className="w-full max-w-xs h-1.5 rounded-full bg-dark-500 mb-8 overflow-hidden">
        <div className="h-full gradient-accent rounded-full transition-all duration-1000" style={{ width: `${(timer / 60) * 100}%` }} />
      </div>

      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 overflow-hidden mb-4">
        {avatar ? (
          <img src={avatar} alt={candidate.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {candidate.gender === 'Female' ? '👩🏾' : '👨🏾'}
          </div>
        )}
      </div>
      <h3 className="text-xl font-semibold text-text-primary">{candidate.display_name}</h3>

      <div className="flex items-center gap-8 mt-10">
        <button onClick={() => onVote(false)} className="flex flex-col items-center gap-2 group">
          <div className="w-20 h-20 rounded-full bg-dark-500 flex items-center justify-center text-3xl group-hover:bg-blue/20 group-hover:scale-110 transition-all">❄️</div>
          <span className="text-sm text-text-secondary">Pass</span>
        </button>
        <button onClick={() => onVote(true)} className="flex flex-col items-center gap-2 group">
          <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center text-3xl group-hover:scale-110 transition-all glow-accent">🔥</div>
          <span className="text-sm text-accent font-medium">Spark!</span>
        </button>
      </div>
    </div>
  );
}

// ── Result Screen ─────────────────────────────────────────

function ResultScreen({
  candidate,
  mutual,
  conversationId,
  onContinue,
}: {
  candidate: Candidate;
  mutual: boolean;
  conversationId?: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-4 text-center animate-fade-in">
      {mutual ? (
        <>
          <div className="text-8xl mb-6">🔥</div>
          <h2 className="text-3xl font-bold text-gradient-accent font-[Outfit]">It&apos;s a Spark!</h2>
          <p className="text-text-secondary mt-2 mb-6">
            You and {candidate.display_name} both felt the connection!<br />You can now chat freely.
          </p>
          <div className="flex gap-4">
            {conversationId ? (
              <Link href={`/app/chat/${conversationId}`} className="px-6 py-3 rounded-2xl gradient-accent text-white font-semibold hover:scale-105 transition-all">
                Send a Message 💬
              </Link>
            ) : (
              <Link href="/app/chat" className="px-6 py-3 rounded-2xl gradient-accent text-white font-semibold hover:scale-105 transition-all">
                Go to Chat 💬
              </Link>
            )}
            <button onClick={onContinue} className="px-6 py-3 rounded-2xl bg-dark-500 text-text-primary font-semibold hover:bg-dark-400 transition-all">
              Keep Sparking ⚡
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-8xl mb-6">💨</div>
          <h2 className="text-2xl font-bold text-text-primary font-[Outfit]">Not This Time</h2>
          <p className="text-text-secondary mt-2 mb-6">No worries! There are plenty more amazing people to meet.</p>
          <button onClick={onContinue} className="px-8 py-3 rounded-2xl gradient-accent text-white font-semibold hover:scale-105 transition-all">
            Find Next Spark ⚡
          </button>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function SparkPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [phase, setPhase] = useState<SparkPhase>('queue');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lastMatchResult, setLastMatchResult] = useState<{ mutual: boolean; conversationId?: string } | null>(null);
  const [sparksUsed, setSparksUsed] = useState(0);

  const sparksLimit = profile?.subscription_tier === 'free' ? 1 : 5;
  const sparksRemaining = Math.max(0, sparksLimit - sparksUsed);

  useEffect(() => {
    if (!user) return;
    fetchNearbyUsers({ limit: 30 })
      .then((data) => {
        const filtered = (data as Candidate[]).filter((u) => u.id !== user.id);
        setCandidates(filtered);
      })
      .catch(() => {})
      .finally(() => setLoadingCandidates(false));
  }, [user]);

  const currentCandidate = candidates[currentIdx % Math.max(candidates.length, 1)];

  const computeMatchScore = (candidate: Candidate): number => {
    const myInterests = profile?.interests ?? [];
    const shared = (candidate.interests ?? []).filter((i) => myInterests.includes(i));
    const base = 50 + shared.length * 10;
    return Math.min(base + Math.floor(Math.random() * 20), 99);
  };

  const getSharedInterests = (candidate: Candidate): string[] => {
    const myInterests = profile?.interests ?? [];
    return (candidate.interests ?? []).filter((i) => myInterests.includes(i)).slice(0, 3);
  };

  const handleAccept = async () => {
    if (!user || !currentCandidate) return;
    setPhase('call');
    setSparksUsed((s) => s + 1);
  };

  const handleSkip = () => {
    setCurrentIdx((i) => i + 1);
  };

  const handleEndCall = () => {
    setPhase('voting');
  };

  const handleVote = useCallback(async (sparked: boolean) => {
    if (!user || !currentCandidate) return;
    const matchScore = computeMatchScore(currentCandidate);
    try {
      const result = await createSpark(user.id, currentCandidate.id, matchScore);
      if (sparked && result.matched) {
        const conv = await getOrCreateConversation(user.id, currentCandidate.id);
        setLastMatchResult({ mutual: true, conversationId: conv.id });
      } else {
        setLastMatchResult({ mutual: false });
      }
    } catch {
      setLastMatchResult({ mutual: sparked });
    }
    setPhase('result');
  }, [user, currentCandidate]);

  const handleContinue = () => {
    setCurrentIdx((i) => i + 1);
    setLastMatchResult(null);
    setPhase('match_card');
  };

  // Queue screen
  if (phase === 'queue') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] px-6 text-center animate-fade-in font-[Outfit]">
        <div className="w-24 h-24 rounded-3xl gradient-accent flex items-center justify-center text-5xl mb-6 glow-accent animate-pulse-glow">
          ⚡
        </div>
        <h1 className="text-3xl font-bold text-text-primary">Spark</h1>
        <p className="text-text-secondary mt-2 max-w-xs">
          AI-powered matching. 5-minute voice call. Mutual decision. Real connection.
        </p>

        {loadingCandidates ? (
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs text-text-tertiary">Finding your matches…</p>
          </div>
        ) : (
          <>
            <div className="mt-6 text-sm text-text-tertiary">
              <span className="text-accent font-semibold">{sparksRemaining}</span> spark{sparksRemaining !== 1 ? 's' : ''} remaining today
              {candidates.length > 0 && (
                <span className="ml-2 text-text-tertiary">· {candidates.length} people nearby</span>
              )}
            </div>
            <button
              onClick={() => setPhase('match_card')}
              disabled={sparksRemaining === 0 || candidates.length === 0}
              className="mt-8 px-10 py-4 rounded-2xl gradient-accent text-white font-bold text-lg hover:scale-105 transition-all glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {candidates.length === 0 ? 'No matches nearby' : 'Start Spark ⚡'}
            </button>
            <Link href="/app/subscribe" className="mt-4 text-sm text-soul-400 hover:text-soul-300 transition-colors">
              Upgrade for more Sparks →
            </Link>
          </>
        )}
      </div>
    );
  }

  if (!currentCandidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] px-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-text-primary">You've seen everyone!</h2>
        <p className="text-text-secondary mt-2 text-sm">Check back later for new people nearby.</p>
        <button onClick={() => router.push('/app')} className="mt-6 px-6 py-3 rounded-2xl gradient-accent text-white font-semibold">
          Back to Discover
        </button>
      </div>
    );
  }

  const matchScore = computeMatchScore(currentCandidate);
  const sharedInterests = getSharedInterests(currentCandidate);

  if (phase === 'match_card') {
    return (
      <MatchCard
        candidate={currentCandidate}
        matchScore={matchScore}
        sharedInterests={sharedInterests}
        onAccept={handleAccept}
        onSkip={handleSkip}
      />
    );
  }

  if (phase === 'call') {
    return <CallScreen candidate={currentCandidate} onEnd={handleEndCall} />;
  }

  if (phase === 'voting') {
    return <VotingScreen candidate={currentCandidate} onVote={handleVote} />;
  }

  return (
    <ResultScreen
      candidate={currentCandidate}
      mutual={lastMatchResult?.mutual ?? false}
      conversationId={lastMatchResult?.conversationId}
      onContinue={handleContinue}
    />
  );
}
