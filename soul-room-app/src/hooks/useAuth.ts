'use client';

import { useContext, createContext } from 'react';
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
  is_founder: boolean;
  is_verified: boolean;
  is_online: boolean;
  last_online_at: string | null;
  login_streak: number;
  last_login_date: string | null;
  profile_completeness: number;
  referral_code: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthContextValue {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasProfile: boolean;
  isDemoMode: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: any; error: any } | undefined>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  hasProfile: false,
  isDemoMode: false,
  refreshProfile: async () => {},
  updateProfile: async () => undefined,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
