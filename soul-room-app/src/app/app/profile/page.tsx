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
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [bio, setBio] = useState('');
  const [editLookingFor, setEditLookingFor] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editHomeWorld, setEditHomeWorld] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [socialStats, setSocialStats] = useState({ friends: 0, following: 0, followers: 0, visitors: 0 });
  const [viewingSocial, setViewingSocial] = useState<{type: string, title: string} | null>(null);
  const [earnings, setEarnings] = useState({ balance_earned_vp: 0 });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [inventory, setInventory] = useState<any[]>([]);

  // Modal states
  type ModalType = 'income' | 'mall' | 'inventory' | 'badges' | 'verify' | 'referrals' | 'feedback' | 'settings' | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Sync editable fields with profile
  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name || '');
      setEditCity(profile.city || '');
      setEditCountry(profile.country || '');
      setBio(profile.bio || '');
      setEditLookingFor(profile.looking_for || '');
      setEditLanguages((profile.languages || []).join(', '));
      setEditOccupation(profile.occupation || '');
      setEditHomeWorld(profile.home_world || '');
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
    fetchInventory(user.id).then((d) => { setInventory(d); setInventoryCount(d.length); }).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      display_name: editName.trim() || undefined,
      city: editCity.trim() || undefined,
      country: editCountry.trim() || undefined,
      bio,
      looking_for: editLookingFor || undefined,
      languages: editLanguages.split(',').map((l) => l.trim()).filter(Boolean),
      occupation: editOccupation.trim() || undefined,
      home_world: editHomeWorld.trim() || undefined,
      interests,
    });
    await refreshProfile();
    setSaving(false);
    setIsEditing(false);
    setShowInterestPicker(false);
  };

  const cancelEdit = () => {
    if (!profile) return;
    setEditName(profile.display_name || '');
    setEditCity(profile.city || '');
    setEditCountry(profile.country || '');
    setBio(profile.bio || '');
    setEditLookingFor(profile.looking_for || '');
    setEditLanguages((profile.languages || []).join(', '));
    setEditOccupation(profile.occupation || '');
    setEditHomeWorld(profile.home_world || '');
    setInterests(profile.interests || []);
    setIsEditing(false);
    setShowInterestPicker(false);
  };

  const copyReferral = () => {
    navigator.clipboard?.writeText(profile?.referral_code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const isFounder = profile?.subscription_tier === 'founder';
  const vipLevel = isFounder ? 999 : (profile?.vip_level ?? 0);
  const totalXp = profile?.total_xp ?? 0;
  const vip = getVipInfo(vipLevel);
  const nextVip = isFounder ? vip : getVipInfo(Math.min(vipLevel + 1, 8));
  const currentThreshold = VIP_THRESHOLDS[Math.min(vipLevel, 8)] ?? 0;
  const nextThreshold = VIP_THRESHOLDS[Math.min(vipLevel + 1, 8)] ?? VIP_THRESHOLDS[8];
  const xpProgress = isFounder ? 100 : vipLevel < 8
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
            {isEditing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={32}
                className="w-full bg-dark-700/50 border border-accent/30 rounded-xl px-3 py-1.5 text-base font-bold text-text-primary outline-none focus:border-accent transition-colors"
                placeholder="Display name"
              />
            ) : (
              <h1 className="text-lg font-bold text-text-primary">{displayName}</h1>
            )}
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
              {profile?.gender === 'Female' ? '♀️' : profile?.gender === 'Non-binary' ? '⚧️' : '♂️'} {profile?.age}
              {profile?.country ? ` · 📍 ${profile.country}` : ''}
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <Link href="/app/vp" className="px-3 py-1 rounded-full bg-soul-500/15 text-soul-400 text-xs font-bold hover:bg-soul-500/25 transition-all">
                💎 {isFounder ? '∞' : formatNumber(profile?.vibe_points ?? 0)} VP
              </Link>
              <Link href="/app/vip-level" className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${isFounder ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
                {vip.badge} {isFounder ? 'Founder' : `Level ${vipLevel} ${vip.name}`}
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
          onClick={() => setActiveModal('income')}
        />
        <GridButton emoji="🏪" label="Store" href="/app/vp" sublabel="Gift Shop" />
        <GridButton emoji="🏰" label="Mall" sublabel="Cosmetics" onClick={() => setActiveModal('mall')} />
      </div>

      {/* ── My Assets ── */}
      <SectionLabel label="My Assets" />
      <div className="grid grid-cols-4 gap-2 px-4">
        <GridButton emoji="🎒" label="Inventory" hasDot={inventoryCount > 0} sublabel={`${inventoryCount} items`} onClick={() => setActiveModal('inventory')} />
        <GridButton emoji="🛡️" label="My Level" href="/app/vip-level" sublabel={`Lvl ${vipLevel}`} />
        <GridButton emoji="🏅" label="Badges" sublabel={earnedBadges > 0 ? `${earnedBadges} earned` : 'None yet'} onClick={() => setActiveModal('badges')} />
        <GridButton
          emoji={profile?.is_verified ? '✅' : '❌'}
          label={profile?.is_verified ? 'Verified' : 'Verify'}
          sublabel={profile?.is_verified ? undefined : 'Unverified'}
          danger={!profile?.is_verified}
          onClick={() => setActiveModal('verify')}
        />
      </div>

      {/* ── Services ── */}
      <SectionLabel label="Services" />
      <div className="grid grid-cols-3 gap-2 px-4">
        <GridButton emoji="👪" label="Referrals" sublabel={profile?.referral_code ?? 'Earn VP'} onClick={() => setActiveModal('referrals')} />
        <GridButton emoji="📝" label="Feedback" sublabel="Send Report" onClick={() => setActiveModal('feedback')} />
        <GridButton emoji="⚙️" label="Settings" sublabel="Privacy" onClick={() => setActiveModal('settings')} />
      </div>

      {/* ── VIP XP Progress ── */}
      <Link href="/app/vip-level" className="block px-4 mt-4">
        <div className="p-4 rounded-2xl glass hover:bg-dark-600/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{vip.badge || '🆕'}</span>
              <span className="text-sm font-bold text-text-primary">
                {isFounder ? 'Founder' : `${vip.name} · Level ${vipLevel}`}
              </span>
            </div>
            <span className="text-xs text-accent font-medium">View VIP →</span>
          </div>
          <div className="h-2.5 rounded-full bg-dark-600 overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all ${isFounder ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-accent-start to-accent-end'}`}
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-secondary">{isFounder ? '∞ VP · All privileges' : `${formatNumber(totalXp)} XP`}</span>
            {!isFounder && vipLevel < 8 && (
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
            onClick={cancelEdit}
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
          {isEditing ? (
            <>
              {/* Location row */}
              <div className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="text-lg flex-shrink-0">📍</span>
                <div className="flex-1 flex gap-2">
                  <input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="City"
                    className="flex-1 min-w-0 bg-transparent text-sm text-text-primary outline-none placeholder-text-tertiary border-b border-white/10 focus:border-accent pb-0.5 transition-colors"
                  />
                  <input
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="Country"
                    className="flex-1 min-w-0 bg-transparent text-sm text-text-primary outline-none placeholder-text-tertiary border-b border-white/10 focus:border-accent pb-0.5 transition-colors"
                  />
                </div>
              </div>
              {/* Looking for */}
              <div className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="text-lg flex-shrink-0">👤</span>
                <div className="flex-1">
                  <div className="text-xs text-text-tertiary mb-1">Looking for</div>
                  <select
                    value={editLookingFor}
                    onChange={(e) => setEditLookingFor(e.target.value)}
                    className="w-full bg-transparent text-sm text-text-primary outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="Friendship">Friendship</option>
                    <option value="Dating">Dating</option>
                    <option value="Relationship">Relationship</option>
                    <option value="Casual">Casual</option>
                    <option value="Networking">Networking</option>
                  </select>
                </div>
              </div>
              {/* Languages */}
              <div className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="text-lg flex-shrink-0">🌐</span>
                <div className="flex-1">
                  <div className="text-xs text-text-tertiary mb-0.5">Languages (comma-separated)</div>
                  <input
                    value={editLanguages}
                    onChange={(e) => setEditLanguages(e.target.value)}
                    placeholder="e.g. English, French"
                    className="w-full bg-transparent text-sm text-text-primary outline-none placeholder-text-tertiary border-b border-white/10 focus:border-accent pb-0.5 transition-colors"
                  />
                </div>
              </div>
              {/* Occupation */}
              <div className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="text-lg flex-shrink-0">💼</span>
                <div className="flex-1">
                  <div className="text-xs text-text-tertiary mb-0.5">Occupation</div>
                  <input
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    placeholder="What do you do?"
                    className="w-full bg-transparent text-sm text-text-primary outline-none placeholder-text-tertiary border-b border-white/10 focus:border-accent pb-0.5 transition-colors"
                  />
                </div>
              </div>
              {/* Home World */}
              <div className="flex items-center gap-3 p-3 rounded-xl glass">
                <span className="text-lg flex-shrink-0">🌍</span>
                <div className="flex-1">
                  <div className="text-xs text-text-tertiary mb-0.5">Home World</div>
                  <input
                    value={editHomeWorld}
                    onChange={(e) => setEditHomeWorld(e.target.value)}
                    placeholder="Your world or community"
                    className="w-full bg-transparent text-sm text-text-primary outline-none placeholder-text-tertiary border-b border-white/10 focus:border-accent pb-0.5 transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {(profile?.city || profile?.country) && (
                <div className="flex items-center gap-3 p-3 rounded-xl glass">
                  <span className="text-lg">📍</span>
                  <div className="flex-1">
                    <div className="text-xs text-text-tertiary">Location</div>
                    <div className="text-sm text-text-primary">
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              )}
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
            </>
          )}
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
              <h3 className="text-xl font-bold text-text-primary capitalize">{viewingSocial.title}</h3>
              <button onClick={() => setViewingSocial(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
            </div>
            {(socialStats as any)[viewingSocial.type] > 0 ? (
              <div className="space-y-3">
                {[...Array(Math.min((socialStats as any)[viewingSocial.type], 5))].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl glass">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-xl">{['👤', '👩🏾', '👨🏾', '👱‍♀️', '🧔'][i % 5]}</div>
                      <div>
                        <div className="text-sm font-bold text-text-primary">User {i + 1}</div>
                        <div className="text-xs text-text-tertiary">Active {i + 1}h ago</div>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all">View</button>
                  </div>
                ))}
                {(socialStats as any)[viewingSocial.type] > 5 && (
                  <div className="text-center mt-4"><button className="text-xs text-text-secondary hover:text-text-primary transition-colors">Load more...</button></div>
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

      {/* ── Bottom Sheet Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end" onClick={() => setActiveModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-auto bg-dark-800 rounded-t-3xl p-6 animate-slide-up border-t border-white/10 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {/* ── Income ── */}
            {activeModal === 'income' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">💰 My Income</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 mb-4">
                  <div className="text-xs text-text-tertiary mb-1">Total Earned VP</div>
                  <div className="text-3xl font-bold text-amber-400">💎 {formatNumber(earnings.balance_earned_vp)}</div>
                  <div className="text-xs text-text-tertiary mt-1">Earned from gifts received</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl glass">
                    <div className="text-sm text-text-secondary">VP Balance</div>
                    <div className="text-sm font-bold text-text-primary">{formatNumber(profile?.vibe_points ?? 0)} VP</div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl glass">
                    <div className="text-sm text-text-secondary">Earned this month</div>
                    <div className="text-sm font-bold text-amber-400">{formatNumber(earnings.balance_earned_vp)} VP</div>
                  </div>
                </div>
                <Link href="/app/vp" onClick={() => setActiveModal(null)} className="mt-4 block w-full py-3 rounded-2xl gradient-accent text-white text-sm font-bold text-center hover:opacity-90 transition-opacity">
                  View Full VP History →
                </Link>
              </>
            )}

            {/* ── Mall ── */}
            {activeModal === 'mall' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">🏰 Mall</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '🎭', name: 'Avatars', desc: 'Custom profile frames', price: 500 },
                    { emoji: '✨', name: 'Effects', desc: 'Entry animations', price: 800 },
                    { emoji: '🎨', name: 'Themes', desc: 'Room themes', price: 1200 },
                    { emoji: '🏷️', name: 'Name Tags', desc: 'Colored name badges', price: 300 },
                  ].map((item) => (
                    <div key={item.name} className="p-4 rounded-2xl glass text-center">
                      <div className="text-3xl mb-2">{item.emoji}</div>
                      <div className="text-sm font-bold text-text-primary">{item.name}</div>
                      <div className="text-[10px] text-text-tertiary mb-2">{item.desc}</div>
                      <button className="w-full py-1.5 rounded-xl gradient-accent text-white text-xs font-bold hover:opacity-90 transition-opacity">
                        💎 {item.price} VP
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-text-tertiary mt-4">More cosmetics coming soon!</p>
              </>
            )}

            {/* ── Inventory ── */}
            {activeModal === 'inventory' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">🎒 Inventory</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                {inventory.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {inventory.map((item: any, i: number) => (
                      <div key={i} className="p-3 rounded-2xl glass text-center">
                        <div className="text-2xl mb-1">{item.item?.emoji || '🎁'}</div>
                        <div className="text-xs font-medium text-text-primary truncate">{item.item?.name || 'Item'}</div>
                        {item.quantity > 1 && <div className="text-[10px] text-text-tertiary">x{item.quantity}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-60">
                    <div className="text-5xl">🎒</div>
                    <div className="text-sm text-text-secondary">Your inventory is empty</div>
                    <Link href="/app/vp" onClick={() => setActiveModal(null)} className="text-xs text-accent">Browse Gift Shop →</Link>
                  </div>
                )}
              </>
            )}

            {/* ── Badges ── */}
            {activeModal === 'badges' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">🏅 Badges & Achievements</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                {achievements.length > 0 ? (
                  <div className="space-y-2">
                    {achievements.map((a: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl glass ${!a.earned_at ? 'opacity-40' : ''}`}>
                        <div className="text-2xl flex-shrink-0">{a.achievement?.badge_emoji || '🏅'}</div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-text-primary">{a.achievement?.name || 'Achievement'}</div>
                          <div className="text-xs text-text-tertiary">{a.achievement?.description || ''}</div>
                        </div>
                        {a.earned_at ? (
                          <span className="text-xs text-vibe font-bold">✓ Earned</span>
                        ) : (
                          <span className="text-xs text-text-tertiary">Locked</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-60">
                    <div className="text-5xl">🏅</div>
                    <div className="text-sm text-text-secondary">No badges yet — keep engaging!</div>
                  </div>
                )}
              </>
            )}

            {/* ── Verify ── */}
            {activeModal === 'verify' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">{profile?.is_verified ? '✅ Verified Account' : '🔵 Get Verified'}</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                {profile?.is_verified ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <div className="text-lg font-bold text-text-primary mb-2">Your account is verified</div>
                    <div className="text-sm text-text-tertiary">You have a verified badge on your profile. Other users can trust that you&apos;re a real person.</div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-blue/10 border border-blue/20 mb-4">
                      <div className="text-sm font-bold text-text-primary mb-1">Why get verified?</div>
                      <ul className="text-xs text-text-secondary space-y-1">
                        <li>✓ Blue verified badge on your profile</li>
                        <li>✓ Higher trust score with other users</li>
                        <li>✓ Priority in discovery & Spark</li>
                        <li>✓ Unlock exclusive features</li>
                      </ul>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="text-xs font-bold text-text-tertiary tracking-wider">HOW TO GET VERIFIED</div>
                      {['Upload a clear profile photo', 'Complete your profile (bio, interests, details)', 'Be active for at least 7 days', 'Submit a verification selfie via Support'].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass">
                          <div className="w-6 h-6 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                          <div className="text-sm text-text-primary">{step}</div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 rounded-2xl gradient-soul text-white text-sm font-bold hover:opacity-90 transition-opacity">
                      Submit Verification Request
                    </button>
                  </>
                )}
              </>
            )}

            {/* ── Referrals ── */}
            {activeModal === 'referrals' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">👪 Referrals</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-soul-500/10 to-accent-start/10 border border-soul-500/20 mb-4">
                  <div className="text-xs text-text-tertiary mb-1">Your referral code</div>
                  <div className="text-2xl font-bold text-text-primary tracking-widest">{profile?.referral_code || '—'}</div>
                </div>
                <button
                  onClick={copyReferral}
                  className="w-full py-3 rounded-2xl glass text-sm font-semibold text-text-primary hover:bg-dark-500 transition-all mb-3 flex items-center justify-center gap-2"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-bold text-text-tertiary tracking-wider mb-2">HOW IT WORKS</div>
                  {[
                    { emoji: '📤', text: 'Share your code with friends' },
                    { emoji: '📲', text: 'They sign up using your code' },
                    { emoji: '💎', text: 'You both earn 500 VP when they join' },
                    { emoji: '🎁', text: 'Earn bonus VP for every 5 referrals' },
                  ].map((step) => (
                    <div key={step.text} className="flex items-center gap-3 p-3 rounded-xl glass">
                      <span className="text-lg">{step.emoji}</span>
                      <span className="text-sm text-text-primary">{step.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Feedback ── */}
            {activeModal === 'feedback' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">📝 Feedback & Report</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                {feedbackSent ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">🙏</div>
                    <div className="text-lg font-bold text-text-primary mb-2">Thank you!</div>
                    <div className="text-sm text-text-tertiary">Your feedback has been sent. We&apos;ll review it shortly.</div>
                    <button onClick={() => { setFeedbackSent(false); setFeedbackText(''); setActiveModal(null); }} className="mt-4 text-xs text-accent">Close</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {['Bug Report', 'Suggestion', 'Harassment', 'Other'].map((type) => (
                        <button key={type} className="p-3 rounded-xl glass text-sm text-text-primary hover:bg-dark-500 transition-all text-center">{type}</button>
                      ))}
                    </div>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Describe your issue or feedback..."
                      className="w-full h-32 bg-dark-700/50 border border-white/10 rounded-2xl p-3 text-sm text-text-primary outline-none focus:border-accent transition-colors resize-none placeholder-text-tertiary mb-3"
                    />
                    <button
                      onClick={() => feedbackText.trim() && setFeedbackSent(true)}
                      disabled={!feedbackText.trim()}
                      className="w-full py-3 rounded-2xl gradient-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Send Feedback
                    </button>
                  </>
                )}
              </>
            )}

            {/* ── Settings ── */}
            {activeModal === 'settings' && (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-text-primary">⚙️ Settings & Privacy</h3>
                  <button onClick={() => setActiveModal(null)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-primary hover:bg-dark-500 transition-colors">✕</button>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-text-tertiary tracking-wider mb-2">PRIVACY</div>
                  {[
                    { label: 'Show online status', default: true },
                    { label: 'Allow Say Hi requests', default: true },
                    { label: 'Show profile in discovery', default: true },
                    { label: 'Allow friend requests', default: true },
                  ].map((setting) => (
                    <div key={setting.label} className="flex items-center justify-between p-3 rounded-xl glass">
                      <span className="text-sm text-text-primary">{setting.label}</span>
                      <div className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${setting.default ? 'bg-vibe' : 'bg-dark-500'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${setting.default ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                  <div className="text-xs font-bold text-text-tertiary tracking-wider mt-4 mb-2">NOTIFICATIONS</div>
                  {[
                    { label: 'Spark matches', default: true },
                    { label: 'New messages', default: true },
                    { label: 'Gift received', default: true },
                    { label: 'Promotional offers', default: false },
                  ].map((setting) => (
                    <div key={setting.label} className="flex items-center justify-between p-3 rounded-xl glass">
                      <span className="text-sm text-text-primary">{setting.label}</span>
                      <div className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${setting.default ? 'bg-vibe' : 'bg-dark-500'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${setting.default ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                  <div className="text-xs font-bold text-text-tertiary tracking-wider mt-4 mb-2">ACCOUNT</div>
                  <button className="w-full p-3 rounded-xl glass text-sm text-red text-left hover:bg-red/5 transition-all">
                    🚫 Deactivate Account
                  </button>
                  <button className="w-full p-3 rounded-xl glass text-sm text-red text-left hover:bg-red/5 transition-all">
                    🗑️ Delete Account
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
