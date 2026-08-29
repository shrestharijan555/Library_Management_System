import React from "react";
import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Members Directory | Library Management System",
  description: "Manage institutional library member accounts, borrowing privileges, and standing.",
};

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="Members Directory"
      subtitle="Institutional Membership Roster & Account Privileges"
    >
      {children}
    </AppShell>
  );
}
