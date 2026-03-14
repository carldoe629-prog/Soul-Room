'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchMessagesWithReactions,
  sendMessage,
  sendVaultMessage,
  markMessagesRead,
  editMessage,
  revokeMessage,
  openVaultMessage,
  addReaction,
  removeReaction,
  forwardMessage,
  subscribeToMessageUpdates,
  subscribeToReactions,
  fetchConversations,
  reportUser,
  isStrangerConversation,
  deductVP,
} from '@/lib/db';
import { createClient } from '@/lib/supabase';
import { getVipInfo } from '@/lib/mock-data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OtherUser {
  id: string;
  display_name: string;
  photos: string[];
  vip_level: number;
  is_online: boolean;
  last_online_at: string | null;
  is_verified: boolean;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface Msg {
  id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  created_at: string;
  is_read: boolean;
  is_revoked?: boolean;
  is_vault?: boolean;
  is_forwarded?: boolean;
  edited_at?: string | null;
  original_content?: string | null;
  view_once_opened_at?: string | null;
  view_once_opened_by?: string | null;
  delete_for_sender_at?: string | null;
  delete_for_recipient_at?: string | null;
  reactions: Reaction[];
  sender?: { id: string; display_name: string; photos: string[]; vip_level: number };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ['🔥', '💫', '😂', '😭', '👌', '❤️'];

// ── Window helpers ────────────────────────────────────────────────────────────

function getDeleteWindowMs(tier: string): number | null {
  switch (tier) {
    case 'free':    return 24 * 3600_000;
    case 'plus':    return 72 * 3600_000;
    case 'premium':
    case 'vip':     return 7 * 24 * 3600_000;
    default:        return null; // founder / unknown → no limit
  }
}

function getEditWindowMs(tier: string): number | null {
  switch (tier) {
    case 'free':    return 15 * 60_000;
    case 'plus':    return 60 * 60_000;
    case 'premium':
    case 'vip':
    case 'founder': return null;
    default:        return 15 * 60_000;
  }
}

function withinWindow(createdAt: string, windowMs: number | null) {
  if (!windowMs) return true;
  return Date.now() - new Date(createdAt).getTime() < windowMs;
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getOnlineStatus(user: OtherUser) {
  if (user.is_online) return { label: 'Online now', color: '#00E5A0' };
  if (!user.last_online_at) return { label: '', color: '' };
  const mins = Math.floor((Date.now() - new Date(user.last_online_at).getTime()) / 60000);
  if (mins < 60) return { label: `${mins}m ago`, color: '#F59E0B' };
  if (mins < 1440) return { label: `${Math.floor(mins / 60)}h ago`, color: '' };
  return { label: `${Math.floor(mins / 1440)}d ago`, color: '' };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReactionRow({
  reactions,
  myId,
  onTap,
}: {
  reactions: Reaction[];
  myId: string;
  onTap: (emoji: string) => void;
}) {
  if (!reactions.length) return null;
  const grouped: Record<string, { count: number; users: string[]; mine: boolean }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [], mine: false };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
    if (r.user_id === myId) grouped[r.emoji].mine = true;
  }
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          onClick={() => onTap(emoji)}
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all
            ${mine ? 'bg-accent/20 border border-accent/40 text-accent' : 'bg-dark-600/80 text-text-secondary hover:bg-dark-500'}`}
        >
          <span>{emoji}</span>
          {count > 1 && <span>{count}</span>}
        </button>
      ))}
    </div>
  );
}

function VaultBubble({ msg, isMine, onOpen, isFounder = false }: { msg: Msg; isMine: boolean; onOpen: () => void; isFounder?: boolean }) {
  const isOpened = !!msg.view_once_opened_at;
  const canTap = !isOpened || isFounder;
  const typeLabel =
    msg.message_type === 'image' ? 'Photo' :
    msg.message_type === 'voice' ? 'Voice' : 'Message';

  return (
    <button
      onClick={canTap ? onOpen : undefined}
      disabled={!canTap}
      className={`flex items-center gap-2 px-4 py-3 rounded-[20px] text-sm font-medium transition-all
        ${isMine
          ? 'gradient-accent text-white rounded-br-[6px]'
          : 'glass text-text-primary rounded-bl-[6px]'}
        ${!canTap ? 'opacity-60' : 'hover:scale-[1.02]'}`}
    >
      <span className="text-lg">{isOpened ? '✓' : '🔒'}</span>
      <span>{isOpened ? (isFounder ? `${typeLabel} · Re-view 👑` : 'Opened') : `${typeLabel} · View once`}</span>
    </button>
  );
}

function ContextMenuSheet({
  msg,
  isMine,
  tier,
  isFounder,
  myId,
  onClose,
  onReply,
  onReact,
  onEdit,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onReport,
}: {
  msg: Msg;
  isMine: boolean;
  tier: string;
  isFounder: boolean;
  myId: string;
  onClose: () => void;
  onReply: () => void;
  onReact: () => void;
  onEdit: () => void;
  onForward: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onReport: () => void;
}) {
  const isRevoked = !!msg.is_revoked;
  const isVault = !!msg.is_vault;
  // Founder can edit/delete any message regardless of ownership or time window
  const canEdit = (isMine || isFounder)
    && msg.message_type === 'text'
    && !isRevoked
    && !isVault
    && withinWindow(msg.created_at, isFounder ? null : getEditWindowMs(tier));
  const canDeleteEveryone = (isMine || isFounder)
    && !isRevoked
    && withinWindow(msg.created_at, isFounder ? null : getDeleteWindowMs(tier));
  const canForward = !isVault && !isRevoked && msg.message_type !== 'gift';
  const alreadyDeletedForMe = isMine
    ? !!msg.delete_for_sender_at
    : !!msg.delete_for_recipient_at;

  const actions = isMine
    ? [
        { label: '↩ Reply', fn: onReply },
        { label: '😊 React', fn: onReact },
        canEdit ? { label: '✏️ Edit', fn: onEdit } : null,
        canForward ? { label: '↗ Forward', fn: onForward } : null,
        !alreadyDeletedForMe ? { label: '🗑 Delete for me', fn: onDeleteForMe } : null,
        canDeleteEveryone ? { label: '⛔ Delete for everyone', fn: onDeleteForEveryone, danger: true } : null,
      ].filter(Boolean) as { label: string; fn: () => void; danger?: boolean }[]
    : [
        { label: '↩ Reply', fn: onReply },
        { label: '😊 React', fn: onReact },
        canForward ? { label: '↗ Forward', fn: onForward } : null,
        !alreadyDeletedForMe ? { label: '🗑 Delete for me', fn: onDeleteForMe } : null,
        { label: '🚩 Report', fn: onReport, danger: true },
      ].filter(Boolean) as { label: string; fn: () => void; danger?: boolean }[];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl glass-strong border-t border-white/10 pb-safe animate-slide-up">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
        <div className="px-4 pb-6 space-y-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => { a.fn(); onClose(); }}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-medium transition-all
                ${a.danger ? 'text-red hover:bg-red/10' : 'text-text-primary hover:bg-white/8'}`}
            >
              {a.label}
            </button>
          ))}
          <button
            onClick={onClose}
            className="w-full text-center px-4 py-3.5 rounded-2xl text-sm font-medium text-text-tertiary hover:bg-white/5 transition-all mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function ReactionPickerOverlay({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-3 rounded-full glass-strong border border-white/10 shadow-2xl animate-slide-up">
        {REACTION_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => { onPick(e); onClose(); }}
            className="text-2xl hover:scale-125 transition-transform active:scale-110"
          >
            {e}
          </button>
        ))}
      </div>
    </>
  );
}

function VaultViewerModal({
  msg,
  onClose,
  isFounder = false,
}: {
  msg: Msg;
  onClose: () => void;
  isFounder?: boolean;
}) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (isFounder) return; // no timer for founder
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); onClose(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onClose, isFounder]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {!isFounder && (
          <span className="text-xs text-white/60 font-mono">Closes in {seconds}s</span>
        )}
        {isFounder && (
          <span className="text-[10px] text-amber-400/80 font-mono">👑 Founder view</span>
        )}
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-sm">✕</button>
      </div>

      {/* Screenshot warning */}
      <div className="mb-6 px-4 py-2 rounded-xl bg-white/5 text-[11px] text-white/50 text-center max-w-xs">
        ⚠️ Screenshot prevention is not available on this platform. Be respectful.
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm">
        {msg.message_type === 'image' && msg.content ? (
          <img src={msg.content} className="max-w-full max-h-full rounded-2xl object-contain" alt="View once" />
        ) : (
          <p className="text-white text-xl text-center font-medium leading-relaxed px-4">
            {msg.content}
          </p>
        )}
      </div>

      {/* Countdown ring */}
      {!isFounder && (
        <div className="mt-6 w-12 h-12 rounded-full border-2 border-vibe flex items-center justify-center">
          <span className="text-white font-bold text-sm">{seconds}</span>
        </div>
      )}
    </div>
  );
}

function ForwardPickerModal({
  conversations,
  onSelect,
  onClose,
}: {
  conversations: { id: string; otherUser: { display_name: string; photos: string[] } }[];
  onSelect: (convId: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl glass-strong border-t border-white/10 pb-safe max-h-[70vh] flex flex-col">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
        <div className="px-4 py-2 border-b border-white/5">
          <h3 className="text-sm font-bold text-white">Forward to…</h3>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose(); }}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-2xl hover:bg-white/8 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
                {c.otherUser.photos?.[0] ? (
                  <img src={c.otherUser.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                )}
              </div>
              <span className="text-sm font-medium text-text-primary">{c.otherUser.display_name}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-text-tertiary text-xs text-center py-6">No other conversations</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();
  const { user, profile } = useAuth();

  const tier = profile?.subscription_tier ?? 'free';
  const isFounder = tier === 'founder';

  // ── Core state
  const [messages, setMessages] = useState<Msg[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Input state
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [vaultToggle, setVaultToggle] = useState(false);

  // ── Edit mode
  const [editingMsg, setEditingMsg] = useState<Msg | null>(null);

  // ── Reply mode (pre-fill text with quote)
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);

  // ── Context menu
  const [contextMsg, setContextMsg] = useState<Msg | null>(null);

  // ── Reaction picker
  const [reactionMsg, setReactionMsg] = useState<Msg | null>(null);

  // ── Vault viewer
  const [vaultViewMsg, setVaultViewMsg] = useState<Msg | null>(null);

  // ── Forward
  const [forwardMsg, setForwardMsg] = useState<Msg | null>(null);
  const [myConversations, setMyConversations] = useState<any[]>([]);

  // ── Toast
  const [toast, setToast] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Helpers to update messages in state
  const updateMessage = useCallback((updated: Partial<Msg> & { id: string }) => {
    setMessages((prev) =>
      prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m)
    );
  }, []);

  // ── Load conversation + messages
  useEffect(() => {
    if (!user || !conversationId) return;
    const supabase = createClient();

    supabase
      .from('conversations')
      .select(`
        user_a, user_b,
        user_a_profile:users!conversations_user_a_fkey(id, display_name, photos, vip_level, is_online, last_online_at, is_verified),
        user_b_profile:users!conversations_user_b_fkey(id, display_name, photos, vip_level, is_online, last_online_at, is_verified)
      `)
      .eq('id', conversationId)
      .single()
      .then(({ data }: { data: any }) => {
        if (data) {
          const other = data.user_a === user.id
            ? (data.user_b_profile as unknown as OtherUser)
            : (data.user_a_profile as unknown as OtherUser);
          setOtherUser(other);
        }
      });

    fetchMessagesWithReactions(conversationId)
      .then((msgs) => setMessages(msgs as Msg[]))
      .catch(() => {})
      .finally(() => setLoading(false));

    markMessagesRead(conversationId, user.id);
  }, [user, conversationId]);

  // ── Realtime: messages INSERT + UPDATE
  useEffect(() => {
    if (!conversationId) return;
    const channel = subscribeToMessageUpdates(
      conversationId,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, reactions: [] }];
        });
      },
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === updatedMsg.id
              ? { ...m, ...updatedMsg, reactions: m.reactions } // keep cached reactions
              : m
          )
        );
      }
    );
    return () => { channel.unsubscribe(); };
  }, [conversationId]);

  // ── Realtime: reactions INSERT + DELETE
  useEffect(() => {
    const channel = subscribeToReactions(
      (newReaction) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== newReaction.message_id) return m;
            if (m.reactions.find((r) => r.id === newReaction.id)) return m;
            return { ...m, reactions: [...m.reactions, newReaction] };
          })
        );
      },
      (deletedReaction) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== deletedReaction.message_id) return m;
            return { ...m, reactions: m.reactions.filter((r) => r.id !== deletedReaction.id) };
          })
        );
      }
    );
    return () => { channel.unsubscribe(); };
  }, []);

  // ── Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Long-press detection
  const startLongPress = useCallback((msg: Msg) => {
    longPressTimer.current = setTimeout(() => {
      setContextMsg(msg);
    }, 600);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // ── Send
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !user || sending) return;

    // Edit mode
    if (editingMsg) {
      const windowMs = isFounder ? null : getEditWindowMs(tier);
      if (!withinWindow(editingMsg.created_at, windowMs)) {
        showToast('Edit window has expired for your plan.');
        return;
      }
      setSending(true);
      setText('');
      setEditingMsg(null);
      try {
        await editMessage(editingMsg.id, trimmed, user.id);
        updateMessage({ id: editingMsg.id, content: trimmed, edited_at: new Date().toISOString() });
      } catch {
        setText(trimmed);
        setEditingMsg(editingMsg);
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    const prefix = replyingTo
      ? `↩ "${replyingTo.content?.slice(0, 40)}…"\n${trimmed}`
      : trimmed;
    setText('');
    setReplyingTo(null);
    setVaultToggle(false);

    try {
      const sendFn = vaultToggle ? sendVaultMessage : sendMessage;
      // Vault photo to stranger costs 50 VP
      if (vaultToggle && !isFounder) {
        const isStranger = await isStrangerConversation(conversationId, user.id);
        if (isStranger) {
          await deductVP(user.id, 50, 'vault_photo', 'Vault photo message').catch(() => {});
        }
      }
      const msg = await sendFn(conversationId, user.id, prefix);
      setMessages((prev) => [...prev, { ...(msg as Msg), reactions: [] }]);
    } catch {
      setText(prefix);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [text, user, sending, editingMsg, replyingTo, vaultToggle, conversationId, tier, isFounder, showToast, updateMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Delete for me
  const handleDeleteForMe = useCallback(async (msg: Msg) => {
    const isMine = msg.sender_id === user?.id;
    const mode = isMine ? 'for_me_sender' : 'for_me_recipient';
    // Optimistic — hide immediately
    if (isMine) {
      updateMessage({ id: msg.id, delete_for_sender_at: new Date().toISOString() });
    } else {
      updateMessage({ id: msg.id, delete_for_recipient_at: new Date().toISOString() });
    }
    await revokeMessage(msg.id, mode).catch(() => {});
  }, [user, updateMessage]);

  // ── Delete for everyone
  const handleDeleteForEveryone = useCallback(async (msg: Msg) => {
    const windowMs = isFounder ? null : getDeleteWindowMs(tier);
    if (!withinWindow(msg.created_at, windowMs)) {
      showToast('Delete window has expired for your plan.');
      return;
    }
    const confirmed = window.confirm('Delete for everyone? They will see that a message was deleted.');
    if (!confirmed) return;
    updateMessage({ id: msg.id, is_revoked: true, content: null });
    await revokeMessage(msg.id, 'for_everyone').catch(() => {});
  }, [tier, isFounder, showToast, updateMessage]);

  // ── Open vault
  const handleOpenVault = useCallback(async (msg: Msg) => {
    if (!user) return;
    // Founder can re-open already-opened vault messages
    if (msg.view_once_opened_at && !isFounder) return;
    if (!isFounder) {
      const confirmed = window.confirm('This can only be viewed once. Open now?');
      if (!confirmed) return;
      await openVaultMessage(msg.id, user.id).catch(() => {});
      updateMessage({ id: msg.id, view_once_opened_at: new Date().toISOString(), view_once_opened_by: user.id });
    }
    setVaultViewMsg({ ...msg, view_once_opened_at: new Date().toISOString() });
  }, [user, isFounder, updateMessage]);

  // ── Reaction tap on existing pill
  const handleReactionPillTap = useCallback(async (msg: Msg, emoji: string) => {
    if (!user) return;
    const mine = msg.reactions.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (mine) {
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id
          ? { ...m, reactions: m.reactions.filter((r) => r.id !== mine.id) }
          : m)
      );
      await removeReaction(msg.id, user.id).catch(() => {});
    } else {
      const fakeId = `tmp-${Date.now()}`;
      const fakeReaction: Reaction = { id: fakeId, message_id: msg.id, user_id: user.id, emoji, created_at: new Date().toISOString() };
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id
          ? { ...m, reactions: [...m.reactions.filter((r) => r.user_id !== user.id), fakeReaction] }
          : m)
      );
      await addReaction(msg.id, user.id, emoji).catch(() => {});
    }
  }, [user]);

  // ── Reaction from picker
  const handleAddReaction = useCallback(async (emoji: string) => {
    if (!reactionMsg || !user) return;
    const msg = reactionMsg;
    const existing = msg.reactions.find((r) => r.user_id === user.id);
    if (existing?.emoji === emoji) {
      // Same emoji — remove
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id
          ? { ...m, reactions: m.reactions.filter((r) => r.id !== existing.id) }
          : m)
      );
      await removeReaction(msg.id, user.id).catch(() => {});
    } else {
      const fakeId = `tmp-${Date.now()}`;
      const fakeReaction: Reaction = { id: fakeId, message_id: msg.id, user_id: user.id, emoji, created_at: new Date().toISOString() };
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id
          ? { ...m, reactions: [...m.reactions.filter((r) => r.user_id !== user.id), fakeReaction] }
          : m)
      );
      await addReaction(msg.id, user.id, emoji).catch(() => {});
    }
    setReactionMsg(null);
  }, [reactionMsg, user]);

  // ── Forward
  const handleOpenForward = useCallback(async (msg: Msg) => {
    setForwardMsg(msg);
    if (!user) return;
    try {
      const convos = await fetchConversations(user.id);
      setMyConversations((convos as any[]).filter((c: any) => c.id !== conversationId));
    } catch {}
  }, [user, conversationId]);

  const handleForward = useCallback(async (targetConvId: string) => {
    if (!forwardMsg || !user) return;
    try {
      // Forwarding to a stranger conversation costs 50 VP
      if (!isFounder) {
        const isStranger = await isStrangerConversation(targetConvId, user.id);
        if (isStranger) {
          await deductVP(user.id, 50, 'forward_stranger', 'Forward to stranger').catch(() => {});
        }
      }
      await forwardMessage(forwardMsg.id, targetConvId, user.id);
      showToast('Message forwarded.');
    } catch (e: any) {
      showToast(e.message || 'Could not forward.');
    }
    setForwardMsg(null);
  }, [forwardMsg, user, isFounder, showToast]);

  // ── Report
  const handleReport = useCallback(async (msg: Msg) => {
    if (!user) return;
    await reportUser(user.id, msg.sender_id, 'inappropriate_message').catch(() => {});
    showToast('Message reported.');
  }, [user, showToast]);

  // ── Edit setup
  const startEdit = useCallback((msg: Msg) => {
    setEditingMsg(msg);
    setText(msg.content ?? '');
    setReplyingTo(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Filter deleted-for-me messages
  const visibleMessages = messages.filter((m) => {
    if (m.sender_id === user?.id && m.delete_for_sender_at) return false;
    if (m.sender_id !== user?.id && m.delete_for_recipient_at) return false;
    return true;
  });

  // ── Group by date
  const groups: { date: string; messages: Msg[] }[] = [];
  for (const msg of visibleMessages) {
    const label = formatDateLabel(msg.created_at);
    const last = groups[groups.length - 1];
    if (!last || last.date !== label) groups.push({ date: label, messages: [msg] });
    else last.messages.push(msg);
  }

  const onlineStatus = otherUser ? getOnlineStatus(otherUser) : null;
  const vipInfo = otherUser ? getVipInfo(otherUser.vip_level) : null;
  const avatarUrl = otherUser?.photos?.[0];

  return (
    <div className="flex flex-col h-[100dvh] bg-dark-900 font-[Outfit] select-none">

      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 glass border-b border-white/5 z-10">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-600 transition-colors text-text-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-soul-500 to-soul-700 overflow-hidden border-2 border-white/10">
            {avatarUrl
              ? <img src={avatarUrl} alt={otherUser?.display_name} className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{otherUser?.display_name?.charAt(0) ?? '?'}</span>
            }
          </div>
          {otherUser?.is_online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00E5A0] border-2 border-dark-900" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white truncate">{otherUser?.display_name ?? '...'}</span>
            {vipInfo?.badge && <span className="text-sm flex-shrink-0">{vipInfo.badge}</span>}
            {otherUser?.is_verified && (
              <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center bg-blue/20 rounded-full text-blue text-[8px]">✓</span>
            )}
          </div>
          {onlineStatus?.label && (
            <p className="text-[11px] font-medium" style={{ color: onlineStatus.color || '#A87DC9' }}>
              {onlineStatus.label}
            </p>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full gradient-accent animate-pulse" />
          </div>
        )}

        {!loading && visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="text-5xl">💬</div>
            <p className="text-text-primary font-semibold">Start the conversation</p>
            <p className="text-xs text-text-tertiary">Say something nice to {otherUser?.display_name ?? 'them'} ✨</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-text-tertiary font-medium px-2">{group.date}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {group.messages.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              const prev = group.messages[idx - 1];
              const next = group.messages[idx + 1];
              const isFirst = !prev || prev.sender_id !== msg.sender_id;
              const isLast = !next || next.sender_id !== msg.sender_id;
              const isRevoked = !!msg.is_revoked;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}
                >
                  {/* Other user avatar */}
                  {!isMine && (
                    <div className="w-7 h-7 flex-shrink-0">
                      {isLast ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-soul-500 to-soul-700 overflow-hidden">
                          {avatarUrl
                            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">{otherUser?.display_name?.charAt(0)}</span>
                          }
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {/* Forwarded label */}
                    {msg.is_forwarded && !isRevoked && (
                      <span className="text-[9px] text-text-tertiary mb-0.5 flex items-center gap-0.5">
                        ↗ Forwarded
                      </span>
                    )}

                    {/* Bubble */}
                    {isRevoked ? (
                      <div className={`px-4 py-2.5 text-sm italic text-text-tertiary rounded-[20px]
                        ${isMine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}
                        ${!isLast ? (isMine ? 'rounded-br-[20px]' : 'rounded-bl-[20px]') : ''}
                        bg-dark-700/40`}
                      >
                        This message was deleted
                      </div>
                    ) : msg.is_vault ? (
                      <div
                        onTouchStart={() => startLongPress(msg)}
                        onTouchEnd={cancelLongPress}
                        onTouchMove={cancelLongPress}
                        onMouseDown={() => startLongPress(msg)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                      >
                        <VaultBubble
                          msg={msg}
                          isMine={isMine}
                          onOpen={() => (!isMine || isFounder) && handleOpenVault(msg)}
                          isFounder={isFounder}
                        />
                      </div>
                    ) : (
                      <div
                        onTouchStart={() => startLongPress(msg)}
                        onTouchEnd={cancelLongPress}
                        onTouchMove={cancelLongPress}
                        onMouseDown={() => startLongPress(msg)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                        className={`px-4 py-2.5 text-sm leading-relaxed cursor-pointer
                          ${isMine
                            ? 'gradient-accent text-white rounded-[20px] rounded-br-[6px]'
                            : 'glass text-text-primary rounded-[20px] rounded-bl-[6px]'}
                          ${!isLast ? (isMine ? 'rounded-br-[20px]' : 'rounded-bl-[20px]') : ''}`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Edited label */}
                    {msg.edited_at && !isRevoked && (
                      <span className="text-[8px] text-text-tertiary mt-0.5 px-1">edited</span>
                    )}

                    {/* Timestamp + read */}
                    {isLast && (
                      <span className="text-[9px] text-text-tertiary mt-1 px-1">
                        {formatTime(msg.created_at)}
                        {isMine && <span className="ml-1">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                      </span>
                    )}

                    {/* Reactions */}
                    <ReactionRow
                      reactions={msg.reactions ?? []}
                      myId={user?.id ?? ''}
                      onTap={(emoji) => handleReactionPillTap(msg, emoji)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </main>

      {/* ── Reply banner ── */}
      {replyingTo && (
        <div className="flex-shrink-0 px-4 py-2 bg-dark-700/80 border-t border-white/5 flex items-center gap-2">
          <span className="text-[11px] text-text-tertiary flex-1 truncate">
            ↩ Replying to: "{replyingTo.content?.slice(0, 50)}…"
          </span>
          <button onClick={() => setReplyingTo(null)} className="text-text-tertiary hover:text-text-secondary text-xs">✕</button>
        </div>
      )}

      {/* ── Edit banner ── */}
      {editingMsg && (
        <div className="flex-shrink-0 px-4 py-2 bg-accent/10 border-t border-accent/20 flex items-center gap-2">
          <span className="text-[11px] text-accent flex-1">✏️ Editing message</span>
          <button
            onClick={() => { setEditingMsg(null); setText(''); }}
            className="text-accent hover:text-accent/70 text-xs"
          >✕ Cancel</button>
        </div>
      )}

      {/* ── Input Bar ── */}
      <footer className="flex-shrink-0 px-4 py-3 glass border-t border-white/5">
        <div className="flex items-center gap-3">
          {/* Vault toggle */}
          <button
            onClick={() => setVaultToggle((v) => !v)}
            className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-all
              ${vaultToggle ? 'bg-vibe/20 text-vibe' : 'glass text-text-secondary hover:text-text-primary'}`}
            title={vaultToggle ? 'View once ON — tap to toggle off' : 'Send as view once'}
          >
            {vaultToggle ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-dark-700/60 border border-white/8 rounded-full px-4 py-2.5 gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                editingMsg ? 'Edit your message…'
                : vaultToggle ? '🔒 View once message…'
                : `Message ${otherUser?.display_name ?? ''}…`
              }
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none"
            />
            <button className="text-text-tertiary hover:text-text-secondary transition-colors text-base flex-shrink-0">😊</button>
          </div>

          {/* Send / Voice */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full gradient-accent text-white shadow-[0_4px_12px_rgba(244,53,221,0.4)] hover:scale-105 transition-transform disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full glass text-text-secondary hover:text-text-primary transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </div>

        {/* Vault indicator */}
        {vaultToggle && (
          <p className="text-[10px] text-vibe mt-1.5 text-center">🔒 View once — recipient can open this message once</p>
        )}
      </footer>

      {/* ── Overlays ── */}
      {contextMsg && (
        <ContextMenuSheet
          msg={contextMsg}
          isMine={contextMsg.sender_id === user?.id}
          tier={tier}
          isFounder={isFounder}
          myId={user?.id ?? ''}
          onClose={() => setContextMsg(null)}
          onReply={() => { setReplyingTo(contextMsg); setText(''); setEditingMsg(null); setTimeout(() => inputRef.current?.focus(), 50); }}
          onReact={() => setReactionMsg(contextMsg)}
          onEdit={() => startEdit(contextMsg)}
          onForward={() => handleOpenForward(contextMsg)}
          onDeleteForMe={() => handleDeleteForMe(contextMsg)}
          onDeleteForEveryone={() => handleDeleteForEveryone(contextMsg)}
          onReport={() => handleReport(contextMsg)}
        />
      )}

      {reactionMsg && (
        <ReactionPickerOverlay
          onPick={handleAddReaction}
          onClose={() => setReactionMsg(null)}
        />
      )}

      {vaultViewMsg && (
        <VaultViewerModal
          msg={vaultViewMsg}
          onClose={() => setVaultViewMsg(null)}
          isFounder={isFounder}
        />
      )}

      {forwardMsg && (
        <ForwardPickerModal
          conversations={myConversations}
          onSelect={handleForward}
          onClose={() => setForwardMsg(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-dark-700 text-white text-xs font-medium shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
