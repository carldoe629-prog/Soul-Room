'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContext, type UserProfile } from '@/hooks/useAuth';
import { profileFieldContainsContactInfo } from '@/lib/moderation/contact-detector';

// Stable singleton — created once outside the component
const supabase = createClient();

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user-00000000-0000-0000-0000-000000000000',
  display_name: 'Alex (Demo)',
  email: 'demo@soulroom.app',
  gender: 'Male',
  age: 24,
  bio: "Exploring Soul Room — where genuine connections live 🌟 Music lover, travel addict, always up for a good conversation.",
  city: 'Accra',
  country: 'Ghana',
  photos: [],
  interests: ['Music', 'Technology', 'Travel', 'Fitness'],
  languages: ['English', 'Twi'],
  looking_for: 'Genuine connections',
  occupation: 'Designer',
  home_world: 'Music World',
  subscription_tier: 'plus',
  vibe_points: 3500,
  vip_level: 2,
  total_xp: 6200,
  monthly_xp: 1100,
  trust_score: 87,
  vibe_rating: 4.7,
  vibe_rating_count: 34,
  is_founder: false,
  is_verified: true,
  is_online: true,
  last_online_at: new Date().toISOString(),
  login_streak: 5,
  last_login_date: new Date().toISOString().split('T')[0],
  profile_completeness: 85,
  referral_code: 'DEMO2026',
  avatar_url: null,
  created_at: '2025-01-15T10:00:00Z',
};

// Minimal fake Supabase User for demo
const DEMO_USER = {
  id: DEMO_PROFILE.id,
  email: DEMO_PROFILE.email,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: DEMO_PROFILE.created_at,
} as unknown as SupabaseUser;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const didInit = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select(`
        id, display_name, gender, age, bio, city, country, photos, interests, languages,
        looking_for, occupation, home_world, subscription_tier, vibe_points, vip_level,
        total_xp, monthly_xp, trust_score, vibe_rating, vibe_rating_count, is_verified,
        is_online, last_online_at, profile_completeness, referral_code, avatar_url,
        created_at, updated_at, ghost_mode_enabled, hide_last_seen, invisible_browsing,
        read_receipt_control, is_founder, daily_streak, last_daily_claim
      `)
      .eq('id', userId)
      .single();
    if (data) setProfile(data as UserProfile);
    return data as UserProfile | null;
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const demo = process.env.NODE_ENV === 'development'
      && typeof window !== 'undefined'
      && localStorage.getItem('soulroom_demo') === 'true';
    if (demo) {
      setIsDemoMode(true);
      setAuthUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    // getSession() reads from local storage immediately (no network round-trip)
    // — user stays logged in on refresh without waiting for a server call
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) fetchProfile(user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: any) => {
        const user = session?.user ?? null;
        setAuthUser(user);
        if (user) {
          await fetchProfile(user.id);
        } else {
          setProfile(null);
        }
        // Don't set loading = false here — getSession() above handles the
        // initial load.  onAuthStateChange fires INITIAL_SESSION before
        // getSession resolves, which can race with a null session and
        // trigger the auth guard redirect to /login.
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (isDemoMode) return; // no-op in demo
    if (authUser) await fetchProfile(authUser.id);
  }, [authUser, fetchProfile, isDemoMode]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (isDemoMode) return; // no-op in demo
    if (!authUser) return;

    // Moderation and economy fields are now protected at the database level via triggers 
    // and security-definer RPCs. Client-side checks are removed to ensure the "Hard Shell" architecture.

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', authUser.id)
      .select()
      .single();
    if (!error && data) setProfile(data as UserProfile);
    return { data, error };
  }, [authUser, isDemoMode]);

  return (
    <AuthContext.Provider value={{
      user: authUser,
      profile,
      loading,
      isAuthenticated: !!authUser,
      hasProfile: !!profile?.display_name,
      isDemoMode,
      refreshProfile,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
