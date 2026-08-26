"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User as UserIcon,
  LogOut,
  Shield,
  CreditCard,
  Mail,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

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
    <div className="relative" ref={menuRef}>
      {/* Menu Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User Account Menu"
        className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white p-1.5 pr-3 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-1 cursor-pointer"
      >
        {/* Avatar Circle */}
        <div className="flex size-8 items-center justify-center rounded-md bg-zinc-900 text-xs font-semibold text-zinc-50 shadow-sm">
          {getInitials(user.fullName)}
        </div>

        <div className="hidden flex-col text-left sm:flex">
          <span className="truncate text-xs font-semibold text-zinc-900 max-w-[130px]">
            {user.fullName}
          </span>
          <span className="truncate text-[11px] text-zinc-400 capitalize">
            {user.role}
          </span>
        </div>

        <ChevronDown className="size-3.5 text-zinc-400" />
      </button>

      {/* Account Popover Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-zinc-200 bg-white p-3 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Details Header */}
          <div className="border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-zinc-50 shadow-sm">
                {getInitials(user.fullName)}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="truncate text-sm font-bold text-zinc-900">
                  {user.fullName}
                </h4>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge
                    variant={getRoleBadgeVariant(user.role)}
                    className="px-2 py-0 text-[10px] font-semibold capitalize"
                  >
                    <Shield className="mr-1 size-2.5 inline" />
                    {user.role}
                  </Badge>
                  <Badge
                    variant="success"
                    className="px-1.5 py-0 text-[10px] font-semibold capitalize"
                  >
                    <CheckCircle2 className="mr-1 size-2.5 inline" />
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Details Section */}
          <div className="space-y-2 py-3 text-xs text-zinc-600 border-b border-zinc-100">
            <div className="flex items-center gap-2 truncate">
              <Mail className="size-3.5 shrink-0 text-zinc-400" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="size-3.5 shrink-0 text-zinc-400" />
              <span>Member ID: {user.memberCode}</span>
            </div>
            {(user.department || user.gradeClass) && (
              <div className="flex items-center gap-2">
                <UserIcon className="size-3.5 shrink-0 text-zinc-400" />
                <span>Dept: {user.department || user.gradeClass}</span>
              </div>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="pt-2">
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              >
                <LogOut className="mr-2 size-3.5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
