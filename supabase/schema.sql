-- ============================================================
-- SOUL ROOM — Complete Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text not null default '',
  gender              text not null default '',
  age                 int,
  bio                 text default '',
  city                text default '',
  country             text default '',
  photos              text[] default '{}',
  interests           text[] default '{}',
  languages           text[] default '{}',
  looking_for         text default '',
  occupation          text default '',
  home_world          text default '',
  subscription_tier   text not null default 'free',
  vibe_points         int not null default 0,
  vip_level           int not null default 0,
  total_xp            int not null default 0,
  monthly_xp          int not null default 0,
  trust_score         int not null default 50,
  vibe_rating         numeric(3,1) not null default 0,
  vibe_rating_count   int not null default 0,
  is_founder          boolean not null default false,
  is_verified         boolean not null default false,
  is_online           boolean not null default false,
  last_online_at      timestamptz,
  login_streak        int not null default 0,
  last_login_date     date,
  profile_completeness int not null default 0,
  referral_code       text unique,
  avatar_url          text,
  ghost_mode_enabled  boolean not null default false,
  hide_last_seen      boolean not null default false,
  invisible_browsing  boolean not null default false,
  read_receipt_control boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);


-- ============================================================
-- 2. WORLDS
-- ============================================================
create table if not exists public.worlds (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  emoji             text not null default '🌍',
  description       text default '',
  member_count      int not null default 0,
  active_room_count int not null default 0,
  color_primary     text default '#FF4B6E',
  color_secondary   text default '#8B5CF6',
  topics            text[] default '{}',
  category          text not null default 'General',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Add columns that may be missing if table already existed
alter table public.worlds add column if not exists color_primary text default '#FF4B6E';
alter table public.worlds add column if not exists color_secondary text default '#8B5CF6';
alter table public.worlds add column if not exists topics text[] default '{}';
alter table public.worlds add column if not exists is_active boolean not null default true;

alter table public.worlds enable row level security;
create policy "Anyone can read worlds" on public.worlds for select using (true);


-- ============================================================
-- 3. ROOMS
-- ============================================================
create table if not exists public.rooms (
  id             uuid primary key default uuid_generate_v4(),
  world_id       uuid references public.worlds(id) on delete cascade,
  host_id        uuid references public.users(id) on delete cascade,
  host_name      text not null default '',
  title          text not null,
  is_live        boolean not null default true,
  speaker_count  int not null default 1,
  listener_count int not null default 0,
  created_at     timestamptz not null default now(),
  ended_at       timestamptz
);

alter table public.rooms enable row level security;
create policy "Anyone can read rooms" on public.rooms for select using (true);
create policy "Authenticated users can create rooms" on public.rooms
  for insert with check (auth.uid() = host_id);
create policy "Host can update their room" on public.rooms
  for update using (auth.uid() = host_id);


-- ============================================================
-- 4. ROOM PARTICIPANTS
-- ============================================================
create table if not exists public.room_participants (
  id         uuid primary key default uuid_generate_v4(),
  room_id    uuid not null references public.rooms(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'listener' check (role in ('host', 'speaker', 'listener')),
  is_muted   boolean not null default false,
  joined_at  timestamptz not null default now(),
  unique(room_id, user_id)
);

alter table public.room_participants enable row level security;
create policy "Anyone can read room participants" on public.room_participants for select using (true);
create policy "Users can join rooms" on public.room_participants
  for insert with check (auth.uid() = user_id);
create policy "Users can update own participation" on public.room_participants
  for update using (auth.uid() = user_id);
create policy "Users can leave rooms" on public.room_participants
  for delete using (auth.uid() = user_id);


-- ============================================================
-- 5. ROOM MESSAGES
-- ============================================================
create table if not exists public.room_messages (
  id           uuid primary key default uuid_generate_v4(),
  room_id      uuid not null references public.rooms(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  display_name text not null default '',
  content      text not null,
  created_at   timestamptz not null default now()
);

alter table public.room_messages enable row level security;
create policy "Anyone can read room messages" on public.room_messages for select using (true);
create policy "Authenticated users can send room messages" on public.room_messages
  for insert with check (auth.uid() = user_id);


-- ============================================================
-- 6. CONVERSATIONS
-- ============================================================
create table if not exists public.conversations (
  id              uuid primary key default uuid_generate_v4(),
  user_a          uuid not null references public.users(id) on delete cascade,
  user_b          uuid not null references public.users(id) on delete cascade,
  status          text not null default 'active' check (status in ('active', 'blocked', 'archived')),
  last_message    text default '',
  last_message_at timestamptz default now(),
  unread_count_a  int not null default 0,
  unread_count_b  int not null default 0,
  is_pinned_a     boolean not null default false,
  is_pinned_b     boolean not null default false,
  created_at      timestamptz not null default now(),
  unique(user_a, user_b)
);

alter table public.conversations enable row level security;
create policy "Users can read their conversations" on public.conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "Users can create conversations" on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);
create policy "Users can update their conversations" on public.conversations
  for update using (auth.uid() = user_a or auth.uid() = user_b);


-- ============================================================
-- 7. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.users(id) on delete cascade,
  content         text not null,
  message_type    text not null default 'text' check (message_type in ('text', 'voice', 'image', 'gift')),
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;
create policy "Users can read messages in their conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );
create policy "Users can send messages in their conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );
create policy "Users can update their own messages" on public.messages
  for update using (
    auth.uid() = sender_id
  );


-- ============================================================
-- 7a. MESSAGE REACTIONS
-- ============================================================
create table if not exists public.message_reactions (
  id              uuid primary key default uuid_generate_v4(),
  message_id      uuid not null references public.messages(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  emoji           text not null,
  created_at      timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

alter table public.message_reactions enable row level security;

create policy "Users can read reactions in their conversations" on public.message_reactions
  for select using (
    exists (
      select 1 from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = message_id
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "Users can add reactions in their conversations" on public.message_reactions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = message_id
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "Users can remove their own reactions" on public.message_reactions
  for delete using (auth.uid() = user_id);


-- ============================================================
-- 7b. MESSAGE EDITS (audit trail)
-- ============================================================
create table if not exists public.message_edits (
  id              uuid primary key default uuid_generate_v4(),
  message_id      uuid not null references public.messages(id) on delete cascade,
  old_content     text not null,
  new_content     text not null,
  edited_by       uuid not null references public.users(id) on delete cascade,
  edited_at       timestamptz not null default now()
);

alter table public.message_edits enable row level security;

create policy "Users can read edits in their conversations" on public.message_edits
  for select using (
    exists (
      select 1 from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.id = message_id
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "Users can insert edits for their own messages" on public.message_edits
  for insert with check (
    auth.uid() = edited_by
    and exists (
      select 1 from public.messages m
      where m.id = message_id and m.sender_id = auth.uid()
    )
  );


-- ============================================================
-- 8. SPARK MATCHES
-- ============================================================
create table if not exists public.spark_matches (
  id          uuid primary key default uuid_generate_v4(),
  user_a      uuid not null references public.users(id) on delete cascade,
  user_b      uuid not null references public.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'matched', 'expired', 'passed')),
  match_score int not null default 0,
  sparked_at  timestamptz not null default now(),
  expires_at  timestamptz
);

alter table public.spark_matches enable row level security;
create policy "Users can read their spark matches" on public.spark_matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "Users can create sparks" on public.spark_matches
  for insert with check (auth.uid() = user_a);
create policy "Users can update sparks" on public.spark_matches
  for update using (auth.uid() = user_a or auth.uid() = user_b);


-- ============================================================
-- 9. SAY HI REQUESTS
-- ============================================================
create table if not exists public.say_hi_requests (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  message     text not null default '',
  vp_cost     int not null default 0,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now()
);

alter table public.say_hi_requests enable row level security;
create policy "Users can read their say hi requests" on public.say_hi_requests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send say hi" on public.say_hi_requests
  for insert with check (auth.uid() = sender_id);
create policy "Receiver can respond" on public.say_hi_requests
  for update using (auth.uid() = receiver_id);


-- ============================================================
-- 10. FOLLOWS
-- ============================================================
create table if not exists public.follows (
  id           uuid primary key default uuid_generate_v4(),
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;
create policy "Anyone can read follows" on public.follows for select using (true);
create policy "Users can follow" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows
  for delete using (auth.uid() = follower_id);


-- ============================================================
-- 11. FRIENDSHIPS
-- ============================================================
create table if not exists public.friendships (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  friend_id  uuid not null references public.users(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

alter table public.friendships enable row level security;
create policy "Users can read their friendships" on public.friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can create friendships" on public.friendships
  for insert with check (auth.uid() = user_id);
create policy "Users can update friendships" on public.friendships
  for update using (auth.uid() = user_id or auth.uid() = friend_id);


-- ============================================================
-- 12. PROFILE VIEWS
-- ============================================================
create table if not exists public.profile_views (
  id             uuid primary key default uuid_generate_v4(),
  viewer_id      uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

alter table public.profile_views enable row level security;
create policy "Users can read views of their profile" on public.profile_views
  for select using (auth.uid() = target_user_id or auth.uid() = viewer_id);
create policy "Users can record views" on public.profile_views
  for insert with check (auth.uid() = viewer_id);


-- ============================================================
-- 13. VP TRANSACTIONS
-- ============================================================
create table if not exists public.vp_transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  amount      int not null,
  type        text not null,
  description text default '',
  created_at  timestamptz not null default now()
);

alter table public.vp_transactions enable row level security;
create policy "Users can read their VP transactions" on public.vp_transactions
  for select using (auth.uid() = user_id);
create policy "System can insert VP transactions" on public.vp_transactions
  for insert with check (auth.uid() = user_id);


-- ============================================================
-- 14. GIFTS CATALOG
-- ============================================================
create table if not exists public.gifts (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  emoji          text not null default '🎁',
  vp_cost        int not null,
  usd_equivalent numeric(10,2) not null default 0,
  tier           int not null default 1,
  sort_order     int not null default 0,
  is_active      boolean not null default true
);

alter table public.gifts enable row level security;
create policy "Anyone can read gifts catalog" on public.gifts for select using (true);


-- ============================================================
-- 15. GIFT TRANSACTIONS
-- ============================================================
create table if not exists public.gift_transactions (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  gift_id     text not null,
  vp_amount   int not null,
  created_at  timestamptz not null default now()
);

alter table public.gift_transactions enable row level security;
create policy "Users can read their gift transactions" on public.gift_transactions
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send gifts" on public.gift_transactions
  for insert with check (auth.uid() = sender_id);


-- ============================================================
-- 16. USER EARNINGS
-- ============================================================
create table if not exists public.user_earnings (
  user_id                  uuid primary key references public.users(id) on delete cascade,
  balance_earned_vp        int not null default 0,
  total_lifetime_earned_vp int not null default 0,
  updated_at               timestamptz not null default now()
);

alter table public.user_earnings enable row level security;
create policy "Users can read their earnings" on public.user_earnings
  for select using (auth.uid() = user_id);
create policy "System can upsert earnings" on public.user_earnings
  for all using (auth.uid() = user_id);


-- ============================================================
-- 17. DAILY CHALLENGES
-- ============================================================
create table if not exists public.daily_challenges (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  description    text default '',
  emoji          text not null default '🎯',
  target_count   int not null default 1,
  reward_vp      int not null default 100,
  challenge_type text not null default 'general',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Add columns that may be missing if table already existed
alter table public.daily_challenges add column if not exists target_count int not null default 1;
alter table public.daily_challenges add column if not exists challenge_type text not null default 'general';
alter table public.daily_challenges add column if not exists is_active boolean not null default true;

alter table public.daily_challenges enable row level security;
create policy "Anyone can read challenges" on public.daily_challenges for select using (true);


-- ============================================================
-- 18. USER CHALLENGES (progress)
-- ============================================================
create table if not exists public.user_challenges (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  challenge_id  uuid not null references public.daily_challenges(id) on delete cascade,
  progress      int not null default 0,
  assigned_date date not null default current_date,
  completed_at  timestamptz,
  unique(user_id, challenge_id, assigned_date)
);

alter table public.user_challenges enable row level security;
create policy "Users can read their challenges" on public.user_challenges
  for select using (auth.uid() = user_id);
create policy "System can upsert user challenges" on public.user_challenges
  for all using (auth.uid() = user_id);


-- ============================================================
-- 19. USER INVENTORY
-- ============================================================
create table if not exists public.user_inventory (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  item_type   text not null,
  item_id     text not null,
  is_equipped boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.user_inventory enable row level security;
create policy "Users can read their inventory" on public.user_inventory
  for select using (auth.uid() = user_id);
create policy "Users can manage their inventory" on public.user_inventory
  for all using (auth.uid() = user_id);


-- ============================================================
-- 20. USER ACHIEVEMENTS
-- ============================================================
create table if not exists public.user_achievements (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  achievement_id   text not null,
  achievement_name text not null default '',
  earned_at        timestamptz not null default now()
);

alter table public.user_achievements enable row level security;
create policy "Users can read their achievements" on public.user_achievements
  for select using (auth.uid() = user_id);
create policy "System can insert achievements" on public.user_achievements
  for insert with check (auth.uid() = user_id);


-- ============================================================
-- 21. BLOCKS
-- ============================================================
create table if not exists public.blocks (
  id         uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

alter table public.blocks enable row level security;
create policy "Users can read their blocks" on public.blocks
  for select using (auth.uid() = blocker_id);
create policy "Users can block" on public.blocks
  for insert with check (auth.uid() = blocker_id);
create policy "Users can unblock" on public.blocks
  for delete using (auth.uid() = blocker_id);


-- ============================================================
-- 22. REPORTS
-- ============================================================
create table if not exists public.reports (
  id               uuid primary key default uuid_generate_v4(),
  reporter_id      uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  reason           text not null,
  details          text default '',
  status           text not null default 'pending',
  created_at       timestamptz not null default now()
);

alter table public.reports enable row level security;
create policy "Users can submit reports" on public.reports
  for insert with check (auth.uid() = reporter_id);
create policy "Users can read their reports" on public.reports
  for select using (auth.uid() = reporter_id);


-- ============================================================
-- 23. RPC FUNCTIONS
-- ============================================================

-- Atomically deduct VP (auth-guarded: caller can only deduct from own account)
create or replace function public.deduct_vp(p_user_id uuid, p_amount int)
returns void language plpgsql security definer as $$
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized: cannot modify another user''s VP' using errcode = 'P0001';
  end if;
  if p_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0001';
  end if;
  update public.users
  set vibe_points = greatest(0, vibe_points - p_amount)
  where id = p_user_id;
end;
$$;

-- Atomically add VP (auth-guarded: caller can only add to own account)
create or replace function public.add_vp(p_user_id uuid, p_amount int)
returns void language plpgsql security definer as $$
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized: cannot modify another user''s VP' using errcode = 'P0001';
  end if;
  if p_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0001';
  end if;
  update public.users
  set vibe_points = vibe_points + p_amount
  where id = p_user_id;
end;
$$;

-- Increment room listener count
create or replace function public.increment_room_listeners(room_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.rooms
  set listener_count = listener_count + 1
  where id = room_id;
end;
$$;

-- Atomically claim daily reward — prevents double-claims via row lock
-- Returns: already_claimed, vp_awarded, bonus_vp, new_streak, account_age_days, is_founder
create or replace function public.claim_daily_reward(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  u record;
  today_str date := current_date;
  new_streak int := 1;
  days_diff int;
  account_age int;
  base_vp int;
  bonus_vp int := 0;
  total_vp int;
  login_xp int := 10;
  streak_xp int := 0;
  total_xp_award int;
  new_total_xp int;
  new_vip int;
begin
  -- Auth guard: only callable for own account
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized: cannot claim reward for another user' using errcode = 'P0001';
  end if;

  -- Lock the row to prevent concurrent claims
  select login_streak, last_login_date, created_at, is_founder
    into u
    from public.users
    where id = p_user_id
    for update;

  if not found then
    return jsonb_build_object('error', 'User not found');
  end if;

  -- Already claimed today?
  if u.last_login_date = today_str then
    return jsonb_build_object(
      'already_claimed', true,
      'streak', u.login_streak,
      'vp_awarded', 0,
      'bonus_vp', 0,
      'total_vp', 0,
      'is_founder', u.is_founder
    );
  end if;

  -- Calculate streak
  if u.last_login_date is not null then
    days_diff := today_str - u.last_login_date;
    if days_diff = 1 then
      new_streak := coalesce(u.login_streak, 0) + 1;
    end if;
    -- days_diff > 1 means broken streak, resets to 1
  end if;

  -- Account age in days
  account_age := today_str - u.created_at::date;

  -- Base VP by account age (founders always get max)
  if u.is_founder then
    base_vp := 100;
  elsif account_age <= 7 then
    base_vp := 100;
  elsif account_age <= 30 then
    base_vp := 75;
  else
    base_vp := 50;
  end if;

  -- Streak milestone bonuses
  case new_streak
    when 7  then bonus_vp := 500;
    when 14 then bonus_vp := 750;
    when 30 then bonus_vp := 1500;
    when 60 then bonus_vp := 2000;
    when 90 then bonus_vp := 3000;
    else bonus_vp := 0;
  end case;

  total_vp := base_vp + bonus_vp;

  -- Streak milestone XP bonuses
  case new_streak
    when 7  then streak_xp := 50;
    when 14 then streak_xp := 100;
    when 30 then streak_xp := 250;
    when 60 then streak_xp := 300;
    when 90 then streak_xp := 400;
    else streak_xp := 0;
  end case;
  total_xp_award := login_xp + streak_xp;

  -- Calculate new VIP level from total XP
  select total_xp + total_xp_award into new_total_xp from public.users where id = p_user_id;
  new_vip := case
    when new_total_xp >= 1000000 then 8
    when new_total_xp >= 500000  then 7
    when new_total_xp >= 250000  then 6
    when new_total_xp >= 100000  then 5
    when new_total_xp >= 40000   then 4
    when new_total_xp >= 15000   then 3
    when new_total_xp >= 5000    then 2
    when new_total_xp >= 1000    then 1
    else 0
  end;

  -- Credit VP + XP atomically
  update public.users
    set vibe_points = vibe_points + total_vp,
        total_xp = new_total_xp,
        monthly_xp = monthly_xp + total_xp_award,
        vip_level = new_vip,
        login_streak = new_streak,
        last_login_date = today_str
    where id = p_user_id;

  -- Record VP transaction
  insert into public.vp_transactions (user_id, amount, type, description)
  values (
    p_user_id,
    total_vp,
    'daily_reward',
    case when bonus_vp > 0
      then 'Day ' || new_streak || ' streak milestone 🔥 +' || bonus_vp || ' bonus VP'
      else 'Day ' || new_streak || ' login'
    end
  );

  return jsonb_build_object(
    'already_claimed', false,
    'streak', new_streak,
    'vp_awarded', base_vp,
    'bonus_vp', bonus_vp,
    'total_vp', total_vp,
    'xp_awarded', total_xp_award,
    'account_age_days', account_age,
    'is_founder', u.is_founder,
    'streak_milestone', bonus_vp > 0
  );
end;
$$;

-- Reset broken streaks — run daily via pg_cron at 02:00 UTC
-- Resets login_streak to 0 for users who missed yesterday
create or replace function public.reset_broken_streaks()
returns int language plpgsql security definer as $$
declare
  reset_count int;
begin
  update public.users
    set login_streak = 0
    where last_login_date < current_date - 1
      and login_streak > 0;

  get diagnostics reset_count = row_count;
  return reset_count;
end;
$$;


-- ============================================================
-- 24. AUTH TRIGGER — auto-create user row on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, referral_code, created_at, updated_at)
  values (
    new.id,
    'SR' || upper(substring(md5(random()::text), 1, 6)),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 25. SEED DATA — Worlds
-- ============================================================
insert into public.worlds (name, emoji, description, category, color_primary, color_secondary, topics, member_count) values
  ('Afrobeats & Highlife', '🎵', 'Discuss and celebrate African music', 'Music', '#FF4B6E', '#F59E0B', '{"afrobeats","highlife","amapiano","afropop"}', 12400),
  ('Naija Vibes', '🇳🇬', 'Everything Nigeria — culture, gist, life', 'Culture', '#008751', '#F59E0B', '{"nigeria","naija","pidgin","nollywood"}', 31200),
  ('Accra After Dark', '🌙', 'Ghana night life, events & connections', 'Lifestyle', '#CC0000', '#FCD116', '{"ghana","accra","events","nightlife"}', 8700),
  ('Diaspora Connect', '✈️', 'For Africans living abroad', 'Community', '#8B5CF6', '#EC4899', '{"diaspora","abroad","immigration","homesick"}', 19800),
  ('Spiritual Souls', '🙏', 'Faith, mindfulness and inner peace', 'Spirituality', '#7C3AED', '#A78BFA', '{"faith","prayer","meditation","spiritual"}', 6200),
  ('Hustle & Grind', '💼', 'Entrepreneurs, side hustles and business', 'Business', '#059669', '#34D399', '{"business","entrepreneurship","hustle","startup"}', 9100),
  ('Love Languages', '💕', 'Dating, relationships and love talk', 'Relationships', '#EC4899', '#F472B6', '{"dating","love","relationships","romance"}', 24600),
  ('Comedians Corner', '😂', 'Jokes, skits and African humour', 'Entertainment', '#F59E0B', '#FCD34D', '{"comedy","jokes","memes","skits"}', 11300),
  ('Sports Arena', '⚽', 'Football, basketball and all sports', 'Sports', '#2563EB', '#60A5FA', '{"football","basketball","sports","premier league"}', 28900),
  ('Tech & Innovation', '💻', 'African tech scene, coding and startups', 'Technology', '#0EA5E9', '#38BDF8', '{"tech","coding","startups","innovation"}', 7400)
on conflict do nothing;


-- ============================================================
-- 26. SEED DATA — Daily Challenges
-- ============================================================
insert into public.daily_challenges (title, description, emoji, target_count, reward_vp, challenge_type) values
  ('Daily Login', 'Log in to Soul Room today', '📅', 1, 100, 'general'),
  ('Send a Message', 'Send 3 messages to connections', '💬', 3, 150, 'social'),
  ('Join a Voice Room', 'Spend 10 minutes in a voice room', '🎤', 1, 300, 'rooms'),
  ('Send a Spark', 'Send 5 Sparks today', '⚡', 5, 200, 'spark'),
  ('Complete Your Profile', 'Fill in all profile sections', '✅', 1, 500, 'profile'),
  ('Welcome a Stranger', 'Send a Say Hi to someone new', '👋', 1, 120, 'social'),
  ('Explore a World', 'Visit 2 different Worlds', '🌍', 2, 180, 'explore')
on conflict do nothing;


-- ============================================================
-- 27. STORAGE — avatars bucket
-- Run separately in Supabase Dashboard → Storage if this fails
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
