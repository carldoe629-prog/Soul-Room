import { MOCK_WORLDS } from '@/lib/mock-data';

export function generateStaticParams() {
  return MOCK_WORLDS.map((w) => ({
    worldId: w.id,
  }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
