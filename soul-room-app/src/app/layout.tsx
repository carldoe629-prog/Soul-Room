import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soul Room — Where Souls Find Their Room",
  description: "The world's safest and most engaging platform for meaningful human connection. See them. Hear them. Know them.",
  keywords: ["dating app", "social platform", "voice rooms", "soul room", "connection", "community"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' capacitor://*; connect-src 'self' capacitor://* https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com capacitor://*; font-src 'self' https://fonts.gstatic.com capacitor://*; img-src 'self' blob: data: https://*.supabase.co capacitor://*;"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (navigator.userAgent.includes('Capacitor') && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
                window.location.replace('/welcome.html');
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0B0E14" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      {/* Suppress hydration warning to ignore classes like "antigravity-scroll-lock" added by browser bots/extensions */}
      <body className="antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
