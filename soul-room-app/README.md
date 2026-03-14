# Soul Room

Soul Room is a modern social platform designed to facilitate meaningful human connections. Built with **Next.js**, **Supabase**, and **Capacitor**, it provides a seamless experience across web and mobile devices.

## 🌟 Key Features

- **Spark Matching:** AI-powered matching based on shared interests. Connect through 5-minute voice calls to see if there's a real spark.
- **Worlds & Voice Rooms:** Join themed communities (World of Games, World of Music, etc.) and participate in real-time voice conversations.
- **Vault Messages:** Secure, end-to-end encrypted messaging for private and lasting connections.
- **Premium Tiers:** Enhanced features like real-time translation, private rooms, and accidental pass recovery.

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Backend/Auth:** [Supabase](https://supabase.com/)
- **Styling:** CSS Modules & Tailwind CSS
- **Mobile Support:** [Capacitor](https://capacitorjs.com/) for Native Android/iOS builds
- **Type Safety:** TypeScript

## ☁️ Solo-Dev Super Stack (Hosting & Backend)

This combination is designed for auto-scaling, global speed, and zero server maintenance, while keeping costs at **$0/month** during building and testing.

### 1. Vercel (Frontend & API Server)
- **What it hosts:** Your Next.js web application and API backend logic.
- **Why it fits:** Automatically deploys from GitHub to global Edge servers. No Linux maintenance required.
- **Cost:** $0/month (Hobby tier)

### 2. Supabase (Database, Auth, & Real-Time)
- **What it hosts:** PostgreSQL database, User Authentication, and WebSockets (Supabase Realtime).
- **Why it fits:** Removes the need for a custom Socket.io server for live chat. Handles security and pushes instant updates.
- **Cost:** $0/month (Free tier)

### 3. Cloudflare R2 (Media Storage)
- **What it hosts:** Profile pictures, Vault photos/videos, and voice notes.
- **Why it fits:** **Zero egress (bandwidth) fees.** Essential for dating apps with high media consumption.
- **Cost:** $0/month (First 10GB free)

### 4. Upstash (Redis Cache)
- **What it hosts:** High-speed data like online status and Rate Limiting.
- **Why it fits:** Serverless Redis that handles high-frequency updates (like presence) in RAM to keep the main DB healthy.
- **Cost:** $0/month (First 10,000 requests/day free)

### 5. Agora.io (Voice & Video Engine)
- **What it hosts:** Live audio/video streams for "Worlds" rooms and 1-on-1 Spark Calls.
- **Why it fits:** Industry standard for ultra-low latency globally (used by Clubhouse, Bigo Live).
- **Cost:** $0/month (First 10,000 minutes per month free)

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm or yarn
- Supabase account (for backend)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/carldoe629-prog/Soul-Room.git
   cd Soul-Room/soul-room-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Supabase credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📱 Mobile Build (Capacitor)

The project is ready for mobile deployment. To build the Android version:

```bash
npm run build
npx cap sync
npx cap open android
```

## 📄 License

This project is proprietary and confidential.
