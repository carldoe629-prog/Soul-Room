-- ============================================================
-- Soul Room — Messaging Features Migration
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- ── Step 1a: Extend messages table ──────────────────────────

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_revoked            BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_vault              BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_forwarded          BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS edited_at             TIMESTAMPTZ  NULL,
  ADD COLUMN IF NOT EXISTS original_content      TEXT         NULL,
  ADD COLUMN IF NOT EXISTS view_once_opened_at   TIMESTAMPTZ  NULL,
  ADD COLUMN IF NOT EXISTS view_once_opened_by   UUID         NULL REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS delete_for_sender_at  TIMESTAMPTZ  NULL,
  ADD COLUMN IF NOT EXISTS delete_for_recipient_at TIMESTAMPTZ NULL;

-- ── Step 1b: message_edits — edit history audit log ─────────

CREATE TABLE IF NOT EXISTS public.message_edits (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id       UUID        NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  previous_content TEXT        NOT NULL,
  edited_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  editor_id        UUID        NOT NULL REFERENCES public.users(id)
);

ALTER TABLE public.message_edits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_edits' AND policyname = 'editors can insert') THEN
    CREATE POLICY "editors can insert" ON public.message_edits FOR INSERT WITH CHECK (auth.uid() = editor_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_edits' AND policyname = 'editors can read own') THEN
    CREATE POLICY "editors can read own" ON public.message_edits FOR SELECT USING (auth.uid() = editor_id);
  END IF;
END $$;

-- ── Step 1c: message_reactions ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id  UUID        NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji       TEXT        NOT NULL CHECK (emoji IN ('🔥','💫','😂','😭','👌','❤️')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'users can react') THEN
    CREATE POLICY "users can react"
      ON public.message_reactions FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM public.messages m
          JOIN public.conversations c ON c.id = m.conversation_id
          WHERE m.id = message_id
            AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'users can remove own reactions') THEN
    CREATE POLICY "users can remove own reactions"
      ON public.message_reactions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'users can read reactions') THEN
    CREATE POLICY "users can read reactions"
      ON public.message_reactions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.messages m
          JOIN public.conversations c ON c.id = m.conversation_id
          WHERE m.id = message_id
            AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
        )
      );
  END IF;
END $$;

-- ── Step 1d: RLS on messages UPDATE ──────────────────────────
-- Allow senders to update their own messages (edit, revoke, delete-for-sender)
-- Allow conversation participants to update delete_for_recipient_at on messages they received

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'senders can update own messages') THEN
    CREATE POLICY "senders can update own messages"
      ON public.messages FOR UPDATE
      USING (auth.uid() = sender_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'recipients can mark deleted for self') THEN
    CREATE POLICY "recipients can mark deleted for self"
      ON public.messages FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = conversation_id
            AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
        )
      );
  END IF;
END $$;

-- ── Step 1e: Enable Realtime for new tables ──────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
