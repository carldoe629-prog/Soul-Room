'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INTEREST_TAGS } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase';
import { useMediaPicker } from '@/hooks/useMediaPicker';
import { uploadPhoto } from '@/lib/auth';

// ===== ONBOARDING STATE =====
interface OnboardingData {
  displayName: string;
  dob: string;
  gender: string;
  lookingFor: string;
  photos: (string | null)[];       // local URLs
  photoFiles: (File | null)[];     // actual file objects
  bio: string;
  city: string;
  country: string;
  languages: string;
  occupation: string;
  interests: string[];
  homeWorld: string;
}

const INITIAL_DATA: OnboardingData = {
  displayName: '',
  dob: '',
  gender: '',
  lookingFor: 'Friends',
  photos: [null, null, null, null, null, null],
  photoFiles: [null, null, null, null, null, null],
  bio: '',
  city: '',
  country: '',
  languages: '',
  occupation: '',
  interests: [],
  homeWorld: '',
};

const STEPS = [
  { id: 1, title: 'Welcome', subtitle: "Let's get to know you" },
  { id: 2, title: 'Basics', subtitle: 'Your identity' },
  { id: 3, title: 'Photos', subtitle: 'Show your best self' },
  { id: 4, title: 'About You', subtitle: 'Tell us more' },
  { id: 5, title: 'Interests', subtitle: 'What moves you?' },
  { id: 6, title: 'Ready!', subtitle: 'Welcome to Soul Room' },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 px-6 pt-4">
      {STEPS.map((s) => (
        <div
          key={s.id}
          className={`flex-1 h-1 rounded-full transition-all duration-500 ${
            s.id <= step ? 'gradient-accent' : 'bg-dark-500'
          }`}
        />
      ))}
    </div>
  );
}

// ===== STEP 1: WELCOME (SIGNUP) =====
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else onNext();
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] py-8 px-6 overflow-hidden animate-fade-in font-[Outfit] bg-[#0A0A0C]">
      <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-[#FF4B6E] opacity-[0.15] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#FF8D5C] opacity-[0.1] blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center mb-6 w-full max-w-[320px] pt-8">
        <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-tr from-[#FF4B6E] to-[#FF8D5C] flex items-center justify-center shadow-[0_4px_20px_rgba(255,75,110,0.4)] mb-4">
          <span className="text-3xl font-black text-white">SR</span>
        </div>
        <p className="text-[13px] text-text-secondary">Please enter your details to sign up</p>
      </div>

      <div className="relative z-10 w-full max-w-[320px] flex gap-3 mb-5">
        <button onClick={handleGoogleAuth} type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-600 border border-dark-400 text-white font-medium hover:bg-dark-500 transition-colors text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
        <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-600 border border-dark-400 text-white font-medium hover:bg-dark-500 transition-colors text-xs">
          Facebook
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[320px] flex justify-center items-center mb-5">
        <div className="flex-1 h-px bg-dark-400/50" />
        <span className="mx-4 text-[11px] text-text-tertiary font-medium">or</span>
        <div className="flex-1 h-px bg-dark-400/50" />
      </div>

      <form onSubmit={handleSignUp} className="relative z-10 w-full max-w-[320px] flex flex-col">
        <div className="space-y-3.5 mb-6">
          <div>
            <label className="text-xs text-text-secondary font-medium ml-1 block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
              className="w-full px-4 py-3 rounded-2xl bg-dark-800 border border-dark-400 text-white placeholder-dark-400 text-xs font-medium outline-none focus:border-accent shadow-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium ml-1 block mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
              className="w-full px-4 py-3 rounded-2xl bg-dark-800 border border-dark-400 text-white placeholder-dark-400 text-xs font-medium outline-none focus:border-accent shadow-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium ml-1 block mb-1">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (error === 'Passwords do not match') setError(null); }}
              placeholder="••••••••" required minLength={6}
              className="w-full px-4 py-3 rounded-2xl bg-dark-800 border border-dark-400 text-white placeholder-dark-400 text-xs font-medium outline-none focus:border-accent shadow-sm" />
            {error && (
              <div className="flex items-center gap-1.5 mt-2 px-1 text-[#FF4B6E] text-[11px] font-medium">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-full bg-[#FF8D5C] text-white font-bold text-sm shadow-[0_4px_14px_rgba(255,141,92,0.4)] hover:opacity-90 disabled:opacity-50 mt-1">
          {loading ? 'CREATING ACCOUNT...' : 'Sign up'}
        </button>
        <div className="text-[12px] text-text-secondary text-center mt-6">
          Already have an account? <Link href="/login" className="text-[#FF8D5C] hover:underline ml-1">Sign in</Link>
        </div>
      </form>
    </div>
  );
}

// ===== STEP 2: BASICS =====
function BasicsStep({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="px-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-text-primary mt-6 font-[Outfit]">The Basics</h2>
      <p className="text-sm text-text-secondary mt-1 mb-6">This helps us find you the right connections</p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Display Name</label>
          <input type="text" value={data.displayName} onChange={e => onChange({ displayName: e.target.value })}
            placeholder="What should people call you?"
            className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Date of Birth</label>
          <input type="date" value={data.dob} onChange={e => onChange({ dob: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {['Male', 'Female', 'Non-binary'].map(g => (
              <button key={g} type="button" onClick={() => onChange({ gender: g })}
                className={`p-3 rounded-2xl text-sm transition-all ${data.gender === g ? 'bg-accent/15 text-accent ring-2 ring-accent/30 font-bold' : 'bg-dark-600 text-text-secondary hover:bg-accent/10'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">I&apos;m looking for</label>
          <div className="grid grid-cols-3 gap-2">
            {['Friends', 'Dating', 'Both'].map(l => (
              <button key={l} type="button" onClick={() => onChange({ lookingFor: l })}
                className={`p-3 rounded-2xl text-sm transition-all ${data.lookingFor === l ? 'bg-accent/15 text-accent ring-2 ring-accent/30 font-bold' : 'bg-dark-600 text-text-secondary hover:bg-accent/10'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== STEP 3: PHOTOS =====
function PhotosStep({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  const { pickImage, isPicking, pickerError, clearPickerError } = useMediaPicker();

  const handleAddPhoto = async (index: number) => {
    const media = await pickImage();
    if (media) {
      const newPhotos = [...data.photos];
      newPhotos[index] = media.localUrl;
      const newFiles = [...data.photoFiles];
      newFiles[index] = media.file instanceof File ? media.file : null;
      onChange({ photos: newPhotos, photoFiles: newFiles });
    }
  };

  return (
    <div className="px-6 animate-slide-up pb-8">
      <h2 className="text-2xl font-bold text-text-primary mt-6 font-[Outfit]">Your Best Photos</h2>
      <p className="text-sm text-text-secondary mt-1 mb-4">Add at least 1 photo. First photo is your main pic.</p>

      {pickerError && (
        <div className="flex items-center justify-between mb-4 p-3 bg-red-500/10 border border-[#FF4B6E]/30 rounded-xl">
          <span className="text-[#FF4B6E] text-xs font-medium">⚠️ {pickerError}</span>
          <button onClick={clearPickerError} className="text-[#FF4B6E] hover:bg-[#FF4B6E]/20 rounded-full p-1">✕</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {data.photos.map((photo, index) => (
          <button key={index} disabled={isPicking} onClick={() => handleAddPhoto(index)}
            className={`aspect-[3/4] rounded-2xl relative overflow-hidden group transition-all flex flex-col items-center justify-center gap-2 ${
              photo ? '' : (index === 0 ? 'bg-gradient-to-br from-accent-start/20 to-accent-end/20 border-2 border-accent/30' : 'bg-dark-600 border-2 border-dashed border-dark-400 hover:border-accent/50')
            }`}>
            {photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={`Photo ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">✏️</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <span className={`text-[10px] ${index === 0 ? 'text-accent' : 'text-text-tertiary'}`}>
                  {index === 0 ? 'Main Photo' : `Photo ${index + 1}`}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== STEP 4: ABOUT =====
function AboutStep({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  return (
    <div className="px-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-text-primary mt-6 font-[Outfit]">About You</h2>
      <p className="text-sm text-text-secondary mt-1 mb-6">Help people get to know the real you</p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Bio</label>
          <textarea value={data.bio} onChange={e => onChange({ bio: e.target.value })} placeholder="What makes you, you? ✨" rows={3} maxLength={300}
            className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
          <div className="text-[10px] text-text-tertiary text-right mt-1">{data.bio.length}/300</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-tertiary font-medium mb-1.5 block">City</label>
            <input type="text" value={data.city} onChange={e => onChange({ city: e.target.value })} placeholder="Accra"
              className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div>
            <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Country</label>
            <input type="text" value={data.country} onChange={e => onChange({ country: e.target.value })} placeholder="Ghana"
              className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Languages (comma-separated)</label>
          <input type="text" value={data.languages} onChange={e => onChange({ languages: e.target.value })} placeholder="English, French, Twi"
            className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="text-xs text-text-tertiary font-medium mb-1.5 block">Occupation</label>
          <input type="text" value={data.occupation} onChange={e => onChange({ occupation: e.target.value })} placeholder="Software Engineer"
            className="w-full px-4 py-3 rounded-2xl bg-dark-600 text-text-primary placeholder-text-tertiary text-sm outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
      </div>
    </div>
  );
}

// ===== STEP 5: INTERESTS =====
function InterestsStep({ data, onChange }: { data: OnboardingData; onChange: (d: Partial<OnboardingData>) => void }) {
  const toggleInterest = (tag: string) => {
    const current = data.interests;
    const updated = current.includes(tag) ? current.filter(t => t !== tag) : current.length < 15 ? [...current, tag] : current;
    onChange({ interests: updated });
  };

  return (
    <div className="px-6 animate-slide-up">
      <h2 className="text-2xl font-bold text-text-primary mt-6 font-[Outfit]">Your Interests</h2>
      <p className="text-sm text-text-secondary mt-1 mb-2">Pick at least 3 (max 15)</p>
      <div className="text-xs text-accent font-medium mb-4">{data.interests.length}/15 selected</div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map(interest => (
          <button key={interest.id} type="button" onClick={() => toggleInterest(interest.tag)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
              data.interests.includes(interest.tag)
                ? 'gradient-accent text-white scale-105'
                : 'bg-dark-600 text-text-secondary hover:bg-dark-500'
            }`}>
            {interest.emoji} {interest.tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== STEP 6: READY =====
function ReadyStep({ saving }: { saving: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-6 animate-bounce-soft">
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-text-primary font-[Outfit]">You&apos;re All Set!</h1>
      <p className="text-text-secondary mt-3 max-w-xs">
        {saving ? 'Saving your profile...' : 'Welcome to Soul Room. Here\'s your starter pack:'}
      </p>
      {!saving && (
        <>
          <div className="mt-8 w-full max-w-xs space-y-3">
            {[
              { emoji: '💎', label: '500 Vibe Points', desc: 'Welcome bonus!' },
              { emoji: '⚡', label: '3 Spark Rounds', desc: 'Start matching now' },
              { emoji: '🌍', label: 'World Access', desc: 'Explore communities' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-4 rounded-2xl glass animate-slide-up">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">{item.emoji}</div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-text-primary">{item.label}</div>
                  <div className="text-xs text-text-tertiary">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/app" className="mt-8 px-10 py-4 rounded-2xl gradient-accent text-white font-bold text-lg hover:scale-105 transition-all glow-accent">
            Enter Soul Room 💜
          </Link>
        </>
      )}
      {saving && (
        <div className="mt-8 animate-pulse text-accent text-lg">⏳ Please wait...</div>
      )}
    </div>
  );
}

// ===== MAIN ONBOARDING =====
export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const calculateAge = (dob: string): number => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Upload photos to Supabase Storage
      const photoUrls: string[] = [];
      for (let i = 0; i < data.photoFiles.length; i++) {
        const file = data.photoFiles[i];
        if (file) {
          try {
            const url = await uploadPhoto(user.id, file, i);
            photoUrls.push(url);
          } catch {
            // If file upload fails, try using localUrl as fallback
            if (data.photos[i]) photoUrls.push(data.photos[i]!);
          }
        } else if (data.photos[i]) {
          photoUrls.push(data.photos[i]!);
        }
      }

      // Save profile to users table
      const { error } = await supabase.from('users').update({
        display_name: data.displayName || 'Soul Room User',
        gender: data.gender || 'Other',
        age: data.dob ? calculateAge(data.dob) : 18,
        bio: data.bio,
        city: data.city,
        country: data.country,
        photos: photoUrls,
        interests: data.interests,
        languages: data.languages.split(',').map(l => l.trim()).filter(Boolean),
        looking_for: data.lookingFor,
        occupation: data.occupation,
        home_world: data.homeWorld,
        avatar_url: photoUrls[0] || null,
        profile_completeness: calculateCompleteness(),
        vibe_points: 500, // welcome bonus
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (error) console.error('Profile save error:', error);

      // Give welcome VP bonus
      await supabase.from('vp_transactions').insert({
        user_id: user.id, amount: 500, type: 'welcome_bonus', description: 'Welcome to Soul Room! 🎉',
      });
    } catch (err) {
      console.error('Onboarding save error:', err);
    }
    setSaving(false);
  };

  const calculateCompleteness = (): number => {
    let score = 0;
    if (data.displayName) score += 15;
    if (data.gender) score += 10;
    if (data.dob) score += 10;
    if (data.bio) score += 15;
    if (data.city) score += 10;
    if (data.photos.filter(Boolean).length > 0) score += 20;
    if (data.interests.length > 0) score += 10;
    if (data.lookingFor) score += 10;
    return Math.min(score, 100);
  };

  const handleContinue = async () => {
    if (step === 5) {
      // Save on completion, before showing Ready step
      setStep(6);
      await saveProfile();
    } else {
      setStep(s => Math.min(6, s + 1));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <WelcomeStep onNext={() => setStep(2)} />;
      case 2: return <BasicsStep data={data} onChange={updateData} />;
      case 3: return <PhotosStep data={data} onChange={updateData} />;
      case 4: return <AboutStep data={data} onChange={updateData} />;
      case 5: return <InterestsStep data={data} onChange={updateData} />;
      case 6: return <ReadyStep saving={saving} />;
      default: return <WelcomeStep onNext={() => setStep(2)} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 max-w-lg mx-auto flex flex-col">
      {step > 1 && step < 6 && (
        <div className="sticky top-0 z-50 glass-strong">
          <ProgressBar step={step} />
          <div className="flex items-center justify-between px-6 py-3">
            <button onClick={() => setStep(s => s - 1)} className="text-sm text-text-secondary hover:text-text-primary">
              ← Back
            </button>
            <div className="text-sm text-text-tertiary">Step {step} of 6</div>
          </div>
        </div>
      )}

      <div className="flex-1">{renderStep()}</div>

      {step > 1 && step < 6 && (
        <div className="sticky bottom-0 p-4 glass-strong">
          <button onClick={handleContinue}
            className="w-full py-4 rounded-2xl gradient-accent text-white font-bold text-base hover:opacity-90 transition-all">
            {step === 5 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
