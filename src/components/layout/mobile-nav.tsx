"use client";

import React, { useEffect } from "react";
import { X, BookOpen } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import type { User } from "@/types";
import { siteConfig } from "@/config/site";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  // Prevent scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 left-0 flex w-72 max-w-full flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200 dark:bg-zinc-950 dark:border-r dark:border-zinc-800">
        {/* Close Button Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 font-semibold text-zinc-900 dark:text-zinc-50">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              <BookOpen className="size-4.5" />
            </div>
            <span className="text-sm font-bold">{siteConfig.shortName}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          <AppSidebar user={user} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
