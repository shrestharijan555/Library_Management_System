"use client";

import React from "react";
import { Menu, BookOpen } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import type { User } from "@/types";
import { siteConfig } from "@/config/site";

interface AppHeaderProps {
  user: User;
  onOpenMobileNav: () => void;
  title?: string;
  subtitle?: string;
}

export function AppHeader({
  user,
  onOpenMobileNav,
  title = "Dashboard",
  subtitle = "Library Operations Overview",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-sm transition-colors duration-150 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/95">
      {/* Left Area: Mobile Trigger & Context Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Menu Button */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open mobile navigation menu"
          className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer lg:hidden dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          <Menu className="size-5" />
        </button>

        {/* Page Context Branding / Title */}
        <div className="flex flex-col">
          <h1 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden text-xs text-zinc-500 md:block dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Area: System Name, Theme Toggle, Notifications & User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden items-center gap-2 border-r border-zinc-200 pr-3 text-xs text-zinc-500 xl:flex dark:border-zinc-800 dark:text-zinc-400">
          <BookOpen className="size-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>{siteConfig.name}</span>
        </div>

        {/* Theme Toggle (Light / Dark Mode) */}
        <ThemeToggle />

        {/* In-App Notifications Bell Popover */}
        <NotificationBell />

        {/* User Account Popover */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
