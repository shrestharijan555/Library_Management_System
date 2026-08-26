"use client";

import React, { useState } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { MobileNav } from "./mobile-nav";
import type { User } from "@/types";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({
  user,
  children,
  title = "Dashboard",
  subtitle = "Library Operations Overview",
}: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-900">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden shrink-0 lg:block lg:w-64">
        <AppSidebar user={user} />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Application Header */}
        <AppHeader
          user={user}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
