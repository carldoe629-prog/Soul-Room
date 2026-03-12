import { MOCK_USERS } from '@/lib/mock-data';

export function generateStaticParams() {
  return MOCK_USERS.map((u) => ({
    userId: u.id,
  }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
