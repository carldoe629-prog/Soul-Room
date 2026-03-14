export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/conversations?select=id`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
    );
    const convos: { id: string }[] = await res.json();
    if (Array.isArray(convos) && convos.length > 0) {
      return convos.map((c) => ({ conversationId: c.id }));
    }
  } catch {}
  return [{ conversationId: 'placeholder' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
