"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  BookCopy,
  Users,
  BookMarked,
  Receipt,
  FileText,
  Settings,
  Shield,
  Clock,
} from "lucide-react";
import { MAIN_NAV_ITEMS, siteConfig } from "@/config/site";
import type { UserRole } from "@/config/roles";
import type { User } from "@/types";
import { Badge } from "@/components/ui/badge";

interface AppSidebarProps {
  user: User;
  onNavigate?: () => void;
}

const NAV_ICON_MAP: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/catalogue": Library,
  "/circulation": BookCopy,
  "/members": Users,
  "/my-loans": BookMarked,
  "/fines": Receipt,
  "/reports": FileText,
  "/settings": Settings,
};

export function AppSidebar({ user, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  // Filter navigation items by user role
  const allowedNavItems = MAIN_NAV_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(user.role as UserRole);
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive" as const;
      case "librarian":
        return "default" as const;
      case "staff":
        return "info" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white text-zinc-900">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-semibold text-zinc-900 transition-opacity hover:opacity-80"
          onClick={onNavigate}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-sm">
            <BookOpen className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight tracking-tight">
              {siteConfig.shortName}
            </span>
            <span className="text-[11px] font-medium text-zinc-400">
              Library Console
            </span>
          </div>
        </Link>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-mono">
          v{siteConfig.version}
        </Badge>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Navigation Menu
        </div>
        <nav className="space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = NAV_ICON_MAP[item.href] || LayoutDashboard;
            const isActive = pathname === item.href;
            const isImplemented =
              item.href === "/dashboard" ||
              item.href.startsWith("/catalogue") ||
              item.href.startsWith("/members");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-zinc-50 shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4 shrink-0 ${
                      isActive ? "text-zinc-50" : "text-zinc-400 group-hover:text-zinc-700"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>

                {!isImplemented && (
                  <span
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      isActive
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                    }`}
                  >
                    <Clock className="size-2.5" />
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Context & Role Footer */}
      <div className="border-t border-zinc-100 p-4">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-zinc-400">Account Access</span>
            <Badge
              variant={getRoleBadgeVariant(user.role)}
              className="px-2 py-0 text-[10px] font-semibold capitalize"
            >
              <Shield className="mr-1 size-2.5 inline" />
              {user.role}
            </Badge>
          </div>
          <p className="truncate text-xs font-semibold text-zinc-900">
            {user.fullName}
          </p>
          <p className="truncate text-[11px] text-zinc-500">
            ID: {user.memberCode}
          </p>
        </div>
      </div>
    </aside>
  );
}
