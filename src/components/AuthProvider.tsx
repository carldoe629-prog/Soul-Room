'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContext, type UserProfile } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
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
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
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

  return (
    <AuthContext.Provider value={{
      user: authUser,
      profile,
      loading,
      isAuthenticated: !!authUser,
      hasProfile: !!profile?.display_name,
      refreshProfile,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
