"use client";

import React from "react";
import { Menu, BookOpen, ShieldCheck } from "lucide-react";
import { UserMenu } from "./user-menu";
import type { User } from "@/types";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left Area: Mobile Trigger & Context Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Menu Button */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open mobile navigation menu"
          className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        {/* Page Context Branding / Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg">
              {title}
            </h1>
            <Badge
              variant="outline"
              className="hidden items-center gap-1 text-[10px] sm:inline-flex"
            >
              <ShieldCheck className="size-3 text-emerald-600" />
              Authenticated Session
            </Badge>
          </div>
          <p className="hidden text-xs text-zinc-500 md:block">{subtitle}</p>
        </div>
      </div>

      {/* Right Area: System Name & User Menu */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 border-r border-zinc-200 pr-3 text-xs text-zinc-500 xl:flex">
          <BookOpen className="size-3.5 text-zinc-400" />
          <span>{siteConfig.name}</span>
        </div>

        {/* User Account Popover */}
        <UserMenu user={user} />
      </div>
    </header>
  );
}
