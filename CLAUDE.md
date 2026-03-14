# Soul Room – CLAUDE.md

## Project Overview

Soul Room is a social audio/dating mobile app built with **Next.js 16 + Capacitor** (Android). It features live voice rooms, spark matching, user discovery, messaging, VP (Vibe Points) economy, and VIP levels.

**App ID:** `com.soulroom.app`
**Working directory:** `soul-room-app/`

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
│   │   │   ├── subscribe/        # Subscription/paywall
│   │   │   ├── vip-level/        # VIP progression
│   │   │   └── vp/               # VP transactions
│   │   ├── login/                # Auth page
│   │   ├── onboarding/           # New user flow
│   │   └── welcome/              # Landing/splash
│   ├── components/
│   │   └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useMediaPicker.ts
│   └── lib/
│       ├── supabase.ts           # Supabase browser client
│       ├── db.ts                 # All DB query functions
│       └── mock-data.ts          # Mock data for UI development
├── capacitor.config.ts
└── android/                      # Capacitor Android project
```

## Key Architecture

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
