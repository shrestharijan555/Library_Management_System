// src/app/actions/fines.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { fines, users, auditLogs } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";

const payFineSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID"),
  paymentMethod: z.enum(["cash", "card", "online", "other"]).default("cash"),
  receiptNotes: z.string().max(255).optional(),
});

const waiveFineSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID"),
  waiveReason: z.string().min(3, "Waive reason is required").max(255),
});

const createFineSchema = z.object({
  memberCode: z.string().min(1, "Member code is required"),
  amountCents: z.coerce.number().min(50, "Minimum fine is $0.50").max(50000, "Maximum fine is $500.00"),
  reason: z.string().min(3, "Reason is required").max(255),
});

export interface FineActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

// Record fine payment
export async function payFineAction(_prevState: unknown, formData: FormData): Promise<FineActionResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.COLLECT_FINE)) {
    return { error: "Unauthorized. You do not have permission to collect fines." };
  }

  const raw = {
    fineId: formData.get("fineId")?.toString().trim() ?? "",
    paymentMethod: (formData.get("paymentMethod")?.toString().trim() || "cash") as "cash" | "card" | "online" | "other",
    receiptNotes: formData.get("receiptNotes")?.toString().trim() || undefined,
  };

  const validation = payFineSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { fineId, paymentMethod, receiptNotes } = validation.data;

  const fineRec = await db.query.fines.findFirst({ where: eq(fines.id, fineId) });
  if (!fineRec) return { error: "Fine record was not found." };
  if (fineRec.status !== "unpaid") {
    return { error: `Fine is already marked as ${fineRec.status}.` };
  }

  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(fines)
        .set({
          status: "paid",
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(fines.id, fineId));

      await tx.insert(auditLogs).values({
        userId: session.appUser.id,
        action: "fine_paid",
        entityType: "fine",
        entityId: fineId,
        details: JSON.stringify({
          amountCents: fineRec.amountCents,
          targetUserId: fineRec.userId,
          paymentMethod,
          receiptNotes,
        }),
      });
    });
  } catch (err) {
    console.error("Pay fine error:", err);
    return { error: "Failed to record fine payment." };
  }

  revalidatePath("/fines");
  revalidatePath("/my-loans");
  revalidatePath("/circulation");
  revalidatePath("/dashboard");

  return { success: true, message: `Payment of $${(fineRec.amountCents / 100).toFixed(2)} recorded.` };
}

// Waive fine
export async function waiveFineAction(_prevState: unknown, formData: FormData): Promise<FineActionResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.WAIVE_FINE)) {
    return { error: "Unauthorized. You do not have permission to waive fines." };
  }

  const raw = {
    fineId: formData.get("fineId")?.toString().trim() ?? "",
    waiveReason: formData.get("waiveReason")?.toString().trim() ?? "",
  };

  const validation = waiveFineSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { fineId, waiveReason } = validation.data;

  const fineRec = await db.query.fines.findFirst({ where: eq(fines.id, fineId) });
  if (!fineRec) return { error: "Fine record was not found." };
  if (fineRec.status !== "unpaid") {
    return { error: `Fine is already marked as ${fineRec.status}.` };
  }

  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(fines)
        .set({
          status: "waived",
          waivedById: session.appUser.id,
          reason: `${fineRec.reason} (Waived: ${waiveReason})`,
          updatedAt: now,
        })
        .where(eq(fines.id, fineId));

      await tx.insert(auditLogs).values({
        userId: session.appUser.id,
        action: "fine_waived",
        entityType: "fine",
        entityId: fineId,
        details: JSON.stringify({
          amountCents: fineRec.amountCents,
          targetUserId: fineRec.userId,
          waiveReason,
          waivedBy: session.appUser.fullName,
        }),
      });
    });
  } catch (err) {
    console.error("Waive fine error:", err);
    return { error: "Failed to waive fine." };
  }

  revalidatePath("/fines");
  revalidatePath("/my-loans");
  revalidatePath("/circulation");
  revalidatePath("/dashboard");

  return { success: true, message: `Fine of $${(fineRec.amountCents / 100).toFixed(2)} has been waived.` };
}

// Assess manual fine
export async function createManualFineAction(
  _prevState: unknown,
  formData: FormData
): Promise<FineActionResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.COLLECT_FINE)) {
    return { error: "Unauthorized to assess manual fines." };
  }

  const raw = {
    memberCode: formData.get("memberCode")?.toString().trim() ?? "",
    amountCents: formData.get("amountCents")?.toString().trim() ?? "",
    reason: formData.get("reason")?.toString().trim() ?? "",
  };

  const validation = createFineSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { memberCode, amountCents, reason } = validation.data;

  const member = await db.query.users.findFirst({
    where: sql`LOWER(${users.memberCode}) = LOWER(${memberCode})`,
  });
  if (!member) {
    return { error: `Member with code "${memberCode}" was not found.` };
  }

  try {
    const [newFine] = await db
      .insert(fines)
      .values({
        userId: member.id,
        amountCents,
        status: "unpaid",
        reason,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: session.appUser.id,
      action: "fine_manually_assessed",
      entityType: "fine",
      entityId: newFine.id,
      details: JSON.stringify({
        amountCents,
        targetUserId: member.id,
        reason,
      }),
    });
  } catch (err) {
    console.error("Manual fine error:", err);
    return { error: "Failed to create fine record." };
  }

  revalidatePath("/fines");
  revalidatePath("/my-loans");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Fine of $${(amountCents / 100).toFixed(2)} assessed to ${member.fullName}.`,
  };
}
