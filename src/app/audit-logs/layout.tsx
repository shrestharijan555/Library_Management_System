import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "System Audit Logs | Library Management System",
  description: "Immutable institutional audit trail of all library operations.",
};

export default async function AuditLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="System Audit Logs"
      subtitle="Security, Compliance & Transaction Audit Trail"
    >
      {children}
    </AppShell>
  );
}
