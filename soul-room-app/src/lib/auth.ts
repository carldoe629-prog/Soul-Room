import { createClient } from './supabase';

const supabase = createClient();

// ===== AUTH HELPERS =====

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/app` },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ===== PROFILE HELPERS =====

export async function createUserProfile(userId: string, profile: {
  display_name: string;
  gender: string;
  age: number;
  bio?: string;
  city: string;
  country: string;
  interests: string[];
  languages: string[];
  looking_for: string;
  photos: string[];
}) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      ...profile,
      profile_completeness: calculateCompleteness(profile),
      referral_code: generateReferralCode(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadPhoto(userId: string, file: File, index: number): Promise<string> {
  // Server-side enforceable content-type validation
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error('File size must be under 5 MB');
  }

  // Use validated MIME-based extension (not user-supplied file.name)
  const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = extMap[file.type] || 'jpg';
  const path = `${userId}/photo_${index}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

function calculateCompleteness(profile: any): number {
  let score = 0;
  if (profile.display_name) score += 15;
  if (profile.gender) score += 10;
  if (profile.age) score += 10;
  if (profile.bio) score += 15;
  if (profile.city) score += 10;
  if (profile.photos?.length > 0) score += 20;
  if (profile.interests?.length > 0) score += 10;
  if (profile.looking_for) score += 10;
  return Math.min(score, 100);
}

function generateReferralCode(): string {
  return 'SR' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
