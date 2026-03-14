export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
    );
    const users: { id: string }[] = await res.json();
    if (Array.isArray(users) && users.length > 0) {
      return users.map((u) => ({ userId: u.id }));
    }
  } catch {}
  return [{ userId: 'placeholder' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
