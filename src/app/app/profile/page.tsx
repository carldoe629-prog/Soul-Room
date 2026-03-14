'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchSocialStats,
  fetchEarnings,
  fetchUserChallenges,
  fetchAchievements,
  fetchInventory,
} from '@/lib/db';
import { signOut, uploadPhoto } from '@/lib/auth';
import { INTEREST_TAGS, getVipInfo, formatNumber } from '@/lib/mock-data';

const VIP_THRESHOLDS = [0, 1000, 5000, 10000, 40000, 100000, 250000, 500000, 1000000];

// ── Helpers ───────────────────────────────────────────────

function RedDot() {
  return <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red border-2 border-dark-900 animate-pulse" />;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 mt-5 mb-2 flex items-center gap-2">
      <div className="h-px flex-1 bg-dark-400/30" />
      <span className="text-[10px] text-text-tertiary font-bold tracking-widest uppercase">{label}</span>
      <div className="h-px flex-1 bg-dark-400/30" />
    </div>
  );
}

function GridButton({ emoji, label, href, hasDot, sublabel, danger, onClick }: {
  emoji: string; label: string; href?: string; hasDot?: boolean;
  sublabel?: string; danger?: boolean; onClick?: () => void;
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
  return <button onClick={onClick} className="text-left">{content}</button>;
}

// ── Main Page ─────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [socialStats, setSocialStats] = useState({ friends: 0, following: 0, followers: 0, visitors: 0 });
  const [viewingSocial, setViewingSocial] = useState<{type: string, title: string} | null>(null);
  const [earnings, setEarnings] = useState({ balance_earned_vp: 0 });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [inventoryCount, setInventoryCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Sync editable fields with profile
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setInterests(profile.interests || []);
    }
  }, [profile]);

  // Fetch side-data
  useEffect(() => {
    if (!user) return;
    fetchSocialStats(user.id).then(setSocialStats).catch(() => {});
    fetchEarnings(user.id).then((d: any) => setEarnings(d)).catch(() => {});
    fetchUserChallenges(user.id).then(setChallenges).catch(() => {});
    fetchAchievements(user.id).then(setAchievements).catch(() => {});
    fetchInventory(user.id).then((d) => setInventoryCount(d.length)).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ bio, interests });
    await refreshProfile();
    setSaving(false);
    setIsEditing(false);
    setShowInterestPicker(false);
  };

  const handlePhotoUpload = async (idx: number, file: File) => {
    if (!user || !profile) return;
    setUploadingIdx(idx);
    try {
      const url = await uploadPhoto(user.id, file, idx);
      const newPhotos = [...(profile.photos || [])];
      newPhotos[idx] = url;
      await updateProfile({ photos: newPhotos });
      await refreshProfile();
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full gradient-accent animate-pulse" />
      </div>
    );
  }

  const vipLevel = profile?.subscription_tier === 'founder' ? 999 : (profile?.vip_level ?? 0);
  const totalXp = profile?.total_xp ?? 0;
  const vip = getVipInfo(vipLevel);
  const nextVip = getVipInfo(Math.min(vipLevel + 1, 8));
  const currentThreshold = VIP_THRESHOLDS[vipLevel] ?? 0;
  const nextThreshold = VIP_THRESHOLDS[Math.min(vipLevel + 1, 8)] ?? VIP_THRESHOLDS[8];
  const xpProgress = vipLevel < 8
    ? Math.min(((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;

  const activeChallenge = challenges[0]?.challenge;
  const challengeProgress = challenges[0]?.progress ?? 0;
  const earnedBadges = achievements.filter((a) => !!a.earned_at).length;
  const photos: (string | null)[] = [...(profile?.photos ?? [])];
  while (photos.length < 6) photos.push(null);

  const displayName = profile?.display_name ?? 'User';
  const avatarUrl = photos[0];
  const userId = user?.id?.slice(0, 8).toUpperCase() ?? '—';

  return (
    <div className="animate-fade-in pb-6 font-[Outfit]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <button onClick={() => alert('Settings coming soon!')} className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
          <span>⚙️</span> <span className="text-xs">Settings</span>
        </button>
        <button onClick={() => alert('Support coming soon!')} className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
          <span className="text-xs">Support</span> <span>🎧</span>
        </button>
      </div>

      {/* ── User Card ── */}
      <div className="mx-4 mt-4 p-5 rounded-3xl glass relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-start/5 via-transparent to-soul-500/5" />
        <div className="relative flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => isEditing && fileInputRef.current?.click()}
              className={`w-20 h-20 rounded-full overflow-hidden border-[3px] bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center ${
                vipLevel >= 5 ? 'border-soul-400 shadow-[0_0_12px_rgba(155,93,229,0.3)]' :
                vipLevel >= 3 ? 'border-accent shadow-[0_0_10px_rgba(255,107,107,0.2)]' :
                'border-dark-400'
              } ${isEditing ? 'cursor-pointer' : ''}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{profile?.gender === 'Female' ? '👩🏾' : '👨🏾'}</span>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📷 Edit</span>
                </div>
              )}
              {uploadingIdx === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(0, f);
              }}
            />
            {profile?.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue flex items-center justify-center border-2 border-dark-900">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-primary">{displayName}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-text-tertiary">ID: {userId}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(user?.id ?? '')}
                className="text-[10px] text-accent hover:text-accent/80 transition-colors"
              >
                📋
              </button>
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {profile?.gender === 'Female' ? '♀️' : '♂️'} {profile?.age}
              {profile?.country ? ` · 📍 ${profile.country}` : ''}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <Link href="/app/vp" className="px-3 py-1 rounded-full bg-soul-500/15 text-soul-400 text-xs font-bold hover:bg-soul-500/25 transition-all">
                💎 {formatNumber(profile?.vibe_points ?? 0)} VP
              </Link>
              <Link href="/app/vip-level" className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-all">
                {vip.badge || '🆕'} Level {vipLevel} {vip.name}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Social Stats ── */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-3">
        {[
          { value: socialStats.friends, label: 'Friends' },
          { value: socialStats.following, label: 'Following' },
          { value: socialStats.followers, label: 'Followers' },
          { value: socialStats.visitors, label: 'Visitors' },
        ].map((s) => (
          <button 
            key={s.label} 
            onClick={() => setViewingSocial({ type: s.label.toLowerCase(), title: s.label })}
            className="relative p-2.5 rounded-2xl glass text-center hover:bg-dark-600/50 transition-all"
          >
            <div className="text-lg font-bold text-text-primary">{s.value}</div>
            <div className="text-[10px] text-text-tertiary">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Primary Actions ── */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        <Link href="/app/vp" className="relative p-4 rounded-2xl text-center overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative">
            <span className="text-2xl">💰</span>
            <div className="text-sm font-bold text-white mt-1">RECHARGE VP</div>
            <div className="text-[10px] text-white/70">Buy Vibe Points</div>
          </div>
        </Link>
        <Link href="/app/vip-level" className="relative p-4 rounded-2xl text-center overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative">
            <span className="text-2xl">👑</span>
            <div className="text-sm font-bold text-white mt-1">VIP / NOBILITY</div>
            <div className="text-[10px] text-white/70">{vip.name} → {nextVip.name}</div>
          </div>
        </Link>
      </div>

      {/* ── Daily Challenge ── */}
      {activeChallenge && (
        <div className="px-4 mt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-soul-900/60 to-dark-700/60 border border-soul-500/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🎯</span>
              <span className="text-xs font-bold text-soul-400 tracking-wide">DAILY CHALLENGE</span>
            </div>
            <p className="text-sm text-text-primary">
              &ldquo;{activeChallenge.title} to get <span className="text-soul-400 font-bold">{activeChallenge.reward_vp} VP</span>&rdquo;
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <div className="h-1.5 flex-1 rounded-full bg-dark-600 overflow-hidden mr-3">
                <div
                  className="h-full rounded-full bg-soul-400 transition-all"
                  style={{ width: `${Math.min((challengeProgress / (activeChallenge.target_count || 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-text-tertiary">{challengeProgress}/{activeChallenge.target_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Financials ── */}
      <SectionLabel label="Financials" />
      <div className="grid grid-cols-3 gap-2 px-4">
        <GridButton
          emoji="💰"
          label="Income"
          hasDot={earnings.balance_earned_vp > 0}
          sublabel={`${formatNumber(earnings.balance_earned_vp)} 💎`}
        />
        <GridButton emoji="🏪" label="Store" href="/app/vp" sublabel="Gift Shop" />
        <GridButton emoji="🏰" label="Mall" sublabel="Cosmetics" />
      </div>

      {/* ── My Assets ── */}
      <SectionLabel label="My Assets" />
      <div className="grid grid-cols-4 gap-2 px-4">
        <GridButton emoji="🎒" label="Inventory" hasDot={inventoryCount > 0} sublabel={`${inventoryCount} items`} />
        <GridButton emoji="🛡️" label="My Level" href="/app/vip-level" sublabel={`Lvl ${vipLevel}`} />
        <GridButton emoji="🏅" label="Badges" sublabel={earnedBadges > 0 ? `${earnedBadges} earned` : 'None yet'} />
        <GridButton
          emoji={profile?.is_verified ? '✅' : '❌'}
          label={profile?.is_verified ? 'Verified' : 'Verify'}
          sublabel={profile?.is_verified ? undefined : 'Unverified'}
          danger={!profile?.is_verified}
        />
      </div>

      {/* ── Services ── */}
      <SectionLabel label="Services" />
      <div className="grid grid-cols-3 gap-2 px-4">
        <GridButton emoji="👪" label="Referrals" sublabel={profile?.referral_code ?? 'Earn VP'} />
        <GridButton emoji="📝" label="Feedback" sublabel="Report" />
        <GridButton emoji="⚙️" label="Settings" sublabel="Privacy" />
      </div>

      {/* ── VIP XP Progress ── */}
      <Link href="/app/vip-level" className="block px-4 mt-4">
        <div className="p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{vip.badge || '🆕'}</span>
              <span className="text-sm font-bold text-text-primary">{vip.name} · Level {vipLevel}</span>
            </div>
            <span className="text-xs text-accent font-medium">View VIP →</span>
          </div>
          <div className="h-2.5 rounded-full bg-dark-600 overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-start to-accent-end transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-secondary">{formatNumber(totalXp)} XP</span>
            {vipLevel < 8 && (
              <span className="text-text-tertiary">
                {formatNumber(nextThreshold - totalXp)} XP to {nextVip.badge} {nextVip.name}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* ── Edit Profile Button ── */}
      <div className="px-4 mt-4 flex gap-3">
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={saving}
          className="flex-1 py-3 rounded-2xl glass text-sm font-semibold text-text-primary hover:bg-dark-500 transition-all disabled:opacity-50"
        >
          {saving ? '💾 Saving…' : isEditing ? '✓ Save Profile' : '✏️ Edit Profile'}
        </button>
        {isEditing && (
          <button
            onClick={() => { setIsEditing(false); setShowInterestPicker(false); setBio(profile?.bio ?? ''); setInterests(profile?.interests ?? []); }}
            className="px-4 py-3 rounded-2xl glass text-sm text-text-secondary hover:bg-dark-500 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* ── Bio ── */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">About Me</h3>
        <div className="p-4 rounded-2xl glass">
          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              className="w-full bg-transparent text-sm text-text-primary outline-none resize-none h-20 placeholder-text-tertiary"
              placeholder="Write something about yourself..."
            />
          ) : (
            <p className="text-sm text-text-primary">{bio || 'No bio yet.'}</p>
          )}
        </div>
      </div>

      {/* ── Photos ── */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Photos</h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-dark-600">
              {photo ? (
                <>
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
                      <span className="text-white text-xs font-bold">📷</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, f); }}
                      />
                    </label>
                  )}
                </>
              ) : (
                <label className={`w-full h-full flex items-center justify-center border-2 border-dashed transition-colors ${isEditing ? 'border-accent/50 cursor-pointer hover:bg-accent/5' : 'border-dark-400'}`}>
                  {uploadingIdx === idx ? (
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  ) : isEditing ? (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF4B6E" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(idx, f); }}
                      />
                    </>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4D4D66" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Details ── */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Details</h3>
        <div className="space-y-2">
          {[
            { icon: '👤', label: 'Looking for', value: profile?.looking_for },
            { icon: '🌐', label: 'Languages', value: (profile?.languages ?? []).join(', ') },
            { icon: '💼', label: 'Occupation', value: profile?.occupation },
            { icon: '🌍', label: 'Home World', value: profile?.home_world },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl glass">
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="text-xs text-text-tertiary">{item.label}</div>
                <div className="text-sm text-text-primary">{item.value || 'Not set'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Interests ── */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Interests</h3>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => {
            const tag = INTEREST_TAGS.find((t) => t.tag === interest);
            return (
              <span
                key={interest}
                onClick={() => isEditing && toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 ${
                  isEditing ? 'bg-accent/20 text-accent cursor-pointer' : 'bg-accent/10 text-accent'
                }`}
              >
                {tag?.emoji} {interest}
                {isEditing && <span className="ml-1 text-xs opacity-60">✕</span>}
              </span>
            );
          })}
          {isEditing && (
            <button
              onClick={() => setShowInterestPicker(!showInterestPicker)}
              className="px-3 py-1.5 rounded-full border-2 border-dashed border-accent/50 text-accent text-sm hover:bg-accent/5 transition-colors"
            >
              + Add
            </button>
          )}
        </div>

        {/* Interest picker */}
        {showInterestPicker && (
          <div className="mt-3 p-3 rounded-2xl glass max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {INTEREST_TAGS.filter((t) => !interests.includes(t.tag)).map((t) => (
                <button
                  key={t.tag}
                  onClick={() => toggleInterest(t.tag)}
                  className="px-3 py-1.5 rounded-full bg-dark-600 text-text-secondary text-xs hover:bg-accent/10 hover:text-accent transition-all"
                >
                  {t.emoji} {t.tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Subscription ── */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Subscription</h3>
        <Link href="/app/subscribe" className="block p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⭐</div>
              <div>
                <div className="text-sm font-semibold text-text-primary capitalize">
                  {profile?.subscription_tier === 'free' ? 'Free Plan' : `${profile?.subscription_tier} Plan`}
                </div>
                <div className="text-xs text-text-tertiary">
                  {profile?.subscription_tier === 'free' ? 'Upgrade for more features' : 'Active subscription'}
                </div>
              </div>
            </div>
            {profile?.subscription_tier === 'free' && (
              <span className="text-xs text-soul-400 font-medium">Upgrade →</span>
            )}
          </div>
        </Link>
      </div>

      {/* ── Sign Out ── */}
      <div className="px-4 mt-6 mb-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl glass hover:bg-red/10 transition-all"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm text-red font-medium">Sign Out</span>
        </button>
      </div>

      {/* ── Social stats Modal ── */}
      {viewingSocial && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end" onClick={() => setViewingSocial(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-auto bg-dark-800 rounded-t-3xl min-h-[50vh] p-6 animate-slide-up border-t border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white capitalize">{viewingSocial.title}</h3>
              <button onClick={() => setViewingSocial(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-white hover:bg-dark-500 transition-colors">
                ✕
              </button>
            </div>
            
            {(socialStats as any)[viewingSocial.type] > 0 ? (
              <div className="space-y-3">
                {/* Mock Users List */}
                {[...Array(Math.min((socialStats as any)[viewingSocial.type], 5))].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl glass">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-xl">
                        {['👤', '👩🏾', '👨🏾', '👱‍♀️', '🧔'][i % 5]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">User {i + 1}</div>
                        <div className="text-xs text-text-tertiary">Active {i + 1}h ago</div>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all">
                      View
                    </button>
                  </div>
                ))}
                {(socialStats as any)[viewingSocial.type] > 5 && (
                  <div className="text-center mt-4">
                    <button className="text-xs text-text-secondary hover:text-white transition-colors">Load more...</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-60">
                <div className="text-4xl">👻</div>
                <div className="text-sm text-text-secondary">No {viewingSocial.title.toLowerCase()} yet.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
