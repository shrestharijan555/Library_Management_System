// src/app/actions/circulation.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, bookCopies, loans, reservations, auditLogs } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { DEFAULT_LIBRARY_POLICIES } from "@/config/site";
import {
  issueLoanSchema,
  returnLoanSchema,
  renewLoanSchema,
  reserveBookSchema,
  cancelReservationSchema,
  memberLookupSchema,
} from "@/lib/circulation/validation";
import type {
  IssueLoanInput,
  ReturnLoanInput,
  RenewLoanInput,
  ReserveBookInput,
  CancelReservationInput,
} from "@/lib/circulation/validation";
import { syncBookCopyCounters } from "@/app/actions/inventory";

// Helper for audit logging
async function recordAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  details: unknown,
  userId: string
) {
  await db.insert(auditLogs).values({
    userId,
    action,
    entityType,
    entityId: entityId ?? undefined,
    details: JSON.stringify(details),
    ipAddress: null,
    userAgent: null,
  });
}

export interface CirculationResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
  data?: unknown;
}

/** Issue (checkout) a book copy to a member. */
export async function issueLoanAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.ISSUE_BOOK)) {
    return { error: "Unauthorized to issue loans" };
  }

  const raw: IssueLoanInput = {
    copyId: formData.get("copyId")?.toString().trim() ?? "",
    memberCode: formData.get("memberCode")?.toString().trim() ?? "",
  };

  const validation = issueLoanSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { copyId, memberCode } = validation.data;

  // Resolve member by code
  const appUser = await db.query.users.findFirst({ where: eq(users.memberCode, memberCode) });
  if (!appUser) {
    return { error: `Member with code ${memberCode} not found` };
  }

  // Resolve copy and ensure available
  const copy = await db.query.bookCopies.findFirst({ where: eq(bookCopies.id, copyId) });
  if (!copy) {
    return { error: "Copy not found" };
  }
  if (copy.status !== "available") {
    return { error: `Copy status is ${copy.status}. Only 'available' copies can be issued.` };
  }

  // Enforce loan limits based on policy (placeholder policy object)
  const policy = DEFAULT_LIBRARY_POLICIES[appUser.role as keyof typeof DEFAULT_LIBRARY_POLICIES];
  const activeLoansCount = await db
    .select({ cnt: sql`count(*)` })
    .from(loans)
    .where(and(eq(loans.userId, appUser.id), eq(loans.status, "active")));
  const activeCount = Number(activeLoansCount[0]?.cnt ?? 0);
  if (activeCount >= policy.maxActiveLoans) {
    return { error: `Loan limit reached (${policy.maxActiveLoans}) for role ${appUser.role}` };
  }

  // Compute due date based on policy
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + policy.loanDurationDays);

  // Transaction: create loan, update copy status, sync counters, audit
  try {
    await db.transaction(async (tx) => {
      const [newLoan] = await tx
        .insert(loans)
        .values({
          copyId,
          bookId: copy.bookId,
          userId: appUser.id,
          issuedById: session.appUser.id,
          issueDate: now,
          dueDate,
          status: "active",
          renewalCount: 0,
        })
        .returning();

      await tx.update(bookCopies).set({ status: "borrowed", updatedAt: new Date() }).where(eq(bookCopies.id, copyId));

      await syncBookCopyCounters(copy.bookId);

      await recordAudit(
        "loan_issued",
        "loan",
        newLoan.id,
        { copyId, memberId: appUser.id, dueDate },
        session.appUser.id
      );
    });
  } catch (e) {
    console.error(e);
    return { error: "Failed to issue loan" };
  }

  revalidatePath("/my-loans");
  revalidatePath(`/catalogue/${copy.bookId}`);
  revalidatePath("/dashboard");

  return { success: true, message: "Loan issued successfully" };
}

/** Return (check‑in) a loan */
export async function returnLoanAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.RETURN_BOOK)) {
    return { error: "Unauthorized to return loans" };
  }

  const raw: ReturnLoanInput = { loanId: formData.get("loanId")?.toString().trim() ?? "" };
  const validation = returnLoanSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { loanId } = validation.data;

  const loanRec = await db.query.loans.findFirst({ where: eq(loans.id, loanId) });
  if (!loanRec) return { error: "Loan not found" };
  if (loanRec.status !== "active") return { error: "Only active loans can be returned" };

  const copy = await db.query.bookCopies.findFirst({ where: eq(bookCopies.id, loanRec.copyId) });
  if (!copy) return { error: "Associated copy not found" };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(loans)
        .set({ returnDate: new Date(), status: "returned", updatedAt: new Date() })
        .where(eq(loans.id, loanId));

      // Return copy to available unless it was marked lost/maintenance elsewhere
      const newStatus = copy.status === "borrowed" ? "available" : copy.status;
      await tx.update(bookCopies).set({ status: newStatus, updatedAt: new Date() }).where(eq(bookCopies.id, copy.id));

      await syncBookCopyCounters(copy.bookId);

      // Resolve any pending reservations for the same book
      const pendingRes = await tx
        .select({ id: reservations.id, userId: reservations.userId, queuePosition: reservations.queuePosition })
        .from(reservations)
        .where(and(eq(reservations.bookId, copy.bookId), eq(reservations.status, "pending")))
        .orderBy(reservations.queuePosition)
        .limit(1);

      if (pendingRes.length > 0) {
        const res = pendingRes[0];
        // Mark reservation fulfilled and assign copy status to reserved
        await tx
          .update(reservations)
          .set({ status: "fulfilled", updatedAt: new Date() })
          .where(eq(reservations.id, res.id));
        await tx.update(bookCopies).set({ status: "reserved", updatedAt: new Date() }).where(eq(bookCopies.id, copy.id));
        await recordAudit(
          "reservation_fulfilled",
          "reservation",
          res.id,
          { copyId: copy.id, memberId: res.userId },
          session.appUser.id
        );
      }

      await recordAudit("loan_returned", "loan", loanId, { copyId: copy.id }, session.appUser.id);
    });
  } catch (e) {
    console.error(e);
    return { error: "Failed to process return" };
  }

  revalidatePath("/my-loans");
  revalidatePath(`/catalogue/${copy.bookId}`);
  revalidatePath("/dashboard");
  return { success: true, message: "Loan returned successfully" };
}

/** Renew an active loan */
export async function renewLoanAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.RENEW_BOOK)) {
    return { error: "Unauthorized to renew loans" };
  }
  const raw: RenewLoanInput = { loanId: formData.get("loanId")?.toString().trim() ?? "" };
  const validation = renewLoanSchema.safeParse(raw);
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };
  const { loanId } = validation.data;

  const loanRec = await db.query.loans.findFirst({ where: eq(loans.id, loanId) });
  if (!loanRec) return { error: "Loan not found" };
  if (loanRec.status !== "active") return { error: "Only active loans can be renewed" };

  const user = await db.query.users.findFirst({ where: eq(users.id, loanRec.userId) });
  if (!user) return { error: "Borrower not found" };

  const policy = DEFAULT_LIBRARY_POLICIES[user.role as keyof typeof DEFAULT_LIBRARY_POLICIES];
  const currentRenewals = Number(loanRec.renewalCount ?? 0);
    if (currentRenewals >= policy.maxRenewals) {
      return { error: `Renewal limit reached (${policy.maxRenewals}) for this loan` };
    }

  const newDue = new Date(loanRec.dueDate);
  newDue.setDate(newDue.getDate() + policy.loanDurationDays);

  try {
    await db.transaction(async (tx) => {
        await tx
          .update(loans)
          .set({
            dueDate: newDue,
            renewalCount: currentRenewals + 1,
            updatedAt: new Date(),
          })
          .where(eq(loans.id, loanId));
        await recordAudit(
          "loan_renewed",
          "loan",
          loanId,
          { newDueDate: newDue },
          session.appUser.id
        );
      });
  } catch (e) {
    console.error(e);
    return { error: "Failed to renew loan" };
  }

  revalidatePath("/my-loans");
  return { success: true, message: "Loan renewed successfully" };
}

/** Reserve a book for a member */
export async function reserveBookAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.RESERVE_BOOK)) {
    return { error: "Unauthorized to reserve books" };
  }
  const raw: ReserveBookInput = {
    bookId: formData.get("bookId")?.toString().trim() ?? "",
    memberCode: formData.get("memberCode")?.toString().trim() ?? "",
  };
  const validation = reserveBookSchema.safeParse(raw);
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };
  const { bookId, memberCode } = validation.data;

  const member = await db.query.users.findFirst({ where: eq(users.memberCode, memberCode) });
  if (!member) return { error: "Member not found" };

  // Prevent duplicate pending reservation
  const existing = await db.query.reservations.findFirst({
    where: and(eq(reservations.bookId, bookId), eq(reservations.userId, member.id), eq(reservations.status, "pending")),
  });
  if (existing) return { error: "You already have a pending reservation for this title" };

  // Determine next queue position
  const maxPosRes = await db
    .select({ maxPos: sql`max(queue_position)` })
    .from(reservations)
    .where(eq(reservations.bookId, bookId));
  const nextPos = Number(maxPosRes[0]?.maxPos ?? 0) + 1;

  try {
    await db.transaction(async (tx) => {
      const [newRes] = await tx
        .insert(reservations)
        .values({
          bookId,
          userId: member.id,
          reservationDate: new Date(),
          expiryDate: null,
          status: "pending",
          queuePosition: nextPos,
        })
        .returning();
      await recordAudit(
        "reservation_created",
        "reservation",
        newRes.id,
        { bookId, memberId: member.id, queuePosition: nextPos },
        session.appUser.id
      );
    });
  } catch (e) {
    console.error(e);
    return { error: "Failed to create reservation" };
  }

  revalidatePath(`/catalogue/${bookId}`);
  revalidatePath("/dashboard");
  return { success: true, message: "Reservation placed" };
}

/** Cancel a reservation */
export async function cancelReservationAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.RESERVE_BOOK)) {
    return { error: "Unauthorized to cancel reservations" };
  }
  const raw: CancelReservationInput = { reservationId: formData.get("reservationId")?.toString().trim() ?? "" };
  const validation = cancelReservationSchema.safeParse(raw);
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };
  const { reservationId } = validation.data;

  const reservation = await db.query.reservations.findFirst({ where: eq(reservations.id, reservationId) });
  if (!reservation) return { error: "Reservation not found" };

  // Only owner or librarian/admin can cancel
  const isOwner = reservation.userId === session.appUser.id;
    const canManage = session.appUser.role === "librarian" || session.appUser.role === "admin";
    if (!isOwner && !canManage) {
      return { error: "You cannot cancel this reservation" };
    }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(reservations).where(eq(reservations.id, reservationId));
      // Decrement queue positions of later reservations
      await tx
        .update(reservations)
        .set({ queuePosition: sql`queue_position - 1` })
        .where(and(eq(reservations.bookId, reservation.bookId), sql`queue_position > ${reservation.queuePosition}`));
      await recordAudit("reservation_cancelled", "reservation", reservationId, {}, session.appUser.id);
    });
  } catch (e) {
    console.error(e);
    return { error: "Failed to cancel reservation" };
  }

  revalidatePath(`/catalogue/${reservation.bookId}`);
  return { success: true, message: "Reservation cancelled" };
}

/** Lookup a member by library code */
export async function lookupMemberAction(memberCode: string): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.VIEW_MEMBERS)) {
      return { error: "Unauthorized to lookup members" };
    }
  const validation = memberLookupSchema.safeParse({ memberCode });
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };

  const member = await db.query.users.findFirst({ where: eq(users.memberCode, memberCode) });
  if (!member) return { error: "Member not found" };

  // Gather active loan count
  const activeLoans = await db
    .select({ cnt: sql`count(*)` })
    .from(loans)
    .where(and(eq(loans.userId, member.id), eq(loans.status, "active")));

  return {
    success: true,
    data: {
      user: member,
      activeLoanCount: Number(activeLoans[0]?.cnt ?? 0),
    },
  };
}

// Note: syncBookCopyCounters imported from inventory actions ensures book counters stay consistent.
