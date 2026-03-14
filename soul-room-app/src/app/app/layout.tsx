'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/AuthProvider';
import { formatNumber } from '@/lib/mock-data';
import { useTheme, ThemeProvider } from '@/components/ThemeProvider';
import { setUserOnline } from '@/lib/db';

const NAV_ITEMS = [
  { href: '/app', icon: 'home', label: 'Home', badge: 0 },
  { href: '/app/spark', icon: 'spark', label: 'Spark', badge: 0 },
  { href: '/app/worlds', icon: 'worlds', label: 'Worlds', badge: 0 },
  { href: '/app/chat', icon: 'chat', label: 'Chats', badge: 3 },
  { href: '/app/profile', icon: 'profile', label: 'Me', badge: 0 },
];

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? '#FF4B6E' : 'var(--txt-tertiary)';
  switch (type) {
    case 'home':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'worlds':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'spark':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'chat':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'profile':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return null;
  }
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-dark-600/50 transition-colors text-lg"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

// Inner shell — consumes AuthContext provided by the wrapper below
function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, isAuthenticated, isDemoMode } = useAuth();
  
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
    lastScrollY.current = currentScrollY;
  };


  // Auth guard: redirect to login if not authenticated (skip in demo mode)
  useEffect(() => {
    if (!loading && !isAuthenticated && !isDemoMode) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, isDemoMode, router]);

  // Online presence (skip in demo — fake ID would error on Supabase)
  useEffect(() => {
    if (!user || isDemoMode) return;
    setUserOnline(user.id, true);
    const handleVisibility = () => setUserOnline(user.id, !document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      setUserOnline(user.id, false);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-900)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-lg font-bold text-white mb-3 mx-auto animate-pulse">SR</div>
          <p className="text-text-tertiary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const isFounder = profile?.subscription_tier === 'founder';
  const vpBalance = profile?.vibe_points ?? 0;
  const avatarUrl = profile?.photos?.[0] || profile?.avatar_url;
  const displayName = profile?.display_name || 'User';

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-dark-900 relative" style={{ background: 'var(--bg-900)' }}>
      {/* Top Bar — shrinks to 0 height when scrolling down */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showNav ? 'max-h-[72px]' : 'max-h-0'}`}>
      <header className="z-50 glass px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(244,53,221,0.4)]">SR</div>
          <span className="text-lg font-bold text-text-primary tracking-wide">Soul Room</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="relative p-2 rounded-full hover:bg-dark-600/50 transition-colors text-text-secondary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <Link href="/app/vp" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-700/60 hover:bg-dark-600 transition-colors border border-dark-500/30">
            <span className="text-sm">💎</span>
            <span className="text-sm font-semibold text-text-primary">{isFounder ? '∞' : formatNumber(vpBalance)}</span>
          </Link>
          <Link href="/app/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-soul-500 to-soul-700 flex items-center justify-center text-sm hover:scale-105 transition-all shadow-md overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">{displayName.charAt(0)}</span>
            )}
          </Link>
        </div>
      </header>
      </div>

      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-soul-900/80 to-dark-700/80 border-b border-soul-500/20 text-xs">
          <span className="text-soul-300 font-medium">👀 Demo Mode — data is not saved</span>
          <button
            onClick={() => {
              localStorage.removeItem('soulroom_demo');
              router.push('/login');
            }}
            className="px-3 py-1 rounded-full gradient-accent text-white font-bold text-[10px] hover:opacity-90 transition-opacity"
          >
            Sign Up Free →
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24" onScroll={handleScroll}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 glass border-t border-white/5 pb-safe transition-transform duration-300 ${showNav ? 'translate-y-0' : 'translate-y-[150%]'}`}>
        <div className="flex items-center justify-around py-3 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {item.icon === 'spark' && isActive ? (
                  <div className="relative">
                    <div className="absolute inset-0 gradient-accent rounded-full blur-md opacity-40" />
                    <NavIcon type={item.icon} active={isActive} />
                  </div>
                ) : (
                  <NavIcon type={item.icon} active={isActive} />
                )}
                <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-[#FF4B6E]' : 'text-text-tertiary'}`}>
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-accent text-[8px] text-white font-bold flex items-center justify-center px-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
