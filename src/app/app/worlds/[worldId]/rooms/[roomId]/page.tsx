'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_ROOMS, MOCK_USERS, GIFT_TYPES, CURRENT_USER } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';

export default function VoiceRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const worldId = params.worldId as string;
  const room = MOCK_ROOMS.find(r => r.id === roomId) || MOCK_ROOMS[0];
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { user: 'MelodyQueen', text: 'Welcome everyone! 🎉', time: '2m ago' },
    { user: 'DJ_Kwame', text: 'Drop your song requests below 🎵', time: '1m ago' },
    { user: 'NigerianPrincess', text: 'Loving the vibes in here! 💜', time: '30s ago' },
  ]);
  const [newChat, setNewChat] = useState('');

  const speakers = MOCK_USERS.slice(0, room.speakerCount);
  const listeners = MOCK_USERS.slice(room.speakerCount);

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* Room Header */}
      <div className="px-4 py-3 glass-strong">
        <div className="flex items-center justify-between">
          <button 
             onClick={() => router.back()}
             className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
            <span className="text-xs text-text-tertiary">LIVE • {room.startedMinutesAgo}m</span>
          </div>
        </div>
        <h1 className="text-lg font-bold text-text-primary mt-2">{room.title}</h1>
        <div className="text-xs text-text-tertiary mt-0.5">Hosted by {room.hostName}</div>
      </div>

      {/* Speakers Stage */}
      <div className="px-4 py-6">
        <div className="text-xs text-text-tertiary font-medium mb-3">🎙 Speakers</div>
        <div className="grid grid-cols-4 gap-4">
          {speakers.map((speaker, i) => (
            <div key={speaker.id} className="flex flex-col items-center gap-1.5">
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                i === 0 ? 'ring-2 ring-accent ring-offset-2 ring-offset-dark-900' : 'bg-gradient-to-br from-dark-600 to-dark-800'
              }`}>
                {speaker.gender === 'Female' ? '👩🏾' : '👨🏾'}
                {/* Speaking indicator */}
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 ${i % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}>
                  {[1, 2, 3].map(b => (
                    <div key={b} className="w-0.5 bg-vibe rounded-full animate-pulse" style={{ height: `${Math.random() * 8 + 4}px`, animationDelay: `${b * 100}ms` }} />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-text-secondary truncate w-16 text-center">{speaker.displayName}</span>
              {i === 0 && <span className="text-[9px] text-accent">Host</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Listeners */}
      <div className="px-4 pb-4">
        <div className="text-xs text-text-tertiary font-medium mb-3">👂 Listeners ({room.listenerCount})</div>
        <div className="flex flex-wrap gap-3">
          {listeners.map(listener => (
            <div key={listener.id} className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-lg">
                {listener.gender === 'Female' ? '👩🏾' : '👨🏾'}
              </div>
              <span className="text-[9px] text-text-tertiary truncate w-12 text-center">{listener.displayName}</span>
            </div>
          ))}
          {[...Array(Math.max(0, room.listenerCount - listeners.length))].map((_, i) => (
            <div key={`extra-${i}`} className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-xs text-text-tertiary">
              +
            </div>
          ))}
        </div>
      </div>

      {/* Room Chat */}
      <div className="flex-1 px-4 border-t border-dark-600/30 pt-3 overflow-y-auto">
        <div className="text-xs text-text-tertiary font-medium mb-2">💬 Room Chat</div>
        <div className="space-y-2">
          {chatMessages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="text-accent font-medium">{msg.user}: </span>
              <span className="text-text-secondary">{msg.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gift Panel */}
      {showGifts && (
        <div className="absolute bottom-20 left-0 right-0 mx-4 p-4 rounded-3xl glass-strong border border-dark-500 shadow-2xl animate-slide-up z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-primary">Send a Tip to Speakers</h3>
            <button onClick={() => setShowGifts(false)} className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-text-secondary hover:text-text-primary">✕</button>
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto no-scrollbar">
            {GIFT_TYPES.slice(0, 8).map(gift => (
              <button 
                key={gift.id} 
                onClick={() => {
                  alert(`Sent ${gift.name} ${gift.emoji} to the stage for ${gift.vpCost} VP!`);
                  setShowGifts(false);
                }}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl bg-dark-600/50 hover:bg-dark-500 hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-accent/50"
              >
                <div className="text-3xl">{gift.emoji}</div>
                <div className="text-[9px] font-bold text-text-secondary mt-1 max-w-full truncate">{gift.name}</div>
                <div className="flex items-center gap-0.5 text-[9px] text-accent font-semibold">
                  💎 {gift.vpCost}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-dark-600/50 flex items-center justify-between">
            <span className="text-xs text-text-tertiary">Balance</span>
            <span className="text-sm font-bold text-text-primary flex items-center gap-1">💎 {CURRENT_USER.vibePoints.toLocaleString()} VP</span>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="px-4 py-3 glass-strong border-t border-dark-600/30">
        <div className="flex items-center gap-2">
          {/* Chat input */}
          <input
            value={newChat}
            onChange={(e) => setNewChat(e.target.value)}
            placeholder="Say something..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-dark-600 text-sm text-text-primary placeholder-text-tertiary outline-none"
          />

          {/* Raise hand */}
          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`p-2.5 rounded-full transition-all ${isHandRaised ? 'bg-amber/20 text-amber' : 'bg-dark-600 text-text-tertiary hover:bg-dark-500'}`}
          >
            ✋
          </button>

          {/* Gift */}
          <button
            onClick={() => setShowGifts(!showGifts)}
            className="p-2.5 rounded-full bg-dark-600 text-text-tertiary hover:bg-dark-500 transition-all"
          >
            🎁
          </button>

          {/* Leave */}
          <button className="px-4 py-2.5 rounded-2xl bg-red/20 text-red text-sm font-medium hover:bg-red/30 transition-all">
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
