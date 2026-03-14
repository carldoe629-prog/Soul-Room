export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rooms?select=id,world_id`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } }
    );
    const rooms: { id: string; world_id: string }[] = await res.json();
    if (Array.isArray(rooms) && rooms.length > 0) {
      return rooms.map((r) => ({ worldId: r.world_id, roomId: r.id }));
    }
  } catch {}
  return [{ worldId: 'placeholder', roomId: 'placeholder' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
