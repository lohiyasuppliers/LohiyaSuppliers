import { requireAuth } from "@/lib/session";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
