import { createClient } from './supabase';
import { getGiftEarningRate } from './mock-data';
import { filterChatMessage } from './moderation/contact-detector';

const supabase = createClient();

// ===== USERS =====

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchNearbyUsers(filters?: { gender?: string; limit?: number }) {
  let query = supabase
    .from('users')
    .select('*')
    .order('last_online_at', { ascending: false, nullsFirst: false });

  if (filters?.gender && filters.gender !== 'All') {
    query = query.eq('gender', filters.gender === 'Women' ? 'Female' : 'Male');
  }
  query = query.limit(filters?.limit || 20);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function setUserOnline(userId: string, online: boolean) {
  await supabase
    .from('users')
    .update({ is_online: online, last_online_at: new Date().toISOString() })
    .eq('id', userId);
}

// ===== WORLDS =====

export async function fetchWorlds(category?: string) {
  let query = supabase.from('worlds').select('*').order('member_count', { ascending: false });
  if (category && category !== 'All') query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchWorld(worldId: string) {
  const { data, error } = await supabase.from('worlds').select('*').eq('id', worldId).single();
  if (error) throw error;
  return data;
}

// ===== ROOMS =====

export async function fetchRooms(worldId?: string) {
  let query = supabase.from('rooms').select('*, worlds(name, emoji)').eq('is_live', true);
  if (worldId) query = query.eq('world_id', worldId);
  const { data, error } = await query.order('listener_count', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createRoom(worldId: string, hostId: string, title: string, hostName = '') {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ world_id: worldId, host_id: hostId, title, host_name: hostName, speaker_count: 1 })
    .select()
    .single();
  if (error) throw error;

  // Add host as participant
  await supabase.from('room_participants').insert({
    room_id: data.id, user_id: hostId, role: 'host', is_muted: false,
  });
  return data;
}

export async function joinRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_participants')
    .upsert({ room_id: roomId, user_id: userId, role: 'listener' });
  if (!error) {
    await supabase.rpc('increment_room_listeners', { room_id: roomId });
  }
  return { error };
}

export async function leaveRoom(roomId: string, userId: string) {
  await supabase
    .from('room_participants')
    .delete()
    .match({ room_id: roomId, user_id: userId });
}

export async function setParticipantMuted(roomId: string, userId: string, isMuted: boolean) {
  await supabase
    .from('room_participants')
    .update({ is_muted: isMuted })
    .match({ room_id: roomId, user_id: userId });
}

export async function promoteToSpeaker(roomId: string, userId: string) {
  await supabase
    .from('room_participants')
    .update({ role: 'speaker', is_muted: false })
    .match({ room_id: roomId, user_id: userId });
}

// ===== CONVERSATIONS =====

export async function fetchConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user_a_profile:users!conversations_user_a_fkey(*),
      user_b_profile:users!conversations_user_b_fkey(*)
    `)
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((c: any) => ({
    ...c,
    otherUser: c.user_a === userId ? c.user_b_profile : c.user_a_profile,
    unreadCount: c.user_a === userId ? c.unread_count_a : c.unread_count_b,
    isPinned: c.user_a === userId ? c.is_pinned_a : c.is_pinned_b,
  }));
}

export async function fetchMessages(conversationId: string, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(id, display_name, photos, vip_level)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
}

export async function sendMessage(conversationId: string, senderId: string, content: string, type = 'text') {
  // Silent redaction — sender sees success, receiver sees redacted version
  const filtered = type === 'text' ? filterChatMessage(content) : null;
  const storedContent = filtered?.redactedContent ?? content;

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content: storedContent, message_type: type })
    .select()
    .single();
  if (error) throw error;

  // Update conversation preview with redacted content
  await supabase
    .from('conversations')
    .update({ last_message: storedContent, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

export async function markMessagesRead(conversationId: string, userId: string) {
  // Mark messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId);

  // Reset unread counter
  const { data: conv } = await supabase
    .from('conversations')
    .select('user_a, user_b')
    .eq('id', conversationId)
    .single();

  if (conv) {
    const field = conv.user_a === userId ? 'unread_count_a' : 'unread_count_b';
    await supabase.from('conversations').update({ [field]: 0 }).eq('id', conversationId);
  }
}

export async function getOrCreateConversation(userA: string, userB: string) {
  // Check if conversation exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_a: userA, user_b: userB })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== SPARK MATCHES =====

export async function fetchSparkMatches(userId: string) {
  const { data, error } = await supabase
    .from('spark_matches')
    .select('*, user_a_profile:users!spark_matches_user_a_fkey(*), user_b_profile:users!spark_matches_user_b_fkey(*)')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'matched')
    .order('sparked_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    ...m,
    matchedUser: m.user_a === userId ? m.user_b_profile : m.user_a_profile,
  }));
}

export async function createSpark(fromId: string, toId: string, score: number) {
  // Check if reciprocal spark exists
  const { data: existing } = await supabase
    .from('spark_matches')
    .select('*')
    .eq('user_a', toId)
    .eq('user_b', fromId)
    .eq('status', 'pending')
    .single();

  if (existing) {
    // It's a match!
    await supabase.from('spark_matches').update({ status: 'matched' }).eq('id', existing.id);
    return { matched: true, matchId: existing.id };
  }

  const { data, error } = await supabase
    .from('spark_matches')
    .insert({ user_a: fromId, user_b: toId, match_score: score, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
    .select()
    .single();
  if (error) throw error;
  return { matched: false, sparkId: data.id };
}

// ===== SAY HI REQUESTS =====

export async function sendSayHi(senderId: string, receiverId: string, message: string, vpCost = 0) {
  // Silent redaction on Say Hi messages
  const filtered = filterChatMessage(message);
  const { data, error } = await supabase
    .from('say_hi_requests')
    .insert({ sender_id: senderId, receiver_id: receiverId, message: filtered.redactedContent, vp_cost: vpCost })
    .select()
    .single();
  if (error) throw error;

  // Deduct VP if needed
  if (vpCost > 0) {
    await deductVP(senderId, vpCost, 'say_hi', `Say Hi to user`);
  }
  return data;
}

export async function fetchSayHiRequests(userId: string) {
  const { data, error } = await supabase
    .from('say_hi_requests')
    .select('*, sender:users!say_hi_requests_sender_id_fkey(*)')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function respondToSayHi(requestId: string, accept: boolean) {
  const { error } = await supabase
    .from('say_hi_requests')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', requestId);
  return { error };
}

// ===== SOCIAL =====

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  return { error };
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
  return { error };
}

export async function fetchSocialStats(userId: string) {
  const [friends, following, followers, visitors] = await Promise.all([
    supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`user_id.eq.${userId},friend_id.eq.${userId}`).eq('status', 'accepted'),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('target_user_id', userId),
  ]);
  return {
    friends: friends.count || 0,
    following: following.count || 0,
    followers: followers.count || 0,
    visitors: visitors.count || 0,
  };
}

export async function recordProfileView(viewerId: string, targetId: string) {
  if (viewerId === targetId) return;
  await supabase.from('profile_views').insert({ viewer_id: viewerId, target_user_id: targetId });
}

// ===== VP & GIFTS =====

export async function deductVP(userId: string, amount: number, type: string, description: string) {
  // Atomic VP decrement via RPC
  await supabase.rpc('deduct_vp', { p_user_id: userId, p_amount: amount });

  await supabase.from('vp_transactions').insert({
    user_id: userId, amount: -amount, type, description,
  });
}

export async function addVP(userId: string, amount: number, type: string, description: string) {
  await supabase.rpc('add_vp', { p_user_id: userId, p_amount: amount });
  await supabase.from('vp_transactions').insert({
    user_id: userId, amount, type, description,
  });
}

export async function fetchGiftsCatalog() {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function sendGift(senderId: string, receiverId: string, giftId: string, vpAmount: number) {
  // Record transaction
  await supabase.from('gift_transactions').insert({
    sender_id: senderId, receiver_id: receiverId, gift_id: giftId, vp_amount: vpAmount,
  });

  // Deduct VP from sender
  await deductVP(senderId, vpAmount, 'gift_sent', 'Gift sent');

  // Get receiver's VIP level for gift earning rate
  const { data: receiver } = await supabase.from('users').select('vip_level').eq('id', receiverId).single();
  const earningRate = getGiftEarningRate(receiver?.vip_level ?? 0);
  const earnedVp = Math.round(vpAmount * (earningRate / 100));

  // Credit earnings to receiver based on their VIP gift earning rate
  await supabase.from('user_earnings').upsert({
    user_id: receiverId,
    balance_earned_vp: earnedVp,
    total_lifetime_earned_vp: earnedVp,
  }, { onConflict: 'user_id' });

  // Add XP to sender (gift VP spending = 1.5x XP)
  await addXP(senderId, Math.round(vpAmount * 1.5));
}

export async function fetchVPTransactions(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('vp_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// ===== VIP / XP =====

export async function addXP(userId: string, xpAmount: number) {
  const { data: user } = await supabase.from('users').select('total_xp, monthly_xp, vip_level').eq('id', userId).single();
  if (!user) return;

  const newTotalXp = (user.total_xp || 0) + xpAmount;
  const newMonthlyXp = (user.monthly_xp || 0) + xpAmount;

  // Check for level up
  const VIP_THRESHOLDS = [0, 1000, 5000, 15000, 40000, 100000, 250000, 500000, 1000000];
  let newLevel = user.vip_level;
  for (let i = VIP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (newTotalXp >= VIP_THRESHOLDS[i]) {
      newLevel = i;
      break;
    }
  }

  await supabase.from('users').update({
    total_xp: newTotalXp,
    monthly_xp: newMonthlyXp,
    vip_level: newLevel,
  }).eq('id', userId);
}

// ===== CHALLENGES =====

export async function fetchDailyChallenges() {
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return data || [];
}

export async function fetchUserChallenges(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenge:daily_challenges(*)')
    .eq('user_id', userId)
    .eq('assigned_date', today);
  if (error) throw error;
  return data || [];
}

export async function updateChallengeProgress(userId: string, challengeId: string, progress: number) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('user_challenges')
    .upsert({
      user_id: userId,
      challenge_id: challengeId,
      progress,
      assigned_date: today,
    }, { onConflict: 'user_id,challenge_id,assigned_date' });
  return { error };
}

// ===== INVENTORY =====

export async function fetchInventory(userId: string) {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function equipItem(itemId: string, userId: string) {
  // Unequip all same-type items first
  const { data: item } = await supabase.from('user_inventory').select('item_type').eq('id', itemId).single();
  if (item) {
    await supabase.from('user_inventory').update({ is_equipped: false }).eq('user_id', userId).eq('item_type', item.item_type);
  }
  await supabase.from('user_inventory').update({ is_equipped: true }).eq('id', itemId);
}

// ===== ACHIEVEMENTS =====

export async function fetchAchievements(userId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ===== EARNINGS =====

export async function fetchEarnings(userId: string) {
  const { data, error } = await supabase
    .from('user_earnings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || { balance_earned_vp: 0, total_lifetime_earned_vp: 0 };
}

// ===== CONVERSATION HELPERS =====

/** Returns true if the two users in a conversation are not friends (stranger context). */
export async function isStrangerConversation(conversationId: string, userId: string): Promise<boolean> {
  const { data: conv } = await supabase
    .from('conversations')
    .select('user_a, user_b')
    .eq('id', conversationId)
    .single();
  if (!conv) return false;
  const otherId = conv.user_a === userId ? conv.user_b : conv.user_a;
  const { count } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .or(`and(user_id.eq.${userId},friend_id.eq.${otherId}),and(user_id.eq.${otherId},friend_id.eq.${userId})`)
    .eq('status', 'accepted');
  return (count ?? 0) === 0;
}

// ===== LEADERBOARD =====

export async function fetchXPLeaderboard(filter: 'global' | 'city', city?: string | null, limit = 20) {
  let query = supabase
    .from('users')
    .select('id, display_name, avatar_url, photos, total_xp, vip_level, city')
    .order('total_xp', { ascending: false })
    .limit(limit);
  if (filter === 'city' && city) {
    query = query.ilike('city', city);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchUserXPRank(userId: string, filter: 'global' | 'city', city?: string | null): Promise<number> {
  const { data: me } = await supabase.from('users').select('total_xp').eq('id', userId).single();
  if (!me) return 0;
  let query = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gt('total_xp', me.total_xp);
  if (filter === 'city' && city) {
    query = query.ilike('city', city);
  }
  const { count } = await query;
  return (count ?? 0) + 1;
}

// ===== BLOCKS & REPORTS =====

export async function blockUser(blockerId: string, blockedId: string) {
  await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function reportUser(reporterId: string, reportedId: string, reason: string, details?: string) {
  await supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_user_id: reportedId,
    reason,
    details: details || '',
  });
}

// ===== MESSAGES: ADVANCED FEATURES =====

/** Fetch messages including reactions (use instead of fetchMessages in conversation page) */
export async function fetchMessagesWithReactions(conversationId: string, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(id, display_name, photos, vip_level), reactions:message_reactions(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
}

/** Send a view-once (vault) message */
export async function sendVaultMessage(conversationId: string, senderId: string, content: string, type = 'text') {
  // Silent redaction on vault messages too
  const filtered = type === 'text' ? filterChatMessage(content) : null;
  const storedContent = filtered?.redactedContent ?? content;

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content: storedContent, message_type: type, is_vault: true })
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from('conversations')
    .update({ last_message: '🔒 View once', last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
  return data;
}

/** Edit a message. Caller must verify time window before calling. */
export async function editMessage(messageId: string, newContent: string, editorId: string) {
  // Silent redaction on edited content
  const filtered = filterChatMessage(newContent);
  const redacted = filtered.redactedContent;

  const { data: msg } = await supabase
    .from('messages')
    .select('content, original_content')
    .eq('id', messageId)
    .single();
  if (!msg) throw new Error('Message not found');

  await supabase.from('message_edits').insert({
    message_id: messageId,
    previous_content: msg.content,
    editor_id: editorId,
  });

  const updates: Record<string, unknown> = {
    content: redacted,
    edited_at: new Date().toISOString(),
  };
  if (!msg.original_content) updates.original_content = msg.content;

  const { error } = await supabase.from('messages').update(updates).eq('id', messageId);
  if (error) throw error;
}

/**
 * Delete / revoke a message.
 * "for_everyone" — is_revoked + clears content. Sender only; caller enforces time window.
 * "for_me_sender" — sets delete_for_sender_at. No content change.
 * "for_me_recipient" — sets delete_for_recipient_at. No content change.
 */
export async function revokeMessage(
  messageId: string,
  mode: 'for_everyone' | 'for_me_sender' | 'for_me_recipient',
) {
  if (mode === 'for_everyone') {
    await supabase
      .from('messages')
      .update({ is_revoked: true, content: null })
      .eq('id', messageId);
  } else if (mode === 'for_me_sender') {
    await supabase
      .from('messages')
      .update({ delete_for_sender_at: new Date().toISOString() })
      .eq('id', messageId);
  } else {
    await supabase
      .from('messages')
      .update({ delete_for_recipient_at: new Date().toISOString() })
      .eq('id', messageId);
  }
}

/** Mark a vault message as opened. Only call once (caller checks view_once_opened_at). */
export async function openVaultMessage(messageId: string, userId: string) {
  const { error } = await supabase.from('messages').update({
    view_once_opened_at: new Date().toISOString(),
    view_once_opened_by: userId,
  }).eq('id', messageId);
  if (error) throw error;
}

/** Upsert a reaction — replaces any existing reaction from this user on this message. */
export async function addReaction(messageId: string, userId: string, emoji: string) {
  await supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: userId });
  const { error } = await supabase.from('message_reactions').insert({ message_id: messageId, user_id: userId, emoji });
  if (error) throw error;
}

/** Remove the current user's reaction from a message. */
export async function removeReaction(messageId: string, userId: string) {
  await supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: userId });
}

/**
 * Forward a message to another conversation.
 * Vault and gift messages are rejected. Caller handles VP cost for strangers.
 */
export async function forwardMessage(
  messageId: string,
  targetConversationId: string,
  senderId: string,
) {
  const { data: original, error } = await supabase
    .from('messages')
    .select('content, message_type, is_vault')
    .eq('id', messageId)
    .single();
  if (error || !original) throw error ?? new Error('Message not found');
  if (original.is_vault) throw new Error('Vault messages cannot be forwarded');
  if (original.message_type === 'gift') throw new Error('Gift messages cannot be forwarded');

  // Silent redaction on forwarded content (original may predate the filter)
  const filtered = original.message_type === 'text' && original.content
    ? filterChatMessage(original.content) : null;
  const forwardedContent = filtered?.redactedContent ?? original.content;

  const { data, error: insertErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: targetConversationId,
      sender_id: senderId,
      content: forwardedContent,
      message_type: original.message_type,
      is_forwarded: true,
    })
    .select()
    .single();
  if (insertErr) throw insertErr;

  await supabase
    .from('conversations')
    .update({ last_message: forwardedContent, last_message_at: new Date().toISOString() })
    .eq('id', targetConversationId);

  return data;
}

// ===== REALTIME SUBSCRIPTIONS =====

/** @deprecated — use subscribeToMessageUpdates for INSERT + UPDATE coverage */
export function subscribeToMessages(conversationId: string, callback: (msg: any) => void) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload: any) => callback(payload.new))
    .subscribe();
}

/**
 * Subscribe to INSERT + UPDATE on messages in a conversation.
 * UPDATE covers edits, revokes, vault opens — propagates automatically to both clients.
 */
export function subscribeToMessageUpdates(
  conversationId: string,
  onInsert: (msg: any) => void,
  onUpdate: (msg: any) => void,
) {
  return supabase
    .channel(`messages-v2:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload: any) => onInsert(payload.new))
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    }, (payload: any) => onUpdate(payload.new))
    .subscribe();
}

/**
 * Subscribe to reaction changes. Client filters by known message IDs.
 * RLS on message_reactions ensures only authorized events arrive.
 */
export function subscribeToReactions(
  onInsert: (r: any) => void,
  onDelete: (r: any) => void,
) {
  return supabase
    .channel(`reactions-${Math.random()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' },
      (payload: any) => onInsert(payload.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' },
      (payload: any) => onDelete(payload.old))
    .subscribe();
}

export function subscribeToConversations(userId: string, callback: (conv: any) => void) {
  return supabase
    .channel(`conversations:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
    }, (payload: any) => callback(payload.new))
    .subscribe();
}
