// src/components/layout/notification-bell.tsx
"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  BookOpen,
  DollarSign,
  AlertCircle,
  BookmarkCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

function formatNotificationTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      try {
        const res = await getUserNotificationsAction();
        if (mounted) {
          setItems(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      getUserNotificationsAction()
        .then((res) => {
          setItems(res.notifications);
          setUnreadCount(res.unreadCount);
        })
        .catch((err) => console.error(err));
    }
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const handleMarkAllRead = () => {
    setLoading(true);
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      setLoading(false);
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reservation_ready":
      case "reservation_created":
        return <BookmarkCheck className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case "fine_assessed":
      case "fine_paid":
      case "fine_waived":
        return <DollarSign className="size-4 text-amber-600 dark:text-amber-400" />;
      case "loan_overdue":
        return <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />;
      case "loan_issued":
      case "loan_returned":
      case "loan_renewed":
      default:
        return <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer transition-colors"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in-50 zoom-in-95 duration-100 overflow-hidden"
          role="region"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                  {unreadCount} new
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="h-7 text-xs text-zinc-500 hover:text-zinc-900 px-2 flex items-center gap-1"
              >
                {loading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                Mark all read
              </Button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-100">
            {items.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">
                <Bell className="size-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  You will receive alerts here for loan due dates, hold availability, and fine notices.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition-colors flex gap-3 ${
                    item.isRead
                      ? "bg-white hover:bg-zinc-50/70 text-zinc-600"
                      : "bg-indigo-50/40 hover:bg-indigo-50/70 text-zinc-900 font-medium"
                  }`}
                >
                  <div className="mt-0.5 shrink-0 rounded-lg p-1.5 bg-zinc-100/80 dark:bg-zinc-800/80">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-zinc-900 truncate">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(item.id)}
                          title="Mark as read"
                          className="text-zinc-400 hover:text-indigo-600 p-0.5 shrink-0"
                        >
                          <Check className="size-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100/80 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatNotificationTime(item.createdAt)}
                      </span>

                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={() => {
                            if (!item.isRead) handleMarkRead(item.id);
                            setIsOpen(false);
                          }}
                          className="text-indigo-600 font-medium hover:underline flex items-center gap-0.5"
                        >
                          View details
                          <ExternalLink className="size-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
