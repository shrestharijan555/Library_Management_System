import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "My Library Portal | Library Management System",
  description: "View your active loans, holds, borrowing history, and dues.",
};

export default async function MyLoansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="My Library Portal"
      subtitle="Personal Borrowing, Holds & Account Overview"
    >
      {children}
    </AppShell>
  );
}
