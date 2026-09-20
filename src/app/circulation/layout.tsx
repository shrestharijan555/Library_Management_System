import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Circulation Desk | Library Management System",
  description: "Manage book checkouts, returns, renewals, and reservation queues.",
};

export default async function CirculationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="Circulation Desk"
      subtitle="Barcode-Driven Loan Management & Waitlists"
    >
      {children}
    </AppShell>
  );
}
