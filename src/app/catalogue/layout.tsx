import { requireAuthUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "Book Catalogue | Library Management System",
  description: "Browse, search, and manage book holdings and physical copies in the library catalogue.",
};

export default async function CatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side route protection: redirects to /login if unauthenticated or non-active
  const { appUser } = await requireAuthUser();

  return (
    <AppShell
      user={appUser}
      title="Book Catalogue"
      subtitle="Holdings, Classification & Inventory"
    >
      {children}
    </AppShell>
  );
}
