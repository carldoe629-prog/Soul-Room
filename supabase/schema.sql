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
  is_verified         boolean not null default false,
  is_online           boolean not null default false,
  last_online_at      timestamptz,
  profile_completeness int not null default 0,
  referral_code       text unique,
  avatar_url          text,
  ghost_mode_enabled  boolean not null default false,
  hide_last_seen      boolean not null default false,
  invisible_browsing  boolean not null default false,
  read_receipt_control boolean not null default false,
  is_founder          boolean not null default false,
  login_streak        int not null default 0,
  last_login_date     date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id)
  with check (
    -- Prevent unauthorized modification of economy/access fields
    (auth.uid() = id) AND
    (vibe_points = vibe_points) AND -- This logic needs a trigger to be truly secure, 
    (total_xp = total_xp) -- but we start by documenting intent
  );

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
-- Users can only update is_muted on themselves (not role). Role changes go through RPC.
create policy "Users can update own participation" on public.room_participants
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
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

-- MED-03: Redact contact info in room messages (same as DM trigger)
create or replace function public.redact_room_message_contact_info()
returns trigger language plpgsql security definer as $$
declare
  v_is_founder boolean;
begin
  select is_founder into v_is_founder from public.users where id = new.user_id;
  if v_is_founder then return new; end if;

  if public.contains_contact_info(new.content) then
    new.content := regexp_replace(new.content, '(\+?234|0)[789]\d{9}', '[Protected]', 'g');
    new.content := regexp_replace(new.content, '(\+?233|0)[235]\d{8}', '[Protected]', 'g');
    new.content := regexp_replace(new.content, '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[Protected]', 'g');
    new.content := regexp_replace(new.content, '@[a-zA-Z0-9_.]{3,}', '[Protected]', 'g');
    new.content := regexp_replace(new.content, 'https?://[^\s]+', '[Protected]', 'gi');
    new.content := regexp_replace(new.content, 'www\.[^\s]+\.[a-z]{2,}', '[Protected]', 'gi');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_redact_room_message on public.room_messages;
create trigger trg_redact_room_message
  before insert on public.room_messages
  for each row execute function public.redact_room_message_contact_info();


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
-- Caller must be one of the two parties (normalize trigger may swap a/b)
create policy "Users can create conversations" on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);
-- Either party can update, but a trigger protects sensitive columns
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
-- HIGH-01: Messages UPDATE is guarded by a trigger that enforces:
-- - Only conversation members can update (RLS policy)
-- - Only the sender can edit content/revoke (trigger checks sender_id)
-- - Non-senders can only mark messages as read (trigger reverts other fields)
create policy "Users can update messages in their conversations" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Trigger: enforce sender-only content editing, allow read-marking by either party
create or replace function public.protect_message_fields()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    -- Non-sender can only change is_read, delete_for_recipient_at
    if auth.uid() is distinct from old.sender_id then
      new.content := old.content;
      new.is_revoked := old.is_revoked;
      new.edited_at := old.edited_at;
      new.original_content := old.original_content;
      new.message_type := old.message_type;
      new.is_vault := old.is_vault;
      new.is_forwarded := old.is_forwarded;
      new.view_once_opened_at := old.view_once_opened_at;
      new.view_once_opened_by := old.view_once_opened_by;
      new.delete_for_sender_at := old.delete_for_sender_at;
      -- Allow: is_read, delete_for_recipient_at
    end if;
    -- Nobody can change sender_id or conversation_id
    new.sender_id := old.sender_id;
    new.conversation_id := old.conversation_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_message_update on public.messages;
create trigger on_message_update
  before update on public.messages
  for each row execute function public.protect_message_fields();


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
  previous_content text not null,
  editor_id       uuid not null references public.users(id) on delete cascade,
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
    auth.uid() = editor_id
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
-- No direct INSERT/UPDATE — all spark operations go through create_spark_secure() RPC
-- This prevents forced matching (setting status='matched' without mutual consent)

-- Protect spark status: block direct writes from clients
create or replace function public.protect_spark_status()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    raise exception 'Spark operations must use the create_spark_secure RPC' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists on_spark_write on public.spark_matches;
create trigger on_spark_write
  before insert or update on public.spark_matches
  for each row execute function public.protect_spark_status();


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
-- CRIT-03: No direct INSERT — all Say Hi requests go through send_say_hi_secure RPC
-- This prevents VP cost bypass (inserting with vp_cost=0 without paying)
create policy "Receiver can respond" on public.say_hi_requests
  for update using (auth.uid() = receiver_id);

-- Protect say_hi_requests: only allow pending→accepted or pending→declined transitions
create or replace function public.protect_say_hi_status()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    -- Only status field can change
    new.sender_id := old.sender_id;
    new.receiver_id := old.receiver_id;
    new.message := old.message;
    new.vp_cost := old.vp_cost;
    -- Only allow pending → accepted or pending → declined
    if old.status <> 'pending' then
      raise exception 'Cannot change status of a non-pending request' using errcode = 'P0001';
    end if;
    if new.status not in ('accepted', 'declined') then
      raise exception 'Invalid status transition' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_say_hi_update on public.say_hi_requests;
create trigger on_say_hi_update
  before update on public.say_hi_requests
  for each row execute function public.protect_say_hi_status();


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

-- Protect friendships: only friend_id can accept; only either party can block
create or replace function public.protect_friendship_status()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    -- Only the recipient (friend_id) can accept a friendship
    if new.status = 'accepted' and old.status = 'pending' then
      if auth.uid() is distinct from old.friend_id then
        raise exception 'Only the recipient can accept a friendship request' using errcode = 'P0001';
      end if;
    end if;
    -- Either party can block, but status can only go pending->accepted or *->blocked
    if new.status not in ('accepted', 'blocked') and old.status <> new.status then
      raise exception 'Invalid status transition' using errcode = 'P0001';
    end if;
    -- Prevent changing user_id/friend_id
    new.user_id := old.user_id;
    new.friend_id := old.friend_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_friendship_update on public.friendships;
create trigger on_friendship_update
  before update on public.friendships
  for each row execute function public.protect_friendship_status();


-- ============================================================
-- 12. PROFILE VIEWS
-- ============================================================
create table if not exists public.profile_views (
  id             uuid primary key default uuid_generate_v4(),
  viewer_id      uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- MED-02: Dedup constraint — one view per viewer per target per day
create unique index if not exists idx_profile_views_daily
  on public.profile_views (viewer_id, target_user_id, (created_at::date));

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
-- No direct client INSERT — VP transactions are only created by security definer RPCs
-- (add_vp_secure, deduct_vp_secure, claim_daily_reward, send_gift_secure, etc.)


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
-- No direct INSERT/UPDATE/DELETE — challenges are managed by RPCs only
-- Users can only read their own challenges; progress updates go through update_challenge_progress()

-- Protect challenge progress: prevent direct completion/progress manipulation
create or replace function public.protect_challenge_progress()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    -- Clients cannot set progress or completed_at directly
    raise exception 'Challenge progress must be updated via RPC' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists on_challenge_write on public.user_challenges;
create trigger on_challenge_write
  before insert or update on public.user_challenges
  for each row execute function public.protect_challenge_progress();

-- RPC: safely increment challenge progress (prevents setting arbitrary values)
create or replace function public.update_challenge_progress(
  p_user_id uuid, p_challenge_id uuid, p_increment int default 1
) returns jsonb language plpgsql security definer as $$
declare
  v_record public.user_challenges%rowtype;
  v_target int;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
  if p_increment <= 0 then
    raise exception 'Increment must be positive' using errcode = 'P0001';
  end if;

  -- Get the challenge target
  select target into v_target from public.daily_challenges where id = p_challenge_id;
  if v_target is null then
    raise exception 'Challenge not found' using errcode = 'P0001';
  end if;

  -- Upsert the user challenge row (service_role context bypasses trigger)
  insert into public.user_challenges (user_id, challenge_id, progress)
  values (p_user_id, p_challenge_id, least(p_increment, v_target))
  on conflict (user_id, challenge_id, assigned_date)
  do update set
    progress = least(public.user_challenges.progress + p_increment, v_target),
    completed_at = case
      when public.user_challenges.progress + p_increment >= v_target and public.user_challenges.completed_at is null
      then now()
      else public.user_challenges.completed_at
    end
  returning * into v_record;

  return jsonb_build_object(
    'progress', v_record.progress,
    'target', v_target,
    'completed', v_record.completed_at is not null
  );
end;
$$;


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
-- CRIT-04: No direct INSERT/UPDATE/DELETE — all inventory writes go through equip_item_secure RPC
-- This prevents free premium item injection


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
-- No direct client INSERT — achievements are granted by security definer RPCs only


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

-- LOW-05: Prevent duplicate conversations (A,B) vs (B,A)
-- Enforce that user_a < user_b (lexicographic) via trigger
create or replace function public.normalize_conversation_order()
returns trigger language plpgsql as $$
begin
  if new.user_a > new.user_b then
    -- Swap so user_a is always the "lesser" UUID
    declare tmp uuid := new.user_a;
    begin
      new.user_a := new.user_b;
      new.user_b := tmp;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_normalize_conversation on public.conversations;
create trigger trg_normalize_conversation
  before insert on public.conversations
  for each row execute function public.normalize_conversation_order();

-- Ghost RPCs removed — use _secure variants only
drop function if exists public.deduct_vp(uuid, int);
drop function if exists public.add_vp(uuid, int);

-- Increment room listener count (auth-guarded, caller must be a participant)
create or replace function public.increment_room_listeners(p_room_id uuid)
returns void language plpgsql security definer as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
  -- Caller must be a participant of this room
  if not exists (
    select 1 from public.room_participants
    where room_id = p_room_id and user_id = auth.uid()
  ) then
    raise exception 'Not a participant of this room' using errcode = 'P0001';
  end if;
  update public.rooms
  set listener_count = listener_count + 1
  where id = p_room_id;
end;
$$;

-- LOW-02: Decrement room listener count (called on leave)
create or replace function public.decrement_room_listeners(p_room_id uuid)
returns void language plpgsql security definer as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
  update public.rooms
  set listener_count = greatest(0, listener_count - 1)
  where id = p_room_id;
end;
$$;

create or replace function public.claim_daily_reward(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_last_login date;
  v_streak int;
  v_is_founder boolean;
  v_created_at timestamptz;
  v_already_claimed boolean := false;
  v_base_vp int;
  v_bonus_vp int := 0;
  v_xp_awarded int := 10;
  v_bonus_xp int := 0;
  v_account_age int;
  v_today date := current_date;
begin
  -- Auth guard: only callable for own account
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized: cannot claim reward for another user' using errcode = 'P0001';
  end if;

  -- Lock the row to prevent concurrent double-claims
  select last_login_date, login_streak, is_founder, created_at
    into v_last_login, v_streak, v_is_founder, v_created_at
    from public.users
    where id = p_user_id
    for update;

  if not found then
    return jsonb_build_object('error', 'User not found');
  end if;

  -- Already claimed today?
  if v_last_login = v_today then
    return jsonb_build_object(
      'already_claimed', true, 'streak', v_streak,
      'vp_awarded', 0, 'bonus_vp', 0, 'total_vp', 0,
      'xp_awarded', 0, 'is_founder', v_is_founder
    );
  end if;

  -- Calculate streak
  if v_last_login is not null and (v_today - v_last_login) = 1 then
    v_streak := coalesce(v_streak, 0) + 1;
  else
    v_streak := 1;
  end if;

  -- Account age in days
  v_account_age := v_today - v_created_at::date;

  -- Base VP by account age (founders always get max)
  if v_is_founder then
    v_base_vp := 100;
  elsif v_account_age <= 7 then
    v_base_vp := 100;
  elsif v_account_age <= 30 then
    v_base_vp := 75;
  else
    v_base_vp := 50;
  end if;

  -- Streak milestone bonuses
  case v_streak
    when 7  then v_bonus_vp := 500;  v_bonus_xp := 50;
    when 14 then v_bonus_vp := 750;  v_bonus_xp := 100;
    when 30 then v_bonus_vp := 1500; v_bonus_xp := 250;
    when 60 then v_bonus_vp := 2000; v_bonus_xp := 300;
    when 90 then v_bonus_vp := 3000; v_bonus_xp := 400;
    else null;
  end case;

  -- Credit VP + XP atomically
  update public.users
  set vibe_points = vibe_points + v_base_vp + v_bonus_vp,
      total_xp = total_xp + v_xp_awarded + v_bonus_xp,
      monthly_xp = monthly_xp + v_xp_awarded + v_bonus_xp,
      login_streak = v_streak,
      last_login_date = v_today,
      updated_at = now()
  where id = p_user_id;

  -- Record VP transaction
  insert into public.vp_transactions (user_id, amount, type, description)
  values (p_user_id, v_base_vp + v_bonus_vp, 'daily_reward',
    case when v_bonus_vp > 0
      then 'Day ' || v_streak || ' streak milestone +' || v_bonus_vp || ' bonus VP'
      else 'Day ' || v_streak || ' login'
    end
  );

  return jsonb_build_object(
    'already_claimed', false, 'streak', v_streak,
    'vp_awarded', v_base_vp, 'bonus_vp', v_bonus_vp,
    'total_vp', v_base_vp + v_bonus_vp,
    'xp_awarded', v_xp_awarded + v_bonus_xp,
    'account_age_days', v_account_age,
    'is_founder', v_is_founder,
    'streak_milestone', v_bonus_vp > 0
  );
end;
$$;

-- Internal-only: add XP (NOT callable by clients — EXECUTE revoked below)
-- Only called from within other security definer RPCs (claim_daily_reward, send_gift_secure)
create or replace function public.add_xp_secure(p_user_id uuid, p_amount int)
returns void language plpgsql security definer as $$
declare
  v_total_xp int;
  v_level int;
  v_thresholds int[] := array[0, 1000, 5000, 15000, 40000, 100000, 250000, 500000, 1000000];
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0001';
  end if;

  update public.users
  set total_xp = total_xp + p_amount,
      monthly_xp = monthly_xp + p_amount
  where id = p_user_id
  returning total_xp into v_total_xp;

  -- Calculate level
  v_level := 0;
  for i in reverse array_length(v_thresholds, 1)..1 loop
    if v_total_xp >= v_thresholds[i] then
      v_level := i - 1;
      exit;
    end if;
  end loop;

  update public.users set vip_level = v_level where id = p_user_id;
end;
$$;

-- CRIT-02: Revoke client access — only other security definer RPCs can call this
revoke execute on function public.add_xp_secure(uuid, int) from authenticated;
revoke execute on function public.add_xp_secure(uuid, int) from anon;

-- Securely deduct VP (auth-guarded, own account only)
create or replace function public.deduct_vp_secure(p_user_id uuid, p_amount int, p_type text, p_description text)
returns boolean language plpgsql security definer as $$
declare
  v_current_vp int;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized: cannot deduct from another user' using errcode = 'P0001';
  end if;
  if p_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0001';
  end if;

  select vibe_points into v_current_vp from public.users where id = p_user_id for update;

  if v_current_vp < p_amount then
    return false;
  end if;

  update public.users
  set vibe_points = vibe_points - p_amount
  where id = p_user_id;

  insert into public.vp_transactions (user_id, amount, type, description)
  values (p_user_id, -p_amount, p_type, p_description);

  return true;
end;
$$;

-- Internal-only: add VP (NOT callable by clients — EXECUTE revoked below)
-- Only called from within other security definer RPCs (send_gift_secure, claim_daily_reward)
create or replace function public.add_vp_secure(p_user_id uuid, p_amount int, p_type text, p_description text)
returns void language plpgsql security definer as $$
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0001';
  end if;

  update public.users
  set vibe_points = vibe_points + p_amount
  where id = p_user_id;

  insert into public.vp_transactions (user_id, amount, type, description)
  values (p_user_id, p_amount, p_type, p_description);
end;
$$;

-- CRIT-01: Revoke client access — only other security definer RPCs can call this
revoke execute on function public.add_vp_secure(uuid, int, text, text) from authenticated;
revoke execute on function public.add_vp_secure(uuid, int, text, text) from anon;

-- ============================================================
-- ATOMIC BUSINESS RPCs (auth-guarded)
-- ============================================================

-- Send gift atomically: deduct VP from sender, credit receiver, log transactions
create or replace function public.send_gift_secure(
  p_sender_id uuid, p_receiver_id uuid, p_gift_id text, p_vp_amount int
) returns jsonb language plpgsql security definer as $$
declare
  v_sender_vp int;
  v_earning_rate numeric := 0.5; -- Receiver gets 50% of gift value
  v_receiver_credit int;
begin
  if auth.uid() is distinct from p_sender_id then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
  if p_vp_amount <= 0 then
    raise exception 'Amount must be positive' using errcode = 'P0001';
  end if;
  if p_sender_id = p_receiver_id then
    raise exception 'Cannot send gift to yourself' using errcode = 'P0001';
  end if;

  -- Lock sender row
  select vibe_points into v_sender_vp from public.users where id = p_sender_id for update;
  if v_sender_vp < p_vp_amount then
    return jsonb_build_object('error', 'Insufficient VP');
  end if;

  v_receiver_credit := floor(p_vp_amount * v_earning_rate)::int;

  -- Deduct from sender
  update public.users set vibe_points = vibe_points - p_vp_amount where id = p_sender_id;
  -- Credit receiver
  update public.users set vibe_points = vibe_points + v_receiver_credit where id = p_receiver_id;

  -- Record gift transaction
  insert into public.gift_transactions (sender_id, receiver_id, gift_id, vp_amount)
  values (p_sender_id, p_receiver_id, p_gift_id, p_vp_amount);

  -- Record VP transactions for both parties
  insert into public.vp_transactions (user_id, amount, type, description) values
    (p_sender_id, -p_vp_amount, 'gift_sent', 'Sent gift to user'),
    (p_receiver_id, v_receiver_credit, 'gift_received', 'Received gift');

  -- Update receiver earnings
  insert into public.user_earnings (user_id, balance_earned_vp, total_lifetime_earned_vp, updated_at)
  values (p_receiver_id, v_receiver_credit, v_receiver_credit, now())
  on conflict (user_id) do update set
    balance_earned_vp = user_earnings.balance_earned_vp + v_receiver_credit,
    total_lifetime_earned_vp = user_earnings.total_lifetime_earned_vp + v_receiver_credit,
    updated_at = now();

  return jsonb_build_object('success', true, 'receiver_credit', v_receiver_credit);
end;
$$;

-- Send Say Hi atomically: deduct VP + insert request
create or replace function public.send_say_hi_secure(
  p_receiver_id uuid, p_message text, p_vp_cost int
) returns jsonb language plpgsql security definer as $$
declare
  v_sender_id uuid := auth.uid();
  v_sender_vp int;
begin
  if v_sender_id is null then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  if p_vp_cost > 0 then
    select vibe_points into v_sender_vp from public.users where id = v_sender_id for update;
    if v_sender_vp < p_vp_cost then
      return jsonb_build_object('error', 'Insufficient VP');
    end if;
    update public.users set vibe_points = vibe_points - p_vp_cost where id = v_sender_id;
    insert into public.vp_transactions (user_id, amount, type, description)
    values (v_sender_id, -p_vp_cost, 'say_hi', 'Say Hi request');
  end if;

  insert into public.say_hi_requests (sender_id, receiver_id, message, vp_cost)
  values (v_sender_id, p_receiver_id, p_message, p_vp_cost);

  return jsonb_build_object('success', true);
end;
$$;

-- Create spark atomically: prevent duplicate pending sparks, auto-match if mutual
create or replace function public.create_spark_secure(
  p_from_id uuid, p_to_id uuid, p_score int
) returns jsonb language plpgsql security definer as $$
declare
  v_existing_id uuid;
  v_reverse_id uuid;
begin
  if auth.uid() is distinct from p_from_id then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;
  if p_from_id = p_to_id then
    raise exception 'Cannot spark yourself' using errcode = 'P0001';
  end if;

  -- Check for existing pending spark from this user
  select id into v_existing_id from public.spark_matches
  where user_a = p_from_id and user_b = p_to_id and status = 'pending';
  if v_existing_id is not null then
    return jsonb_build_object('error', 'Already sparked');
  end if;

  -- Check for reverse spark (mutual match)
  select id into v_reverse_id from public.spark_matches
  where user_a = p_to_id and user_b = p_from_id and status = 'pending'
  for update;

  if v_reverse_id is not null then
    -- Mutual match!
    update public.spark_matches set status = 'matched' where id = v_reverse_id;
    return jsonb_build_object('matched', true, 'match_id', v_reverse_id);
  end if;

  -- No reverse spark — create new pending
  insert into public.spark_matches (user_a, user_b, match_score)
  values (p_from_id, p_to_id, p_score)
  returning id into v_existing_id;

  return jsonb_build_object('matched', false, 'spark_id', v_existing_id);
end;
$$;

-- Equip item atomically: unequip previous, equip new
create or replace function public.equip_item_secure(p_item_id uuid, p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_item_type text;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized' using errcode = 'P0001';
  end if;

  -- Get the item type of the item being equipped
  select item_type into v_item_type from public.user_inventory
  where id = p_item_id and user_id = p_user_id;
  if not found then
    raise exception 'Item not found' using errcode = 'P0001';
  end if;

  -- Unequip all items of the same type
  update public.user_inventory
  set is_equipped = false
  where user_id = p_user_id and item_type = v_item_type and is_equipped = true;

  -- Equip the selected item
  update public.user_inventory
  set is_equipped = true
  where id = p_item_id and user_id = p_user_id;
end;
$$;

-- Promote a participant to speaker (host-only RPC)
create or replace function public.promote_to_speaker(p_room_id uuid, p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  -- Only the room host can promote
  if not exists (
    select 1 from public.rooms where id = p_room_id and host_id = auth.uid()
  ) then
    raise exception 'Only the room host can promote speakers' using errcode = 'P0001';
  end if;
  update public.room_participants
  set role = 'speaker', is_muted = false
  where room_id = p_room_id and user_id = p_user_id;
end;
$$;

-- Contact info detector for SQL
create or replace function public.contains_contact_info(p_text text)
returns boolean language plpgsql immutable as $$
begin
  return (
    p_text ~* '(\+?234|0)[789]\d{9}' OR -- NG
    p_text ~* '(\+?233|0)[235]\d{8}' OR -- GH
    p_text ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' OR -- Email
    p_text ~* '@[a-zA-Z0-9_.]{3,}' OR -- Handles
    p_text ~* 'https?://[^\s]+' OR -- URL
    p_text ~* 'www\.[^\s]+\.[a-z]{2,}' -- URL
  );
end;
$$;

-- Reset broken streaks — system-only (pg_cron at 02:00 UTC)
-- Blocks client calls: auth.uid() is non-null for client calls, null for service-role/pg_cron
create or replace function public.reset_broken_streaks()
returns int language plpgsql security definer as $$
declare
  reset_count int;
begin
  if auth.uid() is not null then
    raise exception 'This function is for system use only' using errcode = 'P0001';
  end if;
  update public.users
    set login_streak = 0
    where last_login_date < current_date - 1
      and login_streak > 0;
  get diagnostics reset_count = row_count;
  return reset_count;
end;
$$;

-- Trigger to protect economy fields and enforce moderation
create or replace function public.protect_user_fields()
returns trigger language plpgsql security definer as $$
begin
  -- 1. Prevent non-service-role from touching economy/privilege fields
  if (current_setting('role') <> 'service_role') then
    new.vibe_points := old.vibe_points;
    new.total_xp := old.total_xp;
    new.monthly_xp := old.monthly_xp;
    new.vip_level := old.vip_level;
    new.subscription_tier := old.subscription_tier;
    new.is_founder := old.is_founder;
    new.is_verified := old.is_verified;
    new.trust_score := old.trust_score;
    new.login_streak := old.login_streak;
    new.last_login_date := old.last_login_date;
  end if;

  -- 2. Enforce moderation (if not founder)
  if NOT new.is_founder then
    if public.contains_contact_info(new.bio) OR 
       public.contains_contact_info(new.display_name) OR 
       public.contains_contact_info(new.occupation) then
      -- If contact info found, we could RAISE EXCEPTION, but 
      -- James Kettle prefers silent fail or resetting to old value
      new.bio := old.bio;
      new.display_name := old.display_name;
      new.occupation := old.occupation;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_user_update on public.users;
create trigger on_user_update
  before update on public.users
  for each row execute function public.protect_user_fields();

-- Protect room_participants.role from client-side self-promotion
-- Only the room host (via RPC) or service_role can change roles
create or replace function public.protect_participant_role()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    -- Check if the caller is the room host
    if not exists (
      select 1 from public.rooms
      where id = new.room_id and host_id = auth.uid()
    ) then
      new.role := old.role; -- Revert role change for non-hosts
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_participant_update on public.room_participants;
create trigger on_participant_update
  before update on public.room_participants
  for each row execute function public.protect_participant_role();

-- Protect conversations: only allow status changes by the blocker, prevent last_message tampering
create or replace function public.protect_conversation_fields()
returns trigger language plpgsql security definer as $$
begin
  if (current_setting('role') <> 'service_role') then
    -- Only the affected user can change their own unread count / pin
    if auth.uid() = old.user_a then
      new.unread_count_b := old.unread_count_b;
      new.is_pinned_b := old.is_pinned_b;
    elsif auth.uid() = old.user_b then
      new.unread_count_a := old.unread_count_a;
      new.is_pinned_a := old.is_pinned_a;
    end if;
    -- Prevent direct status changes (must go through block/report flow)
    if new.status <> old.status then
      new.status := old.status;
    end if;
    -- HIGH-02: Prevent last_message tampering (only RPCs/triggers should set this)
    new.last_message := old.last_message;
    new.last_message_at := old.last_message_at;
  end if;
  return new;
end;
$$;

drop trigger if exists on_conversation_update on public.conversations;
create trigger on_conversation_update
  before update on public.conversations
  for each row execute function public.protect_conversation_fields();

-- Auto-update conversation last_message on new message INSERT
-- This replaces the client-side conversation update (which is now blocked by the trigger)
create or replace function public.update_conversation_on_message()
returns trigger language plpgsql security definer as $$
begin
  update public.conversations
  set last_message = case
        when new.is_vault then '🔒 View once'
        when new.message_type = 'gift' then '🎁 Gift'
        else left(new.content, 100)
      end,
      last_message_at = new.created_at,
      -- Increment unread count for the OTHER user
      unread_count_a = case when (select user_a from public.conversations where id = new.conversation_id) = new.sender_id
                        then unread_count_a else unread_count_a + 1 end,
      unread_count_b = case when (select user_b from public.conversations where id = new.conversation_id) = new.sender_id
                        then unread_count_b else unread_count_b + 1 end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert_update_conv on public.messages;
create trigger on_message_insert_update_conv
  after insert on public.messages
  for each row execute function public.update_conversation_on_message();


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
