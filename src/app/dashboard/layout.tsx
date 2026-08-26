import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side route protection: redirects to /login if unauthenticated or non-active
  const { appUser } = await requireAuthUser();

  return <AppShell user={appUser}>{children}</AppShell>;
}
