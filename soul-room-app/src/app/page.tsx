'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const heroTexts = [
    "Connection shouldn't cost by the minute.",
    "Where souls find their room.",
    "See them. Hear them. Know them."
  ];

  const [exploring, setExploring] = useState(false);

  useEffect(() => {
    // If running in Capacitor (Android/iOS), immediately jump to the welcome/splash screen
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      router.replace('/welcome');
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % heroTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [router, heroTexts.length]);

  return (
    <main className="relative bg-dark-900 text-text-primary min-h-screen overflow-hidden font-sans">
      {/* Background Particles (Extracted from app-debug3.apk) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute rounded-full opacity-10 w-[5px] h-[5px] left-[13%] top-[7%] bg-[#FF4B6E] animate-[float_9s_ease-in-out_infinite_3s]"></div>
        <div className="absolute rounded-full opacity-10 w-[6px] h-[6px] left-[50%] top-[60%] bg-[#8B5CF6] animate-[float_8s_ease-in-out_infinite_0s]"></div>
        <div className="absolute rounded-full opacity-10 w-[7px] h-[7px] left-[87%] top-[13%] bg-[#FF8D5C] animate-[float_7s_ease-in-out_infinite_1s]"></div>
        <div className="absolute rounded-full opacity-10 w-[2px] h-[2px] left-[24%] top-[66%] bg-[#FF4B6E] animate-[float_6s_ease-in-out_infinite_2s]"></div>
        <div className="absolute rounded-full opacity-10 w-[3px] h-[3px] left-[61%] top-[19%] bg-[#8B5CF6] animate-[float_5s_ease-in-out_infinite_3s]"></div>
        <div className="absolute rounded-full opacity-10 w-[4px] h-[4px] left-[98%] top-[72%] bg-[#FF8D5C] animate-[float_4s_ease-in-out_infinite_0s]"></div>
        <div className="absolute rounded-full opacity-10 w-[5px] h-[5px] left-[35%] top-[25%] bg-[#FF4B6E] animate-[float_9s_ease-in-out_infinite_1s]"></div>
        <div className="absolute rounded-full opacity-10 w-[6px] h-[6px] left-[72%] top-[78%] bg-[#8B5CF6] animate-[float_8s_ease-in-out_infinite_2s]"></div>
        <div className="absolute rounded-full opacity-10 w-[7px] h-[7px] left-[9%] top-[31%] bg-[#FF8D5C] animate-[float_7s_ease-in-out_infinite_3s]"></div>
        <div className="absolute rounded-full opacity-10 w-[2px] h-[2px] left-[46%] top-[84%] bg-[#FF4B6E] animate-[float_6s_ease-in-out_infinite_0s]"></div>
        <div className="absolute rounded-full opacity-10 w-[3px] h-[3px] left-[83%] top-[37%] bg-[#8B5CF6] animate-[float_5s_ease-in-out_infinite_1s]"></div>
        <div className="absolute rounded-full opacity-10 w-[4px] h-[4px] left-[20%] top-[90%] bg-[#FF8D5C] animate-[float_4s_ease-in-out_infinite_2s]"></div>
        <div className="absolute rounded-full opacity-10 w-[5px] h-[5px] left-[57%] top-[43%] bg-[#FF4B6E] animate-[float_9s_ease-in-out_infinite_3s]"></div>
        <div className="absolute rounded-full opacity-10 w-[6px] h-[6px] left-[94%] top-[96%] bg-[#8B5CF6] animate-[float_8s_ease-in-out_infinite_0s]"></div>
        <div className="absolute rounded-full opacity-10 w-[7px] h-[7px] left-[31%] top-[49%] bg-[#FF8D5C] animate-[float_7s_ease-in-out_infinite_1s]"></div>
        <div className="absolute rounded-full opacity-10 w-[2px] h-[2px] left-[68%] top-[2%] bg-[#FF4B6E] animate-[float_6s_ease-in-out_infinite_2s]"></div>
        <div className="absolute rounded-full opacity-10 w-[3px] h-[3px] left-[5%] top-[55%] bg-[#8B5CF6] animate-[float_5s_ease-in-out_infinite_3s]"></div>
        <div className="absolute rounded-full opacity-10 w-[4px] h-[4px] left-[42%] top-[8%] bg-[#FF8D5C] animate-[float_4s_ease-in-out_infinite_0s]"></div>
        <div className="absolute rounded-full opacity-10 w-[5px] h-[5px] left-[79%] top-[61%] bg-[#FF4B6E] animate-[float_9s_ease-in-out_infinite_1s]"></div>
        <div className="absolute rounded-full opacity-10 w-[6px] h-[6px] left-[16%] top-[14%] bg-[#8B5CF6] animate-[float_8s_ease-in-out_infinite_2s]"></div>
      </div>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-soul-900/30 to-dark-900"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-start/5 blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-soul-500/5 blur-[100px]"></div>
        
        <header className="absolute top-0 left-0 w-full p-6 md:px-10 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl gradient-accent flex items-center justify-center text-lg md:text-xl font-bold text-white shadow-lg glow-accent">
              SR
            </div>
            <span className="text-xl md:text-2xl font-bold text-text-primary font-[Outfit] tracking-tight">
              Soul Room
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors" href="/login">
              Log In
            </Link>
          </div>
        </header>

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in pt-16">
          <div className="min-h-[120px] md:min-h-[160px] lg:min-h-[180px] flex items-center justify-center mb-6">
            <h1 key={currentTextIndex} className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-gradient-accent animate-fade-in font-[Outfit] leading-tight opacity-100 transition-opacity duration-1000">
              {heroTexts[currentTextIndex]}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            The world&apos;s safest platform for meaningful connection. Where visual attraction meets genuine conversation, and privacy is a fundamental right — not a premium feature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link className="group relative px-8 py-4 rounded-2xl gradient-accent text-white font-semibold text-lg transition-all duration-300 hover:scale-105 glow-accent hover:shadow-xl" href="/onboarding">
              <span className="relative z-10">Get Started Free</span>
            </Link>
            <button
              onClick={() => {
                setExploring(true);
                localStorage.setItem('soulroom_demo', 'true');
                router.push('/app');
              }}
              disabled={exploring}
              className="px-8 py-4 rounded-2xl glass text-text-primary font-semibold text-lg transition-all duration-300 hover:bg-dark-500/80 hover:scale-105 disabled:opacity-70 flex items-center justify-center min-w-[180px]"
            >
              {exploring ? (
                <div className="loading-spinner" />
              ) : (
                'Explore Demo →'
              )}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient-accent">100K+</div>
              <div className="text-sm text-text-tertiary mt-1">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient-accent">500K+</div>
              <div className="text-sm text-text-tertiary mt-1">Spark Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient-accent">1.2K</div>
              <div className="text-sm text-text-tertiary mt-1">Voice Rooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient-accent">45+</div>
              <div className="text-sm text-text-tertiary mt-1">Countries</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-[Outfit]">
              Built Different. <span className="text-gradient-accent">Built Right.</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Every feature designed around genuine connection, radical privacy, and the belief that communication is a right — not a privilege.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="group p-6 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4B6E] to-[#FF8D5C] flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-xl font-bold mb-2">Spark Matching</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                AI-powered matches based on shared interests. See photos, then connect through a 5-minute voice call. Both vote — only mutual Sparks unlock chat.
              </p>
            </div>
            <div className="group p-6 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#C4B5FD] flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">🌍</div>
              <h3 className="text-xl font-bold mb-2">Worlds &amp; Voice Rooms</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                10+ themed communities — Music, Travel, Tech, Faith, and more. Join live voice rooms, meet people who share your passions.
              </p>
            </div>
            <div className="group p-6 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00E5A0] to-[#4BFFCA] flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-xl font-bold mb-2">Vault Messages</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Share private photos with view-once, timed viewing, screenshot blocking, and revocable access. Your content, your control — always.
              </p>
            </div>
            <div className="group p-6 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4B9FFF] to-[#8BC4FF] flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">🎤</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Free Voice &amp; Video Calls</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Talk to your connections without paying per minute. Powered by WebRTC peer-to-peer — crystal clear, zero server cost.</p>
            </div>
            <div className="group p-6 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFB84B] to-[#FFD280] flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">🛡️</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Privacy First</h3>
              <p className="text-text-secondary text-sm leading-relaxed">No phone number sharing. Invisible watermarking. True blocking. Contact detection prevents off-platform migration.</p>
            </div>
            <div className="group p-6 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4B6E] to-[#8B5CF6] flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">💜</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Trust &amp; Reputation</h3>
              <p className="text-text-secondary text-sm leading-relaxed">Verified profiles, Vibe Ratings, and Trust Scores. Know who you&apos;re talking to before you share your world.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-dark-400 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-[Outfit]">Find Your <span className="text-gradient-soul">World</span></h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">10+ themed communities. Live voice rooms. Real conversations. Find people who share your passions.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'music', emoji: '🎵', name: 'Music World', members: '23.5K', live: 12 },
              { id: 'books', emoji: '📚', name: 'Books & Learning', members: '15.2K', live: 5 },
              { id: 'gaming', emoji: '🎮', name: 'Gaming World', members: '18.9K', live: 8 },
              { id: 'travel', emoji: '✈️', name: 'Travel World', members: '12.6K', live: 4 },
              { id: 'faith', emoji: '🙏', name: 'Faith & Spirituality', members: '9.9K', live: 6 },
              { id: 'tech', emoji: '💻', name: 'Tech & Innovation', members: '21.3K', live: 9 },
              { id: 'fitness', emoji: '💪', name: 'Fitness & Wellness', members: '11.2K', live: 3 },
              { id: 'entertainment', emoji: '🎬', name: 'Entertainment', members: '16.8K', live: 7 },
              { id: 'business', emoji: '💰', name: 'Business & Money', members: '14.6K', live: 5 },
              { id: 'lifestyle', emoji: '💄', name: 'Lifestyle & Fashion', members: '13.5K', live: 4 }
            ].map((world) => (
              <Link key={world.id} className="group p-5 rounded-3xl glass hover:bg-dark-600/50 transition-all duration-500 hover:scale-105 text-center" href="/app/worlds">
                <div className="text-4xl mb-3">{world.emoji}</div>
                <h3 className="text-sm font-semibold text-text-primary mb-1 truncate">{world.name}</h3>
                <div className="text-xs text-text-tertiary">{world.members} members</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="w-2 h-2 rounded-full bg-vibe animate-pulse"></span>
                  <span className="text-xs text-vibe">{world.live} live</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-[Outfit]">Real People. <span className="text-gradient-accent">Real Connection.</span></h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Verified profiles, voice-first matching, and AI-powered compatibility scoring.</p>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar px-4 snap-x snap-mandatory">
            {[
              { id: 'james', emoji: '👨🏾', name: 'James', age: 28, loc: 'Nairobi', rating: 4.8, bio: 'Coffee addict and code poet 💻☕. Seeking someone who can match my energy and debate philosophy at 2 AM.', tags: ['Technology', 'Business', 'Fitness'] },
              { id: 'grace', emoji: '👩🏾', name: 'Grace', age: 22, loc: 'Lagos', rating: 4.6, bio: 'Life is too short to be boring 💃 Laughing is my cardio. Feed me jollof rice and I\'m yours forever 🍚', tags: ['Afrobeats', 'Travel', 'Cooking'] },
              { id: 'emmanuel', emoji: '👨🏾', name: 'Emmanuel', age: 25, loc: 'Lagos', rating: 4.8, bio: 'Musician by night, coder by day 🎵💻 Finding beats in everything', tags: ['Music', 'Technology', 'Gaming'] },
              { id: 'fatima', emoji: '👩🏾', name: 'Fatima', age: 24, loc: 'Cairo', rating: 4.3, bio: 'Books, tea, deep conversations ☕📚 Looking for someone who values substance over surface', tags: ['Books', 'Art', 'Faith'] }
            ].map(user => (
              <div key={user.id} className="flex-shrink-0 w-72 rounded-3xl overflow-hidden glass hover:scale-105 transition-all duration-500 snap-center">
                <div className="relative h-80 bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center">
                  <div className="text-7xl">{user.emoji}</div>
                  <div className="absolute top-4 right-4 bg-blue/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <svg className="w-4 h-4 text-blue" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    <span className="text-xs text-blue font-medium">Verified</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-900/90 to-transparent">
                    <div className="flex items-center gap-2"><h3 className="text-xl font-bold text-white">{user.name}, {user.age}</h3><span className="w-3 h-3 rounded-full bg-vibe border-2 border-dark-900"></span></div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-1"><span>📍 {user.loc}</span><span>•</span><span>⭐ {user.rating}</span></div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-text-secondary line-clamp-3 mb-3">{user.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-dark-500 text-text-secondary">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-[Outfit]">Choose Your <span className="text-gradient-accent">Spark</span></h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">Basic communication is always free. Upgrade for more Sparks, unlimited calls, and exclusive features.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free */}
            <div className="relative p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:scale-105 glass border border-dark-600">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3 flex justify-center">
                  <div className="text-xs font-bold bg-[#A3C8D6] text-dark-900 px-3 py-1 rounded-md tracking-wider">FREE</div>
                </div>
                <h3 className="text-2xl font-bold text-text-primary">Free</h3>
                <div className="mt-2"><span className="text-4xl font-bold text-text-secondary">Free</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  { t: "3 Say Hi / day", v: true },
                  { t: "Stranger reply: 50 VP", v: true },
                  { t: "1 Spark round/day", v: true },
                  { t: "Chat (connections): FREE", v: true },
                  { t: "5 min voice/day", v: true },
                  { t: "Video calls", v: false },
                  { t: "Speak in rooms", v: false },
                  { t: "See who liked you", v: false },
                  { t: "Translation", v: false },
                  { t: "Invisible mode", v: false },
                  { t: "Join 3 Worlds", v: true },
                  { t: "Contains ads", v: true }
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.v ? (
                      <svg className="w-5 h-5 text-vibe flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    ) : (
                      <svg className="w-5 h-5 text-dark-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    )}
                    <span className={feature.v ? "text-text-secondary font-medium" : "text-dark-500 font-medium"}>{feature.t}</span>
                  </li>
                ))}
              </ul>
              <Link className="block w-full text-center py-4 rounded-2xl font-bold text-lg transition-all duration-300 bg-dark-600 text-text-secondary hover:bg-dark-500 shadow-lg" href="/onboarding">Start Free</Link>
            </div>

            {/* Spark Plus */}
            <div className="relative p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:scale-105 glass border border-dark-600">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">⭐</div>
                <h3 className="text-2xl font-bold text-text-primary">Spark Plus</h3>
                <div className="mt-2"><span className="text-4xl font-bold text-[#FFB84B]">$7.99</span><span className="text-text-tertiary text-lg">/month</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  { t: "15 Say Hi / day", v: true },
                  { t: "Stranger reply: 20 VP", v: true },
                  { t: "5 Spark rounds/day", v: true },
                  { t: "Chat (connections): FREE", v: true },
                  { t: "60 min voice / 15 min video", v: true },
                  { t: "Speak in rooms", v: true },
                  { t: "See who liked you", v: true },
                  { t: "Read receipts", v: true },
                  { t: "Advanced search filters", v: true },
                  { t: "Join ALL Worlds", v: true },
                  { t: "No ads + 3,000 VP/mo", v: true },
                  { t: "Invisible mode", v: false }
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.v ? (
                      <svg className="w-5 h-5 text-vibe flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    ) : (
                      <svg className="w-5 h-5 text-dark-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    )}
                    <span className={feature.v ? "text-text-secondary font-medium" : "text-dark-500 font-medium"}>{feature.t}</span>
                  </li>
                ))}
              </ul>
              <Link className="block w-full text-center py-4 rounded-2xl font-bold text-lg transition-all duration-300 bg-dark-600 text-text-primary hover:bg-dark-500 shadow-lg" href="/onboarding">Get Started</Link>
            </div>

            {/* Spark Premium */}
            <div className="relative p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:scale-105 glass border-2 border-[#8B5CF6]/30 glow-soul">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#8B5CF6] text-xs font-bold text-white tracking-wider">MOST POPULAR</div>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">💎</div>
                <h3 className="text-2xl font-bold text-text-primary">Spark Premium</h3>
                <div className="mt-2"><span className="text-4xl font-bold text-[#8B5CF6]">$19.99</span><span className="text-text-tertiary text-lg">/month</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  { t: "50 Say Hi / day", v: true },
                  { t: "Stranger messaging: FREE", v: true },
                  { t: "Unlimited Sparks", v: true },
                  { t: "Chat (connections): FREE", v: true },
                  { t: "Unlimited voice / 60 min video", v: true },
                  { t: "Real-time translation", v: true },
                  { t: "Private rooms + Host events", v: true },
                  { t: "Invisible mode", v: true },
                  { t: "Undo accidental Pass", v: true },
                  { t: "1 free Boost/week", v: true },
                  { t: "Join ALL Worlds", v: true },
                  { t: "No ads + 7,000 VP/mo", v: true }
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.v ? (
                      <svg className="w-5 h-5 text-vibe flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    ) : (
                      <svg className="w-5 h-5 text-dark-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    )}
                    <span className={feature.v ? "text-text-secondary font-medium" : "text-dark-500 font-medium"}>{feature.t}</span>
                  </li>
                ))}
              </ul>
              <Link className="block w-full text-center py-4 rounded-2xl font-bold text-lg transition-all duration-300 bg-[#8B5CF6] text-white hover:opacity-90 shadow-lg mt-auto" href="/onboarding">Get Started</Link>
            </div>

            {/* Spark VIP */}
            <div className="relative p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:scale-105 glass border border-[#FF4B6E]/30 glow-accent flex flex-col">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">👑</div>
              <div className="text-center mt-4 mb-8">
                <h3 className="text-2xl font-bold text-text-primary">Spark VIP</h3>
                <div className="mt-2"><span className="text-4xl font-bold text-[#FF4B6E]">$39.99</span><span className="text-text-tertiary text-lg">/month</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {[
                  { t: "Unlimited Say Hi (FREE)", v: true },
                  { t: "DM anyone without match", v: true },
                  { t: "Unlimited everything", v: true },
                  { t: "Chat (connections): FREE", v: true },
                  { t: "Unlimited voice + video", v: true },
                  { t: "AI matchmaking concierge", v: true },
                  { t: "VIP rooms & events", v: true },
                  { t: "See profile viewers", v: true },
                  { t: "3 free Boosts/week", v: true },
                  { t: "Gold highlighted profile", v: true },
                  { t: "Join ALL Worlds", v: true },
                  { t: "No ads + 15,000 VP/mo", v: true }
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.v ? (
                      <svg className="w-5 h-5 text-vibe flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    ) : (
                      <svg className="w-5 h-5 text-dark-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    )}
                    <span className={feature.v ? "text-text-secondary font-medium" : "text-dark-500 font-medium"}>{feature.t}</span>
                  </li>
                ))}
              </ul>
              <Link className="block w-full text-center py-4 rounded-2xl font-bold text-lg transition-all duration-300 gradient-accent text-white hover:opacity-90 shadow-lg mt-auto" href="/onboarding">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto glass p-10 md:p-16 rounded-[3rem] border border-dark-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-800 to-dark-900 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent-start/5 blur-[80px]"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-[Outfit] leading-tight">Your soul <br className="hidden md:block" /> deserves a room.</h2>
            <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-sm mx-auto">
              Join 100,000+ people building genuine connections through voice, community, and trust.
            </p>
            <Link className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-[2rem] bg-gradient-to-r from-[#FF4B6E] to-[#FF8D5C] text-white font-bold text-xl hover:opacity-90 transition-opacity glow-accent shadow-lg" href="/onboarding">
              Create Your Account <span className="ml-1 text-xl">→</span>
            </Link>
          </div>
        </div>
      </section>
      <footer className="py-12 px-4 border-t border-dark-600/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-sm font-bold text-white">SR</div>
            <span className="text-lg font-bold text-text-primary font-[Outfit]">Soul Room</span>
          </div>
          <div className="flex gap-8 text-sm text-text-tertiary">
            <a href="#" className="hover:text-text-primary transition-colors">About</a>
            <a href="#" className="hover:text-text-primary transition-colors">Safety</a>
            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
          </div>
          <div className="text-sm text-text-tertiary">© 2026 Soul Room. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
