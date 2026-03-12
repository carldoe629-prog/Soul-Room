'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function WelcomePage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Reveal text after 1 second
    const timer1 = setTimeout(() => {
      setStep(1);
    }, 1000);

    // Reveal buttons after 2.5 seconds
    const timer2 = setTimeout(() => {
      setStep(2);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <main className="relative min-h-[100dvh] bg-[#141216] flex flex-col items-center overflow-hidden font-[Outfit]">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[120vw] h-[60vh] bg-gradient-to-b from-[#FF4B6E]/30 to-[#FF8D5C]/10 rounded-full mix-blend-screen filter blur-[150px] opacity-60 translate-y-[-10%]" />
      </div>

      <div className="z-10 flex flex-col w-full max-w-sm px-8 flex-1 justify-center pt-20">
        
        {/* SR Logo - Step 0: ObjectAnimator style Scale + Rotation Entry */}
        <div className="flex justify-center mb-10">
          <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#FF4B6E] to-[#FF8D5C] flex items-center justify-center shadow-[0_0_50px_rgba(255,75,110,0.5)] animate-[logo-spin_1s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards,pulse_3s_ease-in-out_infinite_1s]">
            <span className="text-[44px] font-black text-white tracking-widest ml-2">SR</span>
          </div>
        </div>

        {/* Text Block - Step 1: Transitions in */}
        <div 
          className={`flex flex-col items-center w-full relative mb-12 text-center transition-all duration-1000 ease-out ${
            step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Typographically centered 'SOUL ROOM' text */}
          <h1 className="text-[40px] font-black text-white tracking-[0.2em] leading-tight uppercase pl-[0.2em]">
            SOUL ROOM
          </h1>
          
          <p className="text-[#FF8D5C] text-[13px] font-bold tracking-[0.15em] mt-3 pl-[0.15em]">
            MEET. MATCH. CONNECT.
          </p>
        </div>

      </div>

      {/* Action Buttons Container - Step 2: Transitions in */}
      <div 
        className={`w-full px-8 pb-32 z-20 max-w-sm transition-all duration-1000 ease-out ${
          step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="flex flex-col gap-4">
          <Link
            href="/onboarding"
            className="w-full flex items-center justify-center py-4 rounded-full font-bold text-lg text-white bg-gradient-to-r from-[#FF4B6E] to-[#FF8D5C] active:scale-95 transition-transform shadow-[0_4px_20px_rgba(255,75,110,0.3)]"
          >
            Get Started
          </Link>
          
          <Link
            href="/login"
            className="w-full flex items-center justify-center py-4 font-bold text-lg text-white bg-[#2A262E] active:bg-[#1A181D] active:scale-95 rounded-full border-[1.5px] border-white/10 transition-all"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
