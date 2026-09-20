import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Settings & System Policies | Library Management System",
  description: "Configure borrowing limits, loan durations, fine rates, and institution info.",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="System Settings"
      subtitle="Institutional Preferences & Borrowing Policy Engine"
    >
      {children}
    </AppShell>
  );
}
