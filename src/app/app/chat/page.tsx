'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_REQUESTS,
  MOCK_ACTIVE_SPARKS,
  MOCK_ONGOING_CONVOS,
  PINNED_CONVERSATIONS,
  CURRENT_USER,
  getVipInfo,
  type SayHiRequest,
} from '@/lib/mock-data';

// ===== TAB TYPES =====
type ChatTab = 'people' | 'requests' | 'sparks';
type RequestSort = 'newest' | 'match' | 'verified';

// ===== ONLINE STATUS INDICATOR =====
function OnlineDot({ user }: { user: { isOnline: boolean; lastOnlineMinutes?: number } }) {
  if (user.isOnline && (!user.lastOnlineMinutes || user.lastOnlineMinutes === 0)) {
    return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-vibe border-2 border-[#160824] shadow-[0_0_8px_#00E5A0]" />;
  }
  if (user.lastOnlineMinutes && user.lastOnlineMinutes <= 30) {
    return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#160824]" />;
  }
  return null;
}

// ===== TAB BAR =====
function InboxTabBar({ active, onChange, requestCount, sparkCount, peopleCount }: {
  active: ChatTab; onChange: (t: ChatTab) => void;
  requestCount: number; sparkCount: number; peopleCount: number;
}) {
  return (
    <div className="flex gap-1 px-4 py-2 bg-dark-900/50">
      {[
        { id: 'people' as ChatTab, label: 'My People', count: peopleCount, emoji: '👥' },
        { id: 'requests' as ChatTab, label: 'Requests', count: requestCount, emoji: '💌' },
        { id: 'sparks' as ChatTab, label: 'Sparks', count: sparkCount, emoji: '⚡' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            active === tab.id
              ? 'gradient-accent text-white'
              : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          {tab.emoji} {tab.label}
          {tab.count > 0 && active !== tab.id && (
            <span className={`absolute -top-1.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 ${
              tab.id === 'sparks' ? 'bg-soul-500 text-white' : 'bg-accent text-white'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// =========================================================
//  TAB 1: MY PEOPLE (Connections + Ongoing Conversations)
// =========================================================
function MyPeopleTab({ onSelectChat }: { onSelectChat: (id: string) => void }) {
  const unpinnedConvos = MOCK_CONVERSATIONS.filter(
    c => !PINNED_CONVERSATIONS.find(p => p.id === c.id)
  );

  return (
    <div className="animate-fade-in pb-8">
      {/* Online Now stripe */}
      <div className="px-4 py-4 pb-6 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-white tracking-wide">Activities</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {MOCK_CONVERSATIONS.filter(c => c.user.isOnline).map(conv => (
            <button key={conv.id} className="flex-shrink-0 flex flex-col items-center gap-2 group" onClick={() => onSelectChat(conv.id)}>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-dark-600 p-[2px] bg-gradient-to-tr from-accent to-soul-400 transition-transform group-hover:scale-105">
                  <img src={conv.user.photos[0]} alt={conv.user.displayName} className="w-full h-full rounded-full object-cover border-2 border-[#160824]" />
                </div>
                <OnlineDot user={conv.user} />
              </div>
              <span className="text-[11px] font-medium text-text-secondary truncate w-16 text-center">{conv.user.displayName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PINNED */}
      {PINNED_CONVERSATIONS.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-2">📌 Pinned</div>
          {PINNED_CONVERSATIONS.map(conv => (
            <ConversationRow key={`pin-${conv.id}`} conv={conv} onSelect={onSelectChat} isPinned />
          ))}
        </div>
      )}

      {/* MY PEOPLE (Connections) */}
      <div className="px-4 pt-2 pb-1">
        <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-2">👥 My People</div>
        {unpinnedConvos.map(conv => (
          <ConversationRow key={conv.id} conv={conv} onSelect={onSelectChat} />
        ))}
      </div>

      {/* DIVIDER */}
      {MOCK_ONGOING_CONVOS.length > 0 && (
        <>
          <div className="mx-4 my-3 h-px bg-dark-500/50" />
          <div className="px-4 pb-4">
            <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-1">
              💬 Ongoing Conversations (Not connected yet)
            </div>
            {MOCK_ONGOING_CONVOS.map(oc => (
              <div key={oc.id} className="mb-2">
                <button
                  onClick={() => onSelectChat(oc.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-700/50 transition-all text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-xl">
                      {oc.user.gender === 'Female' ? '👩🏾' : '👨🏾'}
                    </div>
                    <OnlineDot user={oc.user} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary">{oc.user.displayName}</span>
                      <span className="text-[10px] text-text-tertiary">{oc.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs truncate ${oc.unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                        {oc.lastMessage}
                      </span>
                      {oc.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full gradient-accent flex items-center justify-center text-[10px] font-bold text-white ml-2">
                          {oc.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-accent mt-0.5">{oc.vpPerMessage} VP/msg</div>
                  </div>
                </button>
                <div className="ml-[60px] mt-0.5 px-3 py-1.5 rounded-lg bg-soul-500/10 border border-soul-500/15">
                  <span className="text-[10px] text-soul-400">Complete a Spark call for free chat! ⚡</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ===== CONVERSATION ROW (My People) =====
function ConversationRow({ conv, onSelect, isPinned }: {
  conv: typeof MOCK_CONVERSATIONS[0]; onSelect: (id: string) => void; isPinned?: boolean;
}) {
  const isUnread = conv.unreadCount > 0;
  return (
    <button
      onClick={() => onSelect(conv.id)}
      className="w-full flex items-center gap-4 py-3 hover:bg-white/5 px-2 rounded-2xl transition-all text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-dark-600">
          <img src={conv.user.photos[0]} alt={conv.user.displayName} className="w-full h-full rounded-full object-cover" />
        </div>
        <OnlineDot user={conv.user} />
      </div>
      <div className="flex-1 min-w-0 border-b border-white/5 pb-3">
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            {isPinned && <span className="text-[10px]">📌</span>}
            <span className={`text-[15px] ${isUnread ? 'font-bold text-white' : 'font-semibold text-text-primary'}`}>{conv.user.displayName}</span>
            {getVipInfo(conv.user.vipLevel).badge && <span className="text-sm">{getVipInfo(conv.user.vipLevel).badge}</span>}
            {conv.user.isVerified && <span className="text-blue text-xs flex items-center justify-center w-3 h-3 bg-blue/20 rounded-full text-[8px] ml-1">✓</span>}
          </div>
          <span className={`text-[11px] ${isUnread ? 'text-accent font-semibold' : 'text-text-tertiary'}`}>{conv.lastMessageTime}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[13px] truncate pr-4 ${isUnread ? 'text-white font-medium' : 'text-text-secondary'}`}>
            {conv.lastMessage}
          </span>
          {isUnread && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full gradient-accent flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,53,221,0.5)]">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// =========================================================
//  TAB 2: REQUESTS (Say Hi)
// =========================================================
function RequestsTab() {
  const [sort, setSort] = useState<RequestSort>('newest');

  return (
    <div className="animate-fade-in pb-8">
      <div className="px-4 py-3 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setSort('newest')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${sort === 'newest' ? 'bg-white text-dark-900' : 'glass text-text-secondary'}`}>Latest</button>
        <button onClick={() => setSort('match')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${sort === 'match' ? 'bg-white text-dark-900' : 'glass text-text-secondary'}`}>High Match 🎯</button>
        <button onClick={() => setSort('verified')} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${sort === 'verified' ? 'bg-white text-dark-900' : 'glass text-text-secondary'}`}>Verified ✓</button>
      </div>
      <div className="px-4 py-2">
        {MOCK_REQUESTS.map(req => (
          <div key={req.id} className="mb-4">
            <Link href={`/app/profile/${req.sender.id}`} className="block relative w-full aspect-[4/5] rounded-[24px] overflow-hidden group shadow-lg">
              <img src={req.sender.photos[0]} alt={req.sender.displayName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col justify-end z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-white leading-tight">{req.sender.displayName}</span>
                  {getVipInfo(req.sender.vipLevel).badge && <span className="text-lg">{getVipInfo(req.sender.vipLevel).badge}</span>}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================
//  TAB 3: SPARKS (Active Matches)
// =========================================================
function SparksTab({ onSelectChat }: { onSelectChat: (id: string) => void }) {
  return (
    <div className="animate-fade-in p-4 pb-8">
      <div className="space-y-4">
        {MOCK_ACTIVE_SPARKS.map(spark => (
          <div key={spark.id} className="p-4 rounded-2xl glass border border-soul-500/20 shadow-[0_4px_15px_rgba(139,92,246,0.1)] hover:bg-white/5 transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-soul-400 p-[2px]">
                <img src={spark.user.photos[0]} alt={spark.user.displayName} className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{spark.user.displayName}</span>
                {getVipInfo(spark.user.vipLevel).badge && <span className="text-sm">{getVipInfo(spark.user.vipLevel).badge}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== MAIN EXPORT COMPONENT =====
export default function ChatInboxPage() {
  const [activeTab, setActiveTab] = useState<ChatTab>('people');

  return (
    <div className="min-h-full font-[Outfit]">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-wide">Inbox</h1>
      </div>
      <div className="sticky top-[-1px] z-40 pb-2 bg-dark-900 border-b border-white/5">
        <InboxTabBar
          active={activeTab}
          onChange={setActiveTab}
          peopleCount={1}
          requestCount={4}
          sparkCount={2}
        />
      </div>

      <div className="pt-2">
        {activeTab === 'people' && <MyPeopleTab onSelectChat={(id) => { console.log('select', id) }} />}
        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'sparks' && <SparksTab onSelectChat={(id) => { console.log('spark select', id) }} />}
      </div>
    </div>
  );
}
