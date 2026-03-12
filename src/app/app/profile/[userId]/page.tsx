'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_USERS, INTEREST_TAGS, SUBSCRIPTION_TIERS } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const user = MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
  const tier = SUBSCRIPTION_TIERS.find(t => t.id === user.subscriptionTier);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="animate-fade-in pb-6">
      {/* Back button */}
      <div className="px-4 pt-3">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      </div>

      {/* Profile Photo */}
      <div className="relative mx-4 mt-3 rounded-3xl overflow-hidden h-[420px] bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center">
        <div className="text-9xl">{user.gender === 'Female' ? '👩🏾' : '👨🏾'}</div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {user.isVerified && (
            <div className="px-3 py-1.5 rounded-full bg-blue/20 backdrop-blur-sm text-blue text-xs font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </div>
          )}
          {tier?.badge && (
            <div className="px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium" style={{ background: `${tier.color}22`, color: tier.color }}>
              {tier.badge} {tier.name}
            </div>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark-900 via-dark-900/80 to-transparent">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white font-[Outfit]">{user.displayName}, {user.age}</h1>
            {user.isOnline && <span className="w-3 h-3 rounded-full bg-vibe border-2 border-dark-900" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
            <span>📍 {user.city}, {user.country}</span>
            <span>⭐ {user.vibeRating} ({user.vibeRatingCount})</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-4 mt-4">
        <Link href="/app/spark" className="flex-1 py-3 rounded-2xl gradient-accent text-white font-semibold text-sm text-center hover:opacity-90 transition-all">
          ⚡ Request Spark
        </Link>
        <button className="flex-1 py-3 rounded-2xl glass text-text-primary font-semibold text-sm hover:bg-dark-500 transition-all">
          💬 Send Interest
        </button>
      </div>

      {/* Bio */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">About</h3>
        <div className="p-4 rounded-2xl glass">
          <p className="text-sm text-text-primary">{user.bio}</p>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Details</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '👤', label: 'Looking for', value: user.lookingFor },
            { icon: '📍', label: 'Location', value: `${user.city}, ${user.country}` },
            { icon: '🌐', label: 'Languages', value: user.languages.join(', ') },
            { icon: '💼', label: 'Occupation', value: user.occupation || '—' },
            { icon: '📏', label: 'Height', value: user.height || '—' },
            { icon: '🎓', label: 'Education', value: user.education || '—' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl glass">
              <div className="text-xs text-text-tertiary">{item.icon} {item.label}</div>
              <div className="text-sm text-text-primary mt-0.5 truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Album */}
      {user.album && user.album.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text-secondary">Photo Album</h3>
            <span className="text-xs text-text-tertiary">{user.album.length} photos</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {user.album.map((photo, index) => (
              <div 
                key={index} 
                className="aspect-square rounded-xl bg-dark-600 overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Fallback image rendering since actual images don't exist in local project */}
                <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50 bg-gradient-to-br from-dark-500 to-dark-700">
                   {user.gender === 'Female' ? '📸' : '📷'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-2">Interests</h3>
        <div className="flex flex-wrap gap-2">
          {user.interests.map(interest => {
            const tag = INTEREST_TAGS.find(t => t.tag === interest);
            return (
              <span key={interest} className="px-3 py-1.5 rounded-full bg-dark-600 text-text-secondary text-sm">
                {tag?.emoji} {interest}
              </span>
            );
          })}
        </div>
      </div>

      {/* Report/Block */}
      <div className="flex gap-3 px-4 mt-8">
        <button className="flex-1 py-2.5 rounded-xl bg-dark-600 text-text-tertiary text-xs hover:text-text-secondary transition-colors">
          🚫 Block
        </button>
        <button className="flex-1 py-2.5 rounded-xl bg-dark-600 text-text-tertiary text-xs hover:text-red transition-colors">
          ⚠️ Report
        </button>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          
          {/* Fullscreen Photo (Fallback visual) */}
          <div className="w-full max-w-lg aspect-[3/4] rounded-2xl bg-gradient-to-br from-dark-500 to-dark-700 flex items-center justify-center cursor-default" onClick={e => e.stopPropagation()}>
            <div className="text-[120px]">{user.gender === 'Female' ? '📸' : '📷'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
