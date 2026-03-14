export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/worlds?select=id`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
    );
    const worlds: { id: string }[] = await res.json();
    if (Array.isArray(worlds) && worlds.length > 0) {
      return worlds.map((w) => ({ worldId: w.id }));
    }
  } catch {}
  return [{ worldId: 'placeholder' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
