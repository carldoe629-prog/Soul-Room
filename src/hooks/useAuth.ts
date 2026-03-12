'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  gender: string;
  age: number;
  bio: string;
  city: string;
  country: string;
  photos: string[];
  interests: string[];
  languages: string[];
  looking_for: string;
  occupation: string;
  home_world: string;
  subscription_tier: string;
  vibe_points: number;
  vip_level: number;
  total_xp: number;
  monthly_xp: number;
  trust_score: number;
  vibe_rating: number;
  vibe_rating_count: number;
  is_verified: boolean;
  is_online: boolean;
  last_online_at: string | null;
  profile_completeness: number;
  referral_code: string;
  avatar_url: string | null;
  created_at: string;
}

export function useAuth() {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as UserProfile);
    return data as UserProfile | null;
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user);
      if (user) fetchProfile(user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setAuthUser(user);
        if (user) {
          await fetchProfile(user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (authUser) await fetchProfile(authUser.id);
  }, [authUser, fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authUser) return;
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', authUser.id)
      .select()
      .single();
    if (!error && data) setProfile(data as UserProfile);
    return { data, error };
  }, [authUser, supabase]);

  return {
    user: authUser,
    profile,
    loading,
    isAuthenticated: !!authUser,
    hasProfile: !!profile?.display_name,
    refreshProfile,
    updateProfile,
  };
}
