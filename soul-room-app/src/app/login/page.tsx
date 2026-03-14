'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first'); return; }
    setResetLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/app');
    }
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0A0A0C] flex flex-col items-center justify-center pt-8 pb-4 px-8 font-[Outfit]">
      {/* Soft, atmospheric "love" bubbles like the screenshot */}
      <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-[#FF4B6E] opacity-[0.15] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#FF8D5C] opacity-[0.1] blur-[100px] pointer-events-none" />

      {/* SR Logo Box */}
      <Link href="/" className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF4B6E] to-[#FF8D5C] flex xl:items-center items-center justify-center shadow-[0_0_30px_rgba(255,75,110,0.3)] mb-6 hover:scale-105 transition-transform">
        <span className="text-3xl font-black text-white">SR</span>
      </Link>

      <form onSubmit={handleLogin} className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {error && (
          <div className="w-full p-3 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-200 text-center">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="w-full space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username or Email"
            required
            className="w-full px-5 py-3 rounded-full bg-white text-dark-900 placeholder-dark-400 text-sm font-semibold outline-none focus:ring-4 focus:ring-vibe/30 shadow-md"
          />
          <div className="relative w-full">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-5 py-3 rounded-full bg-white text-dark-900 placeholder-dark-400 text-sm font-semibold outline-none focus:ring-4 focus:ring-vibe/30 shadow-md pr-12"
            />
            {/* Eye Icon */}
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="w-full flex justify-between items-center px-2 mb-6 text-xs text-text-secondary font-medium">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-[#FF4B6E] border-[#FF4B6E]' : 'border-dark-400 hover:border-[#FF4B6E]'}`}>
              {rememberMe && <svg width="8" height="8" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            </div>
            <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
            Remember me
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetLoading}
            className="hover:text-white transition-colors disabled:opacity-50"
          >
            {resetSent ? '✅ Check your email' : resetLoading ? 'Sending…' : 'Forgot password?'}
          </button>
        </div>

        {/* LOGIN Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full max-w-[200px] py-3 rounded-full bg-gradient-to-r from-[#FF4B6E] to-[#FF8D5C] text-white font-bold text-center tracking-wider shadow-[0_4px_14px_rgba(255,75,110,0.4)] hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>

        {/* OR Divider */}
        <div className="w-full flex justify-center items-center mt-6 mb-4">
          <div className="h-px w-16 bg-dark-400/50" />
          <span className="mx-4 text-xs text-text-tertiary font-medium">or</span>
          <div className="h-px w-16 bg-dark-400/50" />
        </div>

        {/* Social Media Login */}
        <div className="w-full flex justify-center mb-6">
          <button
            onClick={handleGoogleAuth}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-white text-dark-900 font-bold hover:bg-gray-100 transition-colors shadow-[0_4px_10px_rgba(255,255,255,0.1)] text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-text-secondary">
          Not a member? <Link href="/onboarding" className="text-white hover:underline ml-1">Create Account</Link>
        </div>
      </form>
    </div>
  );
}
