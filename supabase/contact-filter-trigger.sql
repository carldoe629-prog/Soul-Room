-- ============================================================
-- SOUL ROOM — Contact Filter Trigger (Layer 1 server-side)
-- Defence in depth: even if client-side filter is bypassed,
-- this trigger redacts contact info before it reaches the DB.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Function: redact contact info from message content
create or replace function public.redact_contact_info()
returns trigger as $$
declare
  txt text;
begin
  -- Only filter text messages
  if NEW.message_type is distinct from 'text' then
    return NEW;
  end if;

  txt := coalesce(NEW.content, '');

  -- Phone numbers (Africa-first + generic)
  -- Nigeria
  txt := regexp_replace(txt, '(\+?234|0)[789]\d{9}', '[Contact info protected by Soul Room]', 'g');
  -- Ghana
  txt := regexp_replace(txt, '(\+?233|0)[235]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- Kenya
  txt := regexp_replace(txt, '(\+?254|0)[17]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- South Africa
  txt := regexp_replace(txt, '(\+?27|0)[6-8]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- UK mobile
  txt := regexp_replace(txt, '(\+?44|0)7\d{9}', '[Contact info protected by Soul Room]', 'g');
  -- US/Canada
  txt := regexp_replace(txt, '(\+?1)[2-9]\d{9}', '[Contact info protected by Soul Room]', 'g');
  -- Egypt
  txt := regexp_replace(txt, '(\+?20)1\d{9}', '[Contact info protected by Soul Room]', 'g');
  -- Tanzania
  txt := regexp_replace(txt, '(\+?255|0)[67]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- Uganda
  txt := regexp_replace(txt, '(\+?256|0)[37]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- Ivory Coast
  txt := regexp_replace(txt, '(\+?225|0)[0-9]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- Senegal
  txt := regexp_replace(txt, '(\+?221|0)[37]\d{8}', '[Contact info protected by Soul Room]', 'g');
  -- Generic 10-digit
  txt := regexp_replace(txt, '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}', '[Contact info protected by Soul Room]', 'g');

  -- Email
  txt := regexp_replace(txt, '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', '[Contact info protected by Soul Room]', 'gi');

  -- @handles
  txt := regexp_replace(txt, '@[a-zA-Z0-9_.]{3,}', '[Handle protected by Soul Room]', 'g');

  -- URLs
  txt := regexp_replace(txt, 'https?://[^\s]+', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 'www\.[^\s]+\.[a-z]{2,}', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 'wa\.me/[^\s]+', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 't\.me/[^\s]+', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 'bit\.ly/[^\s]+', '[Link protected by Soul Room]', 'gi');

  NEW.content := txt;
  return NEW;
end;
$$ language plpgsql;

-- Trigger on messages table: fires BEFORE INSERT and UPDATE
drop trigger if exists trg_redact_contact_info on public.messages;
create trigger trg_redact_contact_info
  before insert or update on public.messages
  for each row
  execute function public.redact_contact_info();

-- ============================================================
-- Profile field validation trigger
-- Blocks saves if bio/display_name/occupation contain contact info
-- ============================================================

create or replace function public.block_contact_info_in_profile()
returns trigger as $$
declare
  has_contact boolean := false;
  field_name text := '';
  val text;
begin
  -- Check display_name
  val := coalesce(NEW.display_name, '');
  if val ~ '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
     or val ~ '@[a-zA-Z0-9_.]{3,}'
     or val ~ 'https?://[^\s]+'
     or val ~ '(\+?234|0)[789]\d{9}'
     or val ~ '(\+?233|0)[235]\d{8}'
     or val ~ '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}'
  then
    raise exception 'Contact information cannot be added to your display name.'
      using errcode = 'P0001';
  end if;

  -- Check bio
  val := coalesce(NEW.bio, '');
  if val ~ '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
     or val ~ '@[a-zA-Z0-9_.]{3,}'
     or val ~ 'https?://[^\s]+'
     or val ~ '(\+?234|0)[789]\d{9}'
     or val ~ '(\+?233|0)[235]\d{8}'
     or val ~ '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}'
     or val ~* '\m(ig|insta|instagram|snapchat|whatsapp|telegram|tiktok|facebook)\M'
  then
    raise exception 'For your safety, contact information cannot be added to your bio.'
      using errcode = 'P0001';
  end if;

  -- Check occupation
  val := coalesce(NEW.occupation, '');
  if val ~ '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
     or val ~ '@[a-zA-Z0-9_.]{3,}'
     or val ~ 'https?://[^\s]+'
     or val ~ '(\+?234|0)[789]\d{9}'
     or val ~ '(\+?233|0)[235]\d{8}'
     or val ~ '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}'
  then
    raise exception 'Contact information cannot be added to your occupation.'
      using errcode = 'P0001';
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Trigger on users table
drop trigger if exists trg_block_contact_info_in_profile on public.users;
create trigger trg_block_contact_info_in_profile
  before insert or update on public.users
  for each row
  execute function public.block_contact_info_in_profile();
