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
