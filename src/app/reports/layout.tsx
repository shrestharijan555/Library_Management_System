import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Reports & Analytics | Library Management System",
  description: "Institutional reporting, circulation metrics, and analytics.",
};

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="Reports & Analytics"
      subtitle="Circulation Metrics & Institutional Intelligence"
    >
      {children}
    </AppShell>
  );
}
