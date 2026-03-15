-- Update message redaction trigger to skip founders
CREATE OR REPLACE FUNCTION public.redact_contact_info()
RETURNS trigger AS $$
DECLARE
  txt text;
  sender_is_founder boolean;
BEGIN
  IF NEW.message_type IS DISTINCT FROM 'text' THEN
    RETURN NEW;
  END IF;

  -- Founder bypass: skip all redaction
  SELECT is_founder INTO sender_is_founder FROM public.users WHERE id = NEW.sender_id;
  IF sender_is_founder IS TRUE THEN
    RETURN NEW;
  END IF;

  txt := coalesce(NEW.content, '');

  txt := regexp_replace(txt, '(\+?234|0)[789]\d{9}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?233|0)[235]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?254|0)[17]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?27|0)[6-8]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?44|0)7\d{9}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?1)[2-9]\d{9}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?20)1\d{9}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?255|0)[67]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?256|0)[37]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?225|0)[0-9]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '(\+?221|0)[37]\d{8}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}', '[Contact info protected by Soul Room]', 'g');
  txt := regexp_replace(txt, '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', '[Contact info protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, '@[a-zA-Z0-9_.]{3,}', '[Handle protected by Soul Room]', 'g');
  txt := regexp_replace(txt, 'https?://[^\s]+', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 'www\.[^\s]+\.[a-z]{2,}', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 'wa\.me/[^\s]+', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 't\.me/[^\s]+', '[Link protected by Soul Room]', 'gi');
  txt := regexp_replace(txt, 'bit\.ly/[^\s]+', '[Link protected by Soul Room]', 'gi');

  NEW.content := txt;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update profile trigger to skip founders
CREATE OR REPLACE FUNCTION public.block_contact_info_in_profile()
RETURNS trigger AS $$
DECLARE
  val text;
BEGIN
  -- Founder bypass: skip all contact info checks
  IF NEW.is_founder IS TRUE THEN
    RETURN NEW;
  END IF;

  val := coalesce(NEW.display_name, '');
  IF val ~ '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
     OR val ~ '@[a-zA-Z0-9_.]{3,}'
     OR val ~ 'https?://[^\s]+'
     OR val ~ '(\+?234|0)[789]\d{9}'
     OR val ~ '(\+?233|0)[235]\d{8}'
     OR val ~ '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}'
  THEN
    RAISE EXCEPTION 'Contact information cannot be added to your display name.' USING ERRCODE = 'P0001';
  END IF;

  val := coalesce(NEW.bio, '');
  IF val ~ '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
     OR val ~ '@[a-zA-Z0-9_.]{3,}'
     OR val ~ 'https?://[^\s]+'
     OR val ~ '(\+?234|0)[789]\d{9}'
     OR val ~ '(\+?233|0)[235]\d{8}'
     OR val ~ '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}'
     OR val ~* '\m(ig|insta|instagram|snapchat|whatsapp|telegram|tiktok|facebook)\M'
  THEN
    RAISE EXCEPTION 'For your safety, contact information cannot be added to your bio.' USING ERRCODE = 'P0001';
  END IF;

  val := coalesce(NEW.occupation, '');
  IF val ~ '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
     OR val ~ '@[a-zA-Z0-9_.]{3,}'
     OR val ~ 'https?://[^\s]+'
     OR val ~ '(\+?234|0)[789]\d{9}'
     OR val ~ '(\+?233|0)[235]\d{8}'
     OR val ~ '\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4}'
  THEN
    RAISE EXCEPTION 'Contact information cannot be added to your occupation.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
