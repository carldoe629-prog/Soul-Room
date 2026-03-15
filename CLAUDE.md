# Soul Room – CLAUDE.md

## Project Overview

Soul Room is a social audio/dating mobile app built with **Next.js 16 + Capacitor** (Android). It features live voice rooms, spark matching, user discovery, messaging, VP (Vibe Points) economy, and VIP levels.

**App ID:** `com.soulroom.app`
**Working directory:** `soul-room-app/`
**GitHub:** `https://github.com/carldoe629-prog/Soul-Room`
**Deployment:** Vercel (auto-deploys from `main` branch)

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (Postgres + Realtime + Auth)
- **Mobile:** Capacitor 8 (Android)
- **Font:** Outfit (applied via `font-[Outfit]`)

## Commands

All commands run from `soul-room-app/`:

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Next.js static export (outputs to /out)
npm run lint         # ESLint
npx cap sync         # Sync web output to Android
npx cap open android # Open in Android Studio
```

## Project Structure

```
soul-room-app/
├── src/
│   ├── app/
│   │   ├── app/                  # Authenticated app shell
│   │   │   ├── page.tsx          # Home feed (Discover, Spark matches, Live rooms)
│   │   │   ├── chat/             # Messaging
│   │   │   ├── spark/            # Spark matching
│   │   │   ├── worlds/           # World browser + rooms
│   │   │   │   └── [worldId]/rooms/[roomId]/  # Live room
│   │   │   ├── profile/          # Own profile + [userId] public profile
│   │   │   ├── daily-reward/     # Daily VP claim + streak display
│   │   │   ├── subscribe/        # Subscription/paywall
│   │   │   ├── vip-level/        # VIP progression
│   │   │   └── vp/               # VP transactions
│   │   ├── login/                # Auth page
│   │   ├── onboarding/           # New user flow
│   │   └── welcome/              # Landing/splash
│   ├── components/
│   │   ├── AuthProvider.tsx       # Auth context provider (wraps app shell)
│   │   └── ThemeProvider.tsx      # Dark/light theme context (scoped to /app layout)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useMediaPicker.ts
│   └── lib/
│       ├── supabase.ts           # Supabase browser client
│       ├── db.ts                 # All DB query functions
│       ├── mock-data.ts          # Mock data for UI development
│       └── moderation/
│           └── contact-detector.ts  # Contact info filter (Layer 1)
├── capacitor.config.ts
└── android/                      # Capacitor Android project
```

## Key Architecture

### Auth (`src/components/AuthProvider.tsx`)
- Supabase singleton created outside the component to avoid re-initialisation
- Demo mode: set `localStorage.soulroom_demo = 'true'` — loads `DEMO_PROFILE`, skips all Supabase calls
- `AuthProvider` wraps only `/app` layout (not the root layout) — public pages never need auth context
- `ThemeProvider` is also scoped to `/app/layout.tsx`, not the root layout

### Database (`src/lib/db.ts`)
All Supabase queries are centralized here. Tables include:
- `users` – profiles, VIP level, XP, VP balance
- `worlds` – topic-based communities
- `rooms` – live voice rooms (with `room_participants`)
- `conversations` + `messages` – 1:1 messaging with realtime
- `spark_matches` – mutual spark/like system
- `say_hi_requests` – icebreaker messages
- `follows`, `friendships`, `blocks`, `reports` – social graph
- `gifts`, `gift_transactions` – VP gift economy
- `vp_transactions` – VP ledger
- `user_inventory`, `user_achievements`, `user_earnings`
- `daily_challenges`, `user_challenges`

Realtime subscriptions: `subscribeToMessages()`, `subscribeToConversations()`

### VP Economy
- VP (Vibe Points) = in-app currency
- Deducted via `deductVP()` / added via `addVP()` (both use Supabase RPC)
- Spent on: gifts, Say Hi requests
- Earned by: receiving gifts

### VIP System
XP thresholds: `[0, 1000, 5000, 10000, 40000, 100000, 250000, 500000, 1000000]`
Level up happens in `addXP()` in `db.ts`.

### Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Design System

- **Background:** `#160824` (deep purple/black)
- **Accent:** pink/magenta gradient (`gradient-accent`)
- **Vibe color:** `text-vibe` / `bg-vibe` (pinkish-red)
- **Glass UI:** `glass`, `glass-strong` utility classes
- **No-scrollbar horizontal carousels:** `no-scrollbar snap-x`
- **Rounded corners:** heavy use of `rounded-2xl`, `rounded-3xl`

## Development Notes

- Static export (`webDir: 'out'`) — no server-side rendering in production
- `'use client'` required on all interactive components
- Mock data in `src/lib/mock-data.ts` used during UI development before full Supabase wiring
- Capacitor `allowMixedContent: true` set for Android dev
- Splash screen: `#160824` bg, `#FF4B6E` spinner

## Vercel Deployment

`vercel.json` at repo root (required for monorepo layout — Next.js app is in `soul-room-app/` subdirectory):

```json
{
  "framework": null,
  "buildCommand": "cd soul-room-app && npm run build",
  "outputDirectory": "soul-room-app/out",
  "installCommand": "cd soul-room-app && npm install"
}
```

Key points:
- `"framework": null` — disables Vercel's Next.js detection (prevents it looking for `routes-manifest.json`; output is treated as a plain static site)
- `"outputDirectory"` must point to `soul-room-app/out` (the static export target)
- `rootDirectory` is a **dashboard-only** setting — never put it in `vercel.json`
- Do NOT set `output: 'export'` if you need ISR; it is already set in `next.config.js`

## Feature Notes

### Login & Onboarding pages
- Both have a clickable SR logo (top-centre) wrapped in `<Link href="/">` that navigates to the landing page
- Hover effect: `hover:scale-105 transition-transform`

### Home Feed (`src/app/app/page.tsx`)
Three sections: Spark Matches carousel → People Online (Discover grid) → Live Rooms

**Discover section (`PeopleOnlineSection` component):**
- Bell icon (🔔 → SVG) opens `NotificationsSheet` bottom-sheet — shows mock activity (matches, say hi, gifts, room invites) with unread badge count
- Filter icon (⚙️ → funnel SVG) opens `FilterSheet` bottom-sheet with:
  - Gender chips (All / Women / Men) — synced with the inline filter chips
  - Online-only toggle
  - Age range dual sliders (18–60)
- Inline filter chips still visible below the header (All / Women / Men / My Interests)
- Cards rendered as 2-column grid (`UserProfileCard`)

### Chat page (`src/app/app/chat/page.tsx`)
- Empty state copy: "Say Hi to someone on the **Home** tab" / "Spark someone on the **Spark** tab to match"
  (Not "Discover tab" — no such tab exists in the nav)

### ThemeProvider
- Must have explicit `: ThemeContextType` return type on `useTheme()` to satisfy TypeScript strict mode
- `setTheme` call sites must cast: `(isDark ? 'light' : 'dark') as Theme`

## Daily VP Grants & Streak Tracking (COMPLETE)

### Overview
Users earn VP daily with account-age-based tiers and streak milestone bonuses. Founders always receive max daily grant (100 VP).

### Core function: `claimDailyReward(userId)` in `src/lib/db.ts`
Calls the atomic `claim_daily_reward` Postgres RPC (row-locked to prevent double-claims).

### VP tiers by account age
| Account age | Base VP |
|---|---|
| Days 1–7 (honeymoon) | 100 VP |
| Days 8–30 (tapering) | 75 VP |
| Days 31+ (baseline) | 50 VP |
| **Founder** (any age) | **100 VP** |

### Streak milestone bonuses (one-time on top of daily)
| Streak | VP Bonus | XP Bonus |
|---|---|---|
| 7 days | +500 VP | +50 XP |
| 14 days | +750 VP | +100 XP |
| 30 days | +1,500 VP | +250 XP |
| 60 days | +2,000 VP | +300 XP |
| 90 days | +3,000 VP | +400 XP |

### Streak break detection
- If `last_login_date` is yesterday → streak increments
- If `last_login_date` is >1 day ago → streak resets to 1
- `reset_broken_streaks()` Postgres function zeroes streaks for users who missed yesterday — schedule via `pg_cron` at 02:00 UTC daily: `SELECT cron.schedule('reset-streaks', '0 2 * * *', 'SELECT public.reset_broken_streaks()');`

### Database columns (on `users` table)
- `login_streak` INT NOT NULL DEFAULT 0
- `last_login_date` DATE (nullable — null until first claim)

### UI
- Daily Reward tile on Me/Profile tab → navigates to `/app/daily-reward`
- `/app/daily-reward` page: calls `claimDailyReward()` on mount, shows streak count, VP awarded, milestone celebration, "already claimed" state with countdown

### Gotchas
- **DATE vs TIMESTAMPTZ**: `last_login_date` is a DATE column. The RPC compares with `current_date` (Postgres DATE), not a full ISO timestamp. Streak calculation uses date subtraction (`today_str - last_login_date`) which returns integer days — no timezone edge cases.
- **Atomic claim**: The Postgres RPC uses `FOR UPDATE` row lock to prevent concurrent double-claims. VP credit and streak update happen in the same transaction.
- **XP is awarded client-side** via `addXP()` after the RPC returns — this matches the existing pattern in `db.ts` (static export, no server-side code).

## Contact Filtering — Layer 1 (COMPLETE)

Contact info detection and blocking to prevent users from sharing phone numbers, emails, social handles, and URLs outside the platform. Implementation in `src/lib/moderation/contact-detector.ts`.

### Architecture — Two layers of defence

**Client-side (in `db.ts` and `AuthProvider.tsx`):**
- **Chat messages — silent redaction**: `filterChatMessage()` replaces contact info with `[Contact info protected by Soul Room]`. Sender always sees success (never told the filter fired). Applied in: `sendMessage()`, `sendSayHi()`, `editMessage()`, `sendVaultMessage()`, `forwardMessage()`.
- **Profile fields — hard block**: `profileFieldContainsContactInfo()` returns true if bio/display_name/occupation contain contact info. Used in `updateProfile()` (AuthProvider) and onboarding save. Returns a user-facing error instead of saving. Profile checks also detect platform keywords (instagram, whatsapp, etc.) — chat filter does NOT block platform keywords alone.

**Server-side (Postgres triggers in Supabase):**
- `trg_redact_contact_info` on `messages` — BEFORE INSERT/UPDATE, silently redacts phone/email/handle/URL using `regexp_replace`
- `trg_block_contact_info_in_profile` on `users` — BEFORE INSERT/UPDATE, raises exception if bio/display_name/occupation contain contact info
- SQL source: `supabase/contact-filter-trigger.sql`

### Phone patterns — Africa-first
Nigeria, Ghana, Kenya, South Africa, UK, US/Canada, Egypt, Tanzania, Uganda, Ivory Coast, Senegal, plus generic 10-digit fallback.

### Founder bypass (COMPLETE)
- `is_founder` boolean column on `users` table (default false)
- `is_founder` field on `UserProfile` interface
- Client-side: `sendMessage()`, `sendSayHi()`, `editMessage()`, `sendVaultMessage()` accept `isFounder` param — skips `filterChatMessage()` when true
- Client-side: `updateProfile()` in AuthProvider skips `profileFieldContainsContactInfo()` when `profile.is_founder` is true
- Server-side: both Postgres triggers (`trg_redact_contact_info`, `trg_block_contact_info_in_profile`) check `is_founder` and skip all checks when true
- To grant founder status: `UPDATE users SET is_founder = true WHERE id = '<user-uuid>';`

### Future layers (not yet implemented)
- **Layer 2**: Drip-feed accumulator — track violation frequency per user per month via `buildViolationKey()`
- **Layer 3**: Encoding detection — catch leetspeak, spaced-out digits, spelled-out numbers
- **Layer 4**: AI audit — LLM-based semantic analysis for sophisticated evasion

### Gotchas
- **Regex `lastIndex` reset**: All phone/URL patterns use the `g` flag (stateful). After every `test()` call, `lastIndex` must be reset to 0 or subsequent calls produce false negatives. Every pattern in `contact-detector.ts` has explicit `lastIndex = 0` resets.
- **Chat vs Profile filtering**: Chat filter does NOT block platform keywords alone ("I love WhatsApp" is fine). Profile filter DOES block platform keywords (bio should not mention Instagram/WhatsApp/etc. at all).

## Git / GitHub

- Repo: `https://github.com/carldoe629-prog/Soul-Room`
- Branch: `main`
- `soul-room-app/.git` was removed — `soul-room-app/` is tracked as a normal subdirectory (not a submodule)
- Root `.gitignore` excludes: `.claude/`, `debug*/`, `*.apk`, `soul-room-app/node_modules/`, `soul-room-app/.next/`, `soul-room-app/out/`, `.env*`, Android build outputs
