"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  ArrowRightLeft,
  Users,
  BookMarked,
  Receipt,
  FileText,
  Settings,
  ShieldAlert,
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
  "/circulation": ArrowRightLeft,
  "/members": Users,
  "/my-loans": BookMarked,
  "/fines": Receipt,
  "/reports": FileText,
  "/audit-logs": ShieldAlert,
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
        return "default" as const;
      case "librarian":
        return "secondary" as const;
      case "staff":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white text-zinc-900 transition-colors duration-150 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-semibold text-zinc-900 transition-opacity hover:opacity-85 dark:text-zinc-50"
          onClick={onNavigate}
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-xs dark:bg-zinc-100 dark:text-zinc-900">
            <BookOpen className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
              {siteConfig.shortName}
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Library Management
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Navigation
        </div>
        <nav className="space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = NAV_ICON_MAP[item.href] || LayoutDashboard;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-white dark:text-zinc-900"
                        : "text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Context & Role Footer */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 transition-colors dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Account Role
            </span>
            <Badge
              variant={getRoleBadgeVariant(user.role)}
              className="px-2 py-0 text-[10px] font-semibold capitalize"
            >
              {user.role}
            </Badge>
          </div>
          <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {user.fullName}
          </p>
          <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            ID: {user.memberCode}
          </p>
        </div>
      </div>
    </aside>
  );
}
