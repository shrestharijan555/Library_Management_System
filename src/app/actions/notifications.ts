// src/app/actions/notifications.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, type NewNotification } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";

import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

type DbExecutor = PostgresJsDatabase<typeof schema> | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type NotificationType =
  | "loan_issued"
  | "loan_due_soon"
  | "loan_overdue"
  | "loan_returned"
  | "loan_renewed"
  | "reservation_ready"
  | "reservation_created"
  | "reservation_cancelled"
  | "fine_assessed"
  | "fine_paid"
  | "fine_waived"
  | "system";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}

export interface NotificationActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
}

/**
 * Internal helper to insert a notification safely within or outside a transaction.
 */
export async function sendNotification(
  executor: DbExecutor,
  input: CreateNotificationInput
) {
  try {
    const record: NewNotification = {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link ?? null,
      isRead: false,
    };
    await executor.insert(notifications).values(record);
  } catch (err) {
    console.error("Failed to insert in-app notification:", err);
  }
}

/**
 * Fetch latest notifications for the current authenticated user.
 */
export async function getUserNotificationsAction(): Promise<{
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
  }>;
  unreadCount: number;
}> {
  try {
    const session = await requireAuthUser();
    const userId = session.appUser.id;

    const list = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const [unreadRes] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const unreadCount = Number(unreadRes?.count ?? 0);

    return {
      notifications: list.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : null,
      })),
      unreadCount,
    };
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const session = await requireAuthUser();
  const userId = session.appUser.id;

  try {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    console.error("Error marking notification as read:", err);
    return { error: "Failed to mark notification as read." };
  }
}

/**
 * Mark all unread notifications for the current user as read.
 */
export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const session = await requireAuthUser();
  const userId = session.appUser.id;

  try {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    revalidatePath("/", "layout");
    return { success: true, message: "All notifications marked as read." };
  } catch (err) {
    console.error("Error marking all notifications read:", err);
    return { error: "Failed to mark notifications read." };
  }
}
