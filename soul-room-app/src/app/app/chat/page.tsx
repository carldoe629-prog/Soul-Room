'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchConversations, fetchSparkMatches, fetchSayHiRequests } from '@/lib/db';
import { getVipInfo } from '@/lib/mock-data';

// ── Types ─────────────────────────────────────────────────

interface OtherUser {
  id: string;
  display_name: string;
  photos: string[];
  vip_level: number;
  is_online: boolean;
  last_online_at: string | null;
  is_verified: boolean;
  gender: string;
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  last_message: string | null;
  last_message_at: string | null;
  unreadCount: number;
  isPinned: boolean;
}

interface SparkMatch {
  id: string;
  matchedUser: OtherUser;
  match_score: number;
  sparked_at: string;
}

interface SayHiRequest {
  id: string;
  sender: OtherUser;
  message: string;
  created_at: string;
}

// ── Tab Types ─────────────────────────────────────────────

type ChatTab = 'people' | 'requests' | 'sparks';

// ── Helpers ───────────────────────────────────────────────

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

// ── Online Dot ────────────────────────────────────────────

function OnlineDot({ user }: { user: { is_online: boolean; last_online_at: string | null } }) {
  if (user.is_online) {
    return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-vibe border-2 border-[#160824] shadow-[0_0_8px_#00E5A0]" />;
  }
  if (user.last_online_at) {
    const mins = Math.floor((Date.now() - new Date(user.last_online_at).getTime()) / 60000);
    if (mins <= 30) {
      return <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#160824]" />;
    }
  }
  return null;
}

// ── Tab Bar ───────────────────────────────────────────────

function InboxTabBar({
  active,
  onChange,
  requestCount,
  sparkCount,
  peopleCount,
}: {
  active: ChatTab;
  onChange: (t: ChatTab) => void;
  requestCount: number;
  sparkCount: number;
  peopleCount: number;
}) {
  return (
    <div className="flex gap-1 px-4 py-2 bg-dark-900/50">
      {[
        { id: 'people' as ChatTab, label: 'My People', count: peopleCount, emoji: '👥' },
        { id: 'requests' as ChatTab, label: 'Requests', count: requestCount, emoji: '💌' },
        { id: 'sparks' as ChatTab, label: 'Sparks', count: sparkCount, emoji: '⚡' },
      ].map((tab) => (
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
            <span
              className={`absolute -top-1.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 ${
                tab.id === 'sparks' ? 'bg-soul-500 text-white' : 'bg-accent text-white'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Conversation Row ──────────────────────────────────────

function ConversationRow({
  conv,
  onSelect,
  isPinned,
}: {
  conv: Conversation;
  onSelect: (id: string) => void;
  isPinned?: boolean;
}) {
  const isUnread = conv.unreadCount > 0;
  const vipInfo = getVipInfo(conv.otherUser.vip_level);
  const avatar = conv.otherUser.photos?.[0];

  return (
    <button
      onClick={() => onSelect(conv.id)}
      className="w-full flex items-center gap-4 py-3 hover:bg-white/5 px-2 rounded-2xl transition-all text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full bg-dark-600 overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={conv.otherUser.display_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {conv.otherUser.gender === 'Female' ? '👩🏾' : '👨🏾'}
            </div>
          )}
        </div>
        <OnlineDot user={conv.otherUser} />
      </div>
      <div className="flex-1 min-w-0 border-b border-white/5 pb-3">
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            {isPinned && <span className="text-[10px]">📌</span>}
            <span className={`text-[15px] ${isUnread ? 'font-bold text-white' : 'font-semibold text-text-primary'}`}>
              {conv.otherUser.display_name}
            </span>
            {vipInfo.badge && <span className="text-sm">{vipInfo.badge}</span>}
            {conv.otherUser.is_verified && (
              <span className="text-blue text-xs flex items-center justify-center w-3 h-3 bg-blue/20 rounded-full text-[8px] ml-1">✓</span>
            )}
          </div>
          <span className={`text-[11px] ${isUnread ? 'text-accent font-semibold' : 'text-text-tertiary'}`}>
            {formatRelativeTime(conv.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-[13px] truncate pr-4 ${isUnread ? 'text-white font-medium' : 'text-text-secondary'}`}>
            {conv.last_message ?? 'Say hi!'}
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

// ── Tab 1: My People ──────────────────────────────────────

function MyPeopleTab({
  conversations,
  loading,
  onSelect,
}: {
  conversations: Conversation[];
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  const pinned = conversations.filter((c) => c.isPinned);
  const unpinned = conversations.filter((c) => !c.isPinned);
  const online = conversations.filter((c) => c.otherUser.is_online);

  if (loading) {
    return (
      <div className="px-4 pt-4 space-y-4 animate-fade-in pb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full glass animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 glass animate-pulse rounded-full w-2/3" />
              <div className="h-3 glass animate-pulse rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      {/* Online Now stripe */}
      {online.length > 0 && (
        <div className="px-4 py-4 pb-6 border-b border-white/5">
          <h3 className="text-base font-bold text-white tracking-wide mb-4">Activities</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {online.map((conv) => (
              <button
                key={conv.id}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
                onClick={() => onSelect(conv.id)}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-accent to-soul-400 transition-transform group-hover:scale-105">
                    <div className="w-full h-full rounded-full bg-dark-600 overflow-hidden border-2 border-[#160824]">
                      {conv.otherUser.photos?.[0] ? (
                        <img src={conv.otherUser.photos[0]} alt={conv.otherUser.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {conv.otherUser.gender === 'Female' ? '👩🏾' : '👨🏾'}
                        </div>
                      )}
                    </div>
                  </div>
                  <OnlineDot user={conv.otherUser} />
                </div>
                <span className="text-[11px] font-medium text-text-secondary truncate w-16 text-center">
                  {conv.otherUser.display_name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-2">📌 Pinned</div>
          {pinned.map((conv) => (
            <ConversationRow key={`pin-${conv.id}`} conv={conv} onSelect={onSelect} isPinned />
          ))}
        </div>
      )}

      {/* All conversations */}
      <div className="px-4 pt-2 pb-1">
        {unpinned.length > 0 && (
          <div className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider mb-2">👥 My People</div>
        )}
        {unpinned.map((conv) => (
          <ConversationRow key={conv.id} conv={conv} onSelect={onSelect} />
        ))}
        {conversations.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-text-primary font-semibold mb-1">No conversations yet</p>
            <p className="text-xs text-text-tertiary">Say Hi to someone on the Home tab</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: Requests ───────────────────────────────────────

function RequestsTab({
  requests,
  loading,
}: {
  requests: SayHiRequest[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="px-4 pt-4 grid grid-cols-2 gap-3 animate-fade-in">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-full aspect-[4/5] rounded-[24px] glass animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8 px-4 pt-2">
      {requests.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">💌</div>
          <p className="text-text-primary font-semibold mb-1">No new requests</p>
          <p className="text-xs text-text-tertiary">When someone says Hi, it'll appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const avatar = req.sender.photos?.[0];
            const vipInfo = getVipInfo(req.sender.vip_level);
            return (
              <div key={req.id} className="mb-4">
                <Link href={`/app/profile/${req.sender.id}`} className="block relative w-full aspect-[4/5] rounded-[24px] overflow-hidden group shadow-lg">
                  {avatar ? (
                    <img src={avatar} alt={req.sender.display_name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-600 to-dark-800 flex items-center justify-center text-8xl">
                      {req.sender.gender === 'Female' ? '👩🏾' : '👨🏾'}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col justify-end z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold text-white leading-tight">{req.sender.display_name}</span>
                      {vipInfo.badge && <span className="text-lg">{vipInfo.badge}</span>}
                    </div>
                    {req.message && (
                      <p className="text-xs text-white/80 italic line-clamp-2">"{req.message}"</p>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Sparks ─────────────────────────────────────────

function SparksTab({
  sparks,
  loading,
  onSelect,
}: {
  sparks: SparkMatch[];
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-8">
      {sparks.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-text-primary font-semibold mb-1">No sparks yet</p>
          <p className="text-xs text-text-tertiary">Spark someone on the Spark tab to match</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sparks.map((spark) => {
            const u = spark.matchedUser;
            const vipInfo = getVipInfo(u.vip_level);
            const avatar = u.photos?.[0];
            return (
              <button
                key={spark.id}
                onClick={() => onSelect(spark.id)}
                className="w-full p-4 rounded-2xl glass border border-soul-500/20 shadow-[0_4px_15px_rgba(139,92,246,0.1)] hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-soul-400 overflow-hidden flex-shrink-0">
                    {avatar ? (
                      <img src={avatar} alt={u.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {u.gender === 'Female' ? '👩🏾' : '👨🏾'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{u.display_name}</span>
                      {vipInfo.badge && <span className="text-sm">{vipInfo.badge}</span>}
                    </div>
                    <p className="text-xs text-soul-400 mt-0.5">⚡ {spark.match_score}% match · Sparked {formatRelativeTime(spark.sparked_at)} ago</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-3 py-1.5 rounded-full gradient-accent text-white font-bold">Chat</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function ChatInboxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatTab>('people');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sparks, setSparks] = useState<SparkMatch[]>([]);
  const [requests, setRequests] = useState<SayHiRequest[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingSparks, setLoadingSparks] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchConversations(user.id)
      .then((data) => setConversations(data as Conversation[]))
      .catch(() => {})
      .finally(() => setLoadingConvos(false));

    fetchSparkMatches(user.id)
      .then((data) => setSparks(data as SparkMatch[]))
      .catch(() => {})
      .finally(() => setLoadingSparks(false));

    fetchSayHiRequests(user.id)
      .then((data) => setRequests(data as SayHiRequest[]))
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, [user]);

  const handleSelectConversation = (id: string) => {
    router.push(`/app/chat/${id}`);
  };

  return (
    <div className="min-h-full font-[Outfit]">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-wide">Inbox</h1>
      </div>
      <div className="sticky top-[-1px] z-40 pb-2 bg-dark-900 border-b border-white/5">
        <InboxTabBar
          active={activeTab}
          onChange={setActiveTab}
          peopleCount={conversations.filter((c) => c.unreadCount > 0).length}
          requestCount={requests.length}
          sparkCount={sparks.length}
        />
      </div>

      <div className="pt-2">
        {activeTab === 'people' && (
          <MyPeopleTab
            conversations={conversations}
            loading={loadingConvos}
            onSelect={handleSelectConversation}
          />
        )}
        {activeTab === 'requests' && (
          <RequestsTab requests={requests} loading={loadingRequests} />
        )}
        {activeTab === 'sparks' && (
          <SparksTab
            sparks={sparks}
            loading={loadingSparks}
            onSelect={handleSelectConversation}
          />
        )}
      </div>
    </div>
  );
}
