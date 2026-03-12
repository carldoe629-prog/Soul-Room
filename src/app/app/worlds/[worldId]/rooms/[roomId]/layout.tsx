import { MOCK_ROOMS } from '@/lib/mock-data';

export function generateStaticParams() {
  return MOCK_ROOMS.map((r) => ({
    worldId: r.worldId,
    roomId: r.id,
  }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
