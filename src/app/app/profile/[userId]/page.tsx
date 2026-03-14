'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchUserProfile,
  recordProfileView,
  getOrCreateConversation,
  createSpark,
  blockUser,
  reportUser,
  fetchSocialStats,
} from '@/lib/db';
import { INTEREST_TAGS, getVipInfo } from '@/lib/mock-data';

interface ProfileData {
  id: string;
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  city: string;
  country: string;
  languages: string[];
  interests: string[];
  photos: string[];
  is_verified: boolean;
  is_online: boolean;
  last_online_at: string | null;
  vip_level: number;
  vibe_rating: number;
  vibe_rating_count: number;
  looking_for: string;
  occupation: string;
  home_world: string;
  trust_score: number;
}

function getLastSeenLabel(user: ProfileData): string {
  if (user.is_online) return 'Online now';
  if (!user.last_online_at) return '';
  const mins = Math.floor((Date.now() - new Date(user.last_online_at).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [socialStats, setSocialStats] = useState({ friends: 0, following: 0, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [sparked, setSparked] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserProfile(userId)
      .then((data) => { setProfile(data as ProfileData); setLoading(false); })
      .catch(() => setLoading(false));
    fetchSocialStats(userId)
      .then((s) => setSocialStats({ friends: s.friends, following: s.following, followers: s.followers }))
      .catch(() => {});
    if (authUser && authUser.id !== userId) {
      recordProfileView(authUser.id, userId).catch(() => {});
    }
  }, [userId, authUser]);

  const handleSpark = async () => {
    if (!authUser || !profile) return;
    setActionLoading('spark');
    try {
      await createSpark(authUser.id, profile.id, 75);
      setSparked(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!authUser || !profile) return;
    setActionLoading('message');
    try {
      const conv = await getOrCreateConversation(authUser.id, profile.id);
      router.push(`/app/chat/${conv.id}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async () => {
    if (!authUser || !profile) return;
    if (!confirm(`Block ${profile.display_name}?`)) return;
    await blockUser(authUser.id, profile.id);
    router.back();
  };

  const handleReport = async () => {
    if (!authUser || !profile || !reportReason) return;
    await reportUser(authUser.id, profile.id, reportReason);
    setShowReportModal(false);
    setReportReason('');
  };

  if (loading) {
    return (
      <div className="animate-fade-in pb-6">
        <div className="px-4 pt-3">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-text-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
        </div>
        <div className="mx-4 mt-3 h-[420px] rounded-3xl glass animate-pulse" />
        <div className="flex gap-3 px-4 mt-4">
          <div className="flex-1 h-12 rounded-2xl glass animate-pulse" />
          <div className="flex-1 h-12 rounded-2xl glass animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="text-4xl">😕</div>
        <p className="text-text-secondary text-sm">Profile not found</p>
        <button onClick={() => router.back()} className="text-accent text-sm">Go back</button>
      </div>
    );
  }

  const vipInfo = getVipInfo(profile.vip_level);
  const mainPhoto = profile.photos?.[0];
  const albumPhotos = profile.photos?.slice(1) ?? [];
  const lastSeen = getLastSeenLabel(profile);
  const isOwnProfile = authUser?.id === profile.id;

  return (
    <div className="animate-fade-in pb-6 font-[Outfit]">
      {/* Back */}
      <div className="px-4 pt-3">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      </div>

      {/* Hero Photo */}
      <div
        className="relative mx-4 mt-3 rounded-3xl overflow-hidden h-[420px] bg-gradient-to-br from-dark-600 to-dark-800 cursor-pointer"
        onClick={() => mainPhoto && setSelectedPhoto(mainPhoto)}
      >
        {mainPhoto ? (
          <img src={mainPhoto} alt={profile.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-9xl">
            {profile.gender === 'Female' ? '👩🏾' : '👨🏾'}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {profile.is_verified && (
            <div className="px-3 py-1.5 rounded-full bg-blue/20 backdrop-blur-sm text-blue text-xs font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          )}
          {vipInfo.badge && (
            <div className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-xs font-medium text-white">
              {vipInfo.badge} {vipInfo.name}
            </div>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">{profile.display_name}, {profile.age}</h1>
            {profile.is_online && <span className="w-3 h-3 rounded-full bg-vibe border-2 border-dark-900 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary flex-wrap">
            {(profile.city || profile.country) && (
              <span>📍 {[profile.city, profile.country].filter(Boolean).join(', ')}</span>
            )}
            {profile.vibe_rating_count > 0 && <span>⭐ {profile.vibe_rating} ({profile.vibe_rating_count})</span>}
            {lastSeen && <span className={profile.is_online ? 'text-vibe font-medium' : ''}>{lastSeen}</span>}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-text-tertiary">
            <span><strong className="text-white">{socialStats.friends}</strong> friends</span>
            <span><strong className="text-white">{socialStats.followers}</strong> followers</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isOwnProfile && (
        <div className="flex gap-3 px-4 mt-4">
          <button
            onClick={handleSpark}
            disabled={!!actionLoading || sparked}
            className="flex-1 py-3 rounded-2xl gradient-accent text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60"
          >
            {actionLoading === 'spark' ? '…' : sparked ? '⚡ Sparked!' : '⚡ Request Spark'}
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!!actionLoading}
            className="flex-1 py-3 rounded-2xl glass text-text-primary font-semibold text-sm hover:bg-dark-500 transition-all disabled:opacity-60"
          >
            {actionLoading === 'message' ? '…' : '💬 Message'}
          </button>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className="px-4 mt-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">About</h3>
          <div className="p-4 rounded-2xl glass">
            <p className="text-sm text-text-primary leading-relaxed">{profile.bio}</p>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Details</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '👤', label: 'Looking for', value: profile.looking_for },
            { icon: '📍', label: 'Location', value: [profile.city, profile.country].filter(Boolean).join(', ') },
            { icon: '🌐', label: 'Languages', value: (profile.languages ?? []).join(', ') },
            { icon: '💼', label: 'Occupation', value: profile.occupation },
            { icon: '🌍', label: 'Home World', value: profile.home_world },
            { icon: '🛡️', label: 'Trust Score', value: profile.trust_score ? `${profile.trust_score}%` : null },
          ].filter((item) => item.value).map((item) => (
            <div key={item.label} className="p-3 rounded-xl glass">
              <div className="text-xs text-text-tertiary">{item.icon} {item.label}</div>
              <div className="text-sm text-text-primary mt-0.5 truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Album */}
      {albumPhotos.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text-secondary">Photo Album</h3>
            <span className="text-xs text-text-tertiary">{albumPhotos.length} photos</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {albumPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img src={photo} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {profile.interests?.length > 0 && (
        <div className="px-4 mt-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => {
              const tag = INTEREST_TAGS.find((t) => t.tag === interest);
              return (
                <span key={interest} className="px-3 py-1.5 rounded-full bg-dark-600 text-text-secondary text-sm">
                  {tag?.emoji} {interest}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Block / Report */}
      {!isOwnProfile && (
        <div className="flex gap-3 px-4 mt-8">
          <button onClick={handleBlock} className="flex-1 py-2.5 rounded-xl bg-dark-600 text-text-tertiary text-xs hover:text-text-secondary transition-colors">
            🚫 Block
          </button>
          <button onClick={() => setShowReportModal(true)} className="flex-1 py-2.5 rounded-xl bg-dark-600 text-text-tertiary text-xs hover:text-red transition-colors">
            ⚠️ Report
          </button>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white" onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div className="w-full max-w-lg cursor-default" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Photo" className="w-full rounded-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4" onClick={() => setShowReportModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl glass-strong p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-4">⚠️ Report {profile.display_name}</h3>
            <div className="space-y-2 mb-4">
              {['Fake profile', 'Inappropriate content', 'Harassment', 'Spam', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all ${
                    reportReason === reason ? 'bg-red/15 border border-red/30 text-red' : 'glass text-text-secondary'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-2xl glass text-text-secondary text-sm font-semibold">Cancel</button>
              <button onClick={handleReport} disabled={!reportReason} className="flex-1 py-3 rounded-2xl bg-red/80 text-white text-sm font-bold disabled:opacity-50">
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
