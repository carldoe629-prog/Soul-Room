import { createClient } from './supabase';
// getGiftEarningRate is no longer needed client-side — calculation moved to send_gift_secure RPC
import { filterChatMessage } from './moderation/contact-detector';

const supabase = createClient();

// ===== USERS =====

// Safe column list for public profile viewing — excludes email, internal flags
const USER_PROFILE_COLUMNS = `
  id, display_name, gender, age, bio, city, country, photos, interests, languages,
  looking_for, occupation, home_world, subscription_tier, vibe_points, vip_level,
  total_xp, trust_score, vibe_rating, vibe_rating_count, is_verified, is_online,
  last_online_at, profile_completeness, referral_code, avatar_url, updated_at,
  ghost_mode_enabled, hide_last_seen, is_founder
`;

// Minimal columns for listing other users (discover, nearby, leaderboard)
const USER_LIST_COLUMNS = `
  id, display_name, gender, age, bio, city, country, photos, interests,
  is_verified, is_online, last_online_at, vip_level, avatar_url
`;

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(USER_PROFILE_COLUMNS)
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchNearbyUsers(filters?: { gender?: string; limit?: number }) {
  let query = supabase
    .from('users')
    .select(USER_LIST_COLUMNS)
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
    await supabase.rpc('increment_room_listeners', { p_room_id: roomId });
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
  const { error } = await supabase.rpc('promote_to_speaker', {
    p_room_id: roomId,
    p_user_id: userId,
  });
  if (error) throw error;
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

export async function sendMessage(conversationId: string, senderId: string, content: string, type = 'text', isFounder = false) {
  // Silent redaction — sender sees success, receiver sees redacted version (founders bypass)
  const filtered = type === 'text' && !isFounder ? filterChatMessage(content) : null;
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
  // CRIT-08 Fix: Uses atomic RPC to prevent duplicate pending sparks and race conditions on matching
  const { data, error } = await supabase.rpc('create_spark_secure', {
    p_from_id: fromId,
    p_to_id: toId,
    p_score: score
  });
  
  if (error) throw error;
  
  if (data?.matched) {
    return { matched: true, matchId: data.match_id };
  }
  return { matched: false, sparkId: data.spark_id };
}

// ===== SAY HI REQUESTS =====

export async function sendSayHi(senderId: string, receiverId: string, message: string, vpCost = 0, isFounder = false) {
  // Silent redaction on Say Hi messages (founders bypass)
  const filtered = isFounder ? { redactedContent: message } : filterChatMessage(message);
  
  // High-07 Fix: Route through RPC to guarantee VP deduction + insert atomically
  const { data, error } = await supabase.rpc('send_say_hi_secure', {
    p_receiver_id: receiverId,
    p_message: filtered.redactedContent,
    p_vp_cost: vpCost
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  
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
  const { data: success, error } = await supabase.rpc('deduct_vp_secure', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
  });
  if (error) throw error;
  if (!success) throw new Error('Insufficient Vibe Points');
}

export async function addVP(userId: string, amount: number, type: string, description: string) {
  const { error } = await supabase.rpc('add_vp_secure', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
  });
  if (error) throw error;
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
  // All gift logic now runs in a single atomic server-side RPC
  // This prevents race conditions, VP manipulation, and fake earnings
  const { data, error } = await supabase.rpc('send_gift_secure', {
    p_sender_id: senderId,
    p_receiver_id: receiverId,
    p_gift_id: giftId,
    p_vp_amount: vpAmount,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
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

// ===== DAILY REWARD =====

export interface DailyRewardResult {
  alreadyClaimed: boolean;
  vpAwarded: number;
  bonusVp: number;
  totalVp: number;
  streak: number;
  streakMilestone: boolean;
  nextRewardAt: string;
}

export async function claimDailyReward(userId: string): Promise<DailyRewardResult> {
  const { data, error } = await supabase.rpc('claim_daily_reward', { p_user_id: userId });
  if (error) throw error;

  const result = data as {
    already_claimed: boolean;
    streak: number;
    vp_awarded: number;
    bonus_vp: number;
    total_vp: number;
    xp_awarded?: number;
    streak_milestone?: boolean;
    error?: string;
  };

  if (result.error) throw new Error(result.error);

  // Calculate next reward time (midnight tomorrow)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (result.already_claimed) {
    return {
      alreadyClaimed: true,
      vpAwarded: 0,
      bonusVp: 0,
      totalVp: 0,
      streak: result.streak,
      streakMilestone: false,
      nextRewardAt: tomorrow.toISOString(),
    };
  }

  // VP + XP are both awarded atomically inside the RPC — no client-side XP calls needed

  return {
    alreadyClaimed: false,
    vpAwarded: result.vp_awarded,
    bonusVp: result.bonus_vp,
    totalVp: result.total_vp,
    streak: result.streak,
    streakMilestone: result.bonus_vp > 0,
    nextRewardAt: tomorrow.toISOString(),
  };
}

// ===== VIP / XP =====

// Securely add XP (now uses SQL RPC)
export async function addXP(userId: string, xpAmount: number) {
  const { error } = await supabase.rpc('add_xp_secure', {
    p_user_id: userId,
    p_amount: xpAmount,
  });
  if (error) throw error;
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
  // HIGH-10 Fix: Uses atomic RPC to unequip previous item and equip new one
  const { error } = await supabase.rpc('equip_item_secure', {
    p_item_id: itemId,
    p_user_id: userId
  });
  if (error) throw error;
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

/** Upload a vault file to the PRIVATE vaults bucket. Returns the storage path (NOT a public URL). */
export async function uploadVaultFile(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/vault_${Date.now()}.${ext}`;
  
  const { error } = await supabase.storage
    .from('vaults')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  
  return path; // Just the path — NOT a public URL
}

/** Send a view-once (vault) message. For images, content is the private storage path. */
export async function sendVaultMessage(conversationId: string, senderId: string, content: string, type = 'text', isFounder = false) {
  // Silent redaction on vault text messages (founders bypass)
  const filtered = type === 'text' && !isFounder ? filterChatMessage(content) : null;
  // For images, content is the storage path — don't redact it
  const storedContent = type === 'text' ? (filtered?.redactedContent ?? content) : content;

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
export async function editMessage(messageId: string, newContent: string, editorId: string, isFounder = false) {
  // Silent redaction on edited content (founders bypass)
  const filtered = isFounder ? { redactedContent: newContent } : filterChatMessage(newContent);
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

/**
 * Open a vault message securely via Edge Function.
 * The Edge Function verifies permissions, marks opened server-side, and returns a short-lived signed URL.
 * Returns { signedUrl?, content?, messageType, expiresInSeconds } or throws on error.
 */
export async function openVaultMessage(messageId: string, _userId: string): Promise<{
  signedUrl?: string;
  content?: string;
  messageType: string;
  expiresInSeconds: number;
}> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const res = await fetch(`${supabaseUrl}/functions/v1/get-vault-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnon,
    },
    body: JSON.stringify({ messageId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Vault access denied' }));
    throw new Error(err.error || `Vault error: ${res.status}`);
  }

  return res.json();
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
