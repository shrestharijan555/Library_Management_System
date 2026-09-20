import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Fines & Dues Management | Library Management System",
  description: "Track late return penalties, collect dues, issue fee waivers, and view revenue.",
};

export default async function FinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="Fines & Dues Management"
      subtitle="Penalties, Collections, Fee Waivers & History"
    >
      {children}
    </AppShell>
  );
}
