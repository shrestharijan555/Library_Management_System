// src/app/actions/circulation.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, bookCopies, books, loans, reservations, fines, auditLogs } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import {
  getPolicyForRole,
  calculateOverdueFine,
  RESERVATION_HOLD_EXPIRY_DAYS,
} from "@/lib/circulation/policies";
import {
  issueLoanSchema,
  issueLoanByBarcodeSchema,
  returnLoanSchema,
  returnLoanByBarcodeSchema,
  renewLoanSchema,
  reserveBookSchema,
  cancelReservationSchema,
  memberLookupSchema,
} from "@/lib/circulation/validation";
import type {
  IssueLoanInput,
  IssueLoanByBarcodeInput,
  ReturnLoanInput,
  ReturnLoanByBarcodeInput,
  RenewLoanInput,
  ReserveBookInput,
  CancelReservationInput,
} from "@/lib/circulation/validation";
import { syncBookCopyCounters } from "@/app/actions/inventory";
import { sendNotification } from "@/app/actions/notifications";

import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

type DbExecutor = PostgresJsDatabase<typeof schema> | Parameters<Parameters<typeof db.transaction>[0]>[0];

// Helper for audit logging
async function recordAudit(
  executor: DbExecutor,
  action: string,
  entityType: string,
  entityId: string | null,
  details: unknown,
  userId: string
) {
  try {
    await executor.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId: entityId ?? undefined,
      details: JSON.stringify(details),
      ipAddress: null,
      userAgent: null,
    });
  } catch (err) {
    console.error("Audit log recording error:", err);
  }
}

export interface CirculationResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
  data?: unknown;
}

/** Issue (checkout) a book copy to a member by copy ID. */
export async function issueLoanAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.ISSUE_BOOK)) {
    return { error: "Unauthorized. You do not have permission to issue loans." };
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
  const appUser = await db.query.users.findFirst({
    where: sql`LOWER(${users.memberCode}) = LOWER(${memberCode})`,
  });
  if (!appUser) {
    return { error: `Member with card code "${memberCode}" was not found.` };
  }
  if (appUser.status !== "active") {
    return { error: `Member account is currently ${appUser.status}. Cannot issue books.` };
  }

  // Resolve copy and book
  const copy = await db.query.bookCopies.findFirst({
    where: eq(bookCopies.id, copyId),
    with: { book: true },
  });
  if (!copy || !copy.book) {
    return { error: "Physical copy record was not found." };
  }

  // Check copy availability or reservation hold
  if (copy.status !== "available" && copy.status !== "reserved") {
    return { error: `Copy status is "${copy.status}". Only available or reserved copies can be checked out.` };
  }

  // If copy is reserved, ensure it's either held for this member or staff overrides
  const pendingHold = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.bookId, copy.bookId),
      eq(reservations.userId, appUser.id),
      sql`${reservations.status} IN ('pending', 'fulfilled')`
    ),
    orderBy: desc(reservations.createdAt),
  });

  // Enforce loan limits based on dynamic policy
  const policy = await getPolicyForRole(appUser.role);
  const activeLoansCount = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(loans)
    .where(and(eq(loans.userId, appUser.id), eq(loans.status, "active")));
  const activeCount = Number(activeLoansCount[0]?.cnt ?? 0);
  if (activeCount >= policy.maxActiveLoans) {
    return {
      error: `Member has reached maximum active loan limit (${policy.maxActiveLoans}) for role ${appUser.role}.`,
    };
  }

  // Check unpaid overdue fines threshold ($50.00 block limit)
  const unpaidFines = await db
    .select({ total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)` })
    .from(fines)
    .where(and(eq(fines.userId, appUser.id), eq(fines.status, "unpaid")));
  const totalUnpaid = Number(unpaidFines[0]?.total ?? 0);
  if (totalUnpaid > 5000) {
    return {
      error: `Member has excessive unpaid fines ($${(totalUnpaid / 100).toFixed(2)}). Fines must be cleared before issuing new books.`,
    };
  }

  // Compute due date based on dynamic policy
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + policy.loanDurationDays);

  try {
    let newLoanId = "";
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

      newLoanId = newLoan.id;

      await tx
        .update(bookCopies)
        .set({ status: "borrowed", updatedAt: now })
        .where(eq(bookCopies.id, copyId));

      // If user had a reservation for this title, mark it fulfilled/completed
      if (pendingHold) {
        await tx
          .update(reservations)
          .set({ status: "fulfilled", updatedAt: now })
          .where(eq(reservations.id, pendingHold.id));
      }

      await syncBookCopyCounters(copy.bookId);

      await recordAudit(
        tx,
        "loan_issued",
        "loan",
        newLoanId,
        { copyId, memberId: appUser.id, dueDate, memberCode },
        session.appUser.id
      );

      // Notify borrower
      await sendNotification(tx, {
        userId: appUser.id,
        title: "Book Checked Out",
        message: `"${copy.book.title}" was checked out to your account. Due date: ${dueDate.toLocaleDateString()}.`,
        type: "loan_issued",
        link: "/my-loans",
      });
    });
  } catch (e) {
    console.error("Issue loan error:", e);
    return { error: "Failed to issue loan due to a database error." };
  }

  revalidatePath("/circulation");
  revalidatePath("/my-loans");
  revalidatePath(`/catalogue/${copy.bookId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Book issued successfully to ${appUser.fullName}. Due date: ${dueDate.toLocaleDateString()}.`,
  };
}

/** Issue a loan using copy Barcode directly. */
export async function issueLoanByBarcodeAction(
  _prevState: unknown,
  formData: FormData
): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.ISSUE_BOOK)) {
    return { error: "Unauthorized to issue loans." };
  }

  const raw: IssueLoanByBarcodeInput = {
    barcode: formData.get("barcode")?.toString().trim() ?? "",
    memberCode: formData.get("memberCode")?.toString().trim() ?? "",
  };

  const validation = issueLoanByBarcodeSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { barcode, memberCode } = validation.data;

  // Find copy by barcode
  const copy = await db.query.bookCopies.findFirst({
    where: sql`LOWER(${bookCopies.barcode}) = LOWER(${barcode})`,
  });
  if (!copy) {
    return { error: `Physical copy with barcode "${barcode}" was not found.` };
  }

  const forwardFormData = new FormData();
  forwardFormData.set("copyId", copy.id);
  forwardFormData.set("memberCode", memberCode);

  return issueLoanAction(null, forwardFormData);
}

/** Return (check‑in) a loan by loanId */
export async function returnLoanAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.RETURN_BOOK)) {
    return { error: "Unauthorized. You do not have permission to process returns." };
  }

  const raw: ReturnLoanInput = { loanId: formData.get("loanId")?.toString().trim() ?? "" };
  const validation = returnLoanSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { loanId } = validation.data;

  const loanRec = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
    with: { book: true },
  });
  if (!loanRec) return { error: "Loan record was not found." };
  if (loanRec.status !== "active" && loanRec.status !== "overdue") {
    return { error: "Only active or overdue loans can be checked in." };
  }

  const copy = await db.query.bookCopies.findFirst({ where: eq(bookCopies.id, loanRec.copyId) });
  if (!copy) return { error: "Associated physical copy record was not found." };

  const borrower = await db.query.users.findFirst({ where: eq(users.id, loanRec.userId) });
  const borrowerRole = borrower?.role ?? "student";
  const policy = await getPolicyForRole(borrowerRole);

  const now = new Date();
  
  // Calculate overdue fine via centralized policy calculator
  const fineCalc = calculateOverdueFine(loanRec.dueDate, now, policy);
  const bookTitle = loanRec.book?.title ?? "Book";

  try {
    await db.transaction(async (tx) => {
      // 1. Update loan record
      await tx
        .update(loans)
        .set({ returnDate: now, status: "returned", updatedAt: now })
        .where(eq(loans.id, loanId));

      // 2. Assess fine if overdue
      if (fineCalc.fineCents > 0 && borrower) {
        await tx.insert(fines).values({
          loanId: loanRec.id,
          userId: borrower.id,
          amountCents: fineCalc.fineCents,
          status: "unpaid",
          reason: `Overdue return for "${bookTitle}" (${fineCalc.daysOverdue} days late)`,
        });

        // Notify borrower of fine
        await sendNotification(tx, {
          userId: borrower.id,
          title: "Overdue Fine Assessed",
          message: `A fine of $${(fineCalc.fineCents / 100).toFixed(2)} was assessed for the late return of "${bookTitle}".`,
          type: "fine_assessed",
          link: "/my-loans",
        });
      }

      // 3. Resolve next eligible hold in queue
      const pendingRes = await tx
        .select({
          id: reservations.id,
          userId: reservations.userId,
          queuePosition: reservations.queuePosition,
        })
        .from(reservations)
        .where(and(eq(reservations.bookId, copy.bookId), eq(reservations.status, "pending")))
        .orderBy(reservations.queuePosition)
        .limit(1);

      let newCopyStatus: "available" | "reserved" = "available";

      if (pendingRes.length > 0) {
        const nextReservation = pendingRes[0];
        newCopyStatus = "reserved";

        // Expiry date for holding copy (7 days from now)
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + RESERVATION_HOLD_EXPIRY_DAYS);

        await tx
          .update(reservations)
          .set({
            status: "fulfilled",
            expiryDate,
            updatedAt: now,
          })
          .where(eq(reservations.id, nextReservation.id));

        await recordAudit(
          tx,
          "reservation_ready",
          "reservation",
          nextReservation.id,
          { copyId: copy.id, memberId: nextReservation.userId, expiryDate },
          session.appUser.id
        );

        // Notify the reserving member that their book is ready for pickup
        await sendNotification(tx, {
          userId: nextReservation.userId,
          title: "Hold Ready for Pickup!",
          message: `Your reserved book "${bookTitle}" is ready for pickup at the circulation desk until ${expiryDate.toLocaleDateString()}.`,
          type: "reservation_ready",
          link: "/my-loans",
        });
      }

      // 4. Update physical copy status
      await tx
        .update(bookCopies)
        .set({ status: newCopyStatus, updatedAt: now })
        .where(eq(bookCopies.id, copy.id));

      await syncBookCopyCounters(copy.bookId);

      await recordAudit(
        tx,
        "loan_returned",
        "loan",
        loanId,
        { copyId: copy.id, fineCents: fineCalc.fineCents, allocatedToHold: pendingRes.length > 0 },
        session.appUser.id
      );

      // Notify borrower of successful check-in
      if (borrower) {
        await sendNotification(tx, {
          userId: borrower.id,
          title: "Book Return Confirmed",
          message: `"${bookTitle}" has been returned successfully.`,
          type: "loan_returned",
          link: "/my-loans",
        });
      }
    });
  } catch (e) {
    console.error("Return error:", e);
    return { error: "Failed to process return." };
  }

  revalidatePath("/circulation");
  revalidatePath("/my-loans");
  revalidatePath("/fines");
  revalidatePath(`/catalogue/${copy.bookId}`);
  revalidatePath("/dashboard");

  const returnMessage = fineCalc.fineCents > 0
    ? `Book returned. ${fineCalc.formattedNotice}`
    : "Book returned successfully.";

  return {
    success: true,
    message: returnMessage,
  };
}

/** Return (check-in) by scanning copy barcode directly. */
export async function returnLoanByBarcodeAction(
  _prevState: unknown,
  formData: FormData
): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.RETURN_BOOK)) {
    return { error: "Unauthorized to process returns." };
  }

  const raw: ReturnLoanByBarcodeInput = {
    barcode: formData.get("barcode")?.toString().trim() ?? "",
  };

  const validation = returnLoanByBarcodeSchema.safeParse(raw);
  if (!validation.success) {
    return { fieldErrors: validation.error.flatten().fieldErrors };
  }
  const { barcode } = validation.data;

  // Find copy
  const copy = await db.query.bookCopies.findFirst({
    where: sql`LOWER(${bookCopies.barcode}) = LOWER(${barcode})`,
  });
  if (!copy) {
    return { error: `No physical copy found with barcode "${barcode}".` };
  }

  // Find active or overdue loan
  const activeLoan = await db.query.loans.findFirst({
    where: and(
      eq(loans.copyId, copy.id),
      sql`${loans.status} IN ('active', 'overdue')`
    ),
  });
  if (!activeLoan) {
    return { error: `Copy "${barcode}" is currently "${copy.status}" and has no active loan.` };
  }

  const forwardFormData = new FormData();
  forwardFormData.set("loanId", activeLoan.id);

  return returnLoanAction(null, forwardFormData);
}

/** Renew an active loan */
export async function renewLoanAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  const raw: RenewLoanInput = { loanId: formData.get("loanId")?.toString().trim() ?? "" };
  const validation = renewLoanSchema.safeParse(raw);
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };
  const { loanId } = validation.data;

  const loanRec = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
    with: { book: true },
  });
  if (!loanRec) return { error: "Loan record was not found." };
  if (loanRec.status !== "active") return { error: "Only active loans can be renewed." };

  // Authorization: borrower themselves or librarian/admin
  const isBorrower = session.appUser.id === loanRec.userId;
  const isStaffLibrarian = hasPermission(session.appUser.role, PERMISSIONS.RENEW_BOOK);
  if (!isBorrower && !isStaffLibrarian) {
    return { error: "Unauthorized to renew this loan." };
  }

  const borrower = await db.query.users.findFirst({ where: eq(users.id, loanRec.userId) });
  if (!borrower) return { error: "Borrower profile was not found." };

  const policy = await getPolicyForRole(borrower.role);
  const currentRenewals = Number(loanRec.renewalCount ?? 0);

  if (currentRenewals >= policy.maxRenewals) {
    return { error: `Renewal limit reached (${policy.maxRenewals} renewals allowed) for this loan.` };
  }

  // Check if title has waiting reservations (prohibit renewal if others are waiting in queue)
  const waitingReservations = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(reservations)
    .where(and(eq(reservations.bookId, loanRec.bookId), eq(reservations.status, "pending")));
  const waitCount = Number(waitingReservations[0]?.cnt ?? 0);
  if (waitCount > 0) {
    return {
      error: `Cannot renew loan: ${waitCount} member(s) are currently on hold for this title.`,
    };
  }

  // Calculate new due date from current due date
  const newDue = new Date(loanRec.dueDate);
  newDue.setDate(newDue.getDate() + policy.loanDurationDays);

  const bookTitle = loanRec.book?.title ?? "Book";

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
        tx,
        "loan_renewed",
        "loan",
        loanId,
        { newDueDate: newDue, renewalsCount: currentRenewals + 1 },
        session.appUser.id
      );

      // Notify borrower
      await sendNotification(tx, {
        userId: borrower.id,
        title: "Loan Renewed",
        message: `Your loan for "${bookTitle}" was renewed until ${newDue.toLocaleDateString()}. (${policy.maxRenewals - (currentRenewals + 1)} renewals remaining)`,
        type: "loan_renewed",
        link: "/my-loans",
      });
    });
  } catch (e) {
    console.error("Renewal error:", e);
    return { error: "Failed to renew loan." };
  }

  revalidatePath("/circulation");
  revalidatePath("/my-loans");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Loan renewed successfully. New due date: ${newDue.toLocaleDateString()}. (${policy.maxRenewals - (currentRenewals + 1)} renewals remaining)`,
  };
}

/** Mark a loan and copy as Lost */
export async function markLoanLostAction(loanId: string, notes?: string): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_INVENTORY)) {
    return { error: "Unauthorized to mark items as lost." };
  }

  const loanRec = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
    with: { book: true },
  });
  if (!loanRec) return { error: "Loan record was not found." };

  const copy = await db.query.bookCopies.findFirst({ where: eq(bookCopies.id, loanRec.copyId) });
  if (!copy) return { error: "Associated copy record was not found." };

  const bookTitle = loanRec.book?.title ?? "Book";

  try {
    await db.transaction(async (tx) => {
      // 1. Update loan
      await tx
        .update(loans)
        .set({
          status: "overdue",
          notes: notes ? `${loanRec.notes ?? ""}\n[LOST]: ${notes}`.trim() : `${loanRec.notes ?? ""}\n[LOST] Item declared lost.`.trim(),
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));

      // 2. Update copy
      await tx
        .update(bookCopies)
        .set({ status: "lost", updatedAt: new Date() })
        .where(eq(bookCopies.id, copy.id));

      // 3. Assess replacement fee fine ($25.00 default = 2500 cents)
      await tx.insert(fines).values({
        loanId: loanRec.id,
        userId: loanRec.userId,
        amountCents: 2500,
        status: "unpaid",
        reason: `Lost book replacement fee (Barcode: ${copy.barcode})`,
      });

      await syncBookCopyCounters(copy.bookId);

      await recordAudit(
        tx,
        "loan_marked_lost",
        "loan",
        loanId,
        { copyId: copy.id, notes },
        session.appUser.id
      );

      // Notify borrower
      await sendNotification(tx, {
        userId: loanRec.userId,
        title: "Lost Item Fee Assessed",
        message: `"${bookTitle}" was marked as lost. A replacement fee of $25.00 has been charged to your account.`,
        type: "fine_assessed",
        link: "/my-loans",
      });
    });
  } catch (e) {
    console.error("Mark lost error:", e);
    return { error: "Failed to mark loan as lost." };
  }

  revalidatePath("/circulation");
  revalidatePath("/my-loans");
  revalidatePath("/fines");
  revalidatePath(`/catalogue/${copy.bookId}`);
  revalidatePath("/dashboard");

  return { success: true, message: "Item marked as lost and replacement fee assessed." };
}

/** Reserve a book for a member */
export async function reserveBookAction(_prevState: unknown, formData: FormData): Promise<CirculationResult> {
  const session = await requireAuthUser();
  const raw: ReserveBookInput = {
    bookId: formData.get("bookId")?.toString().trim() ?? "",
    memberCode: formData.get("memberCode")?.toString().trim() ?? "",
  };
  const validation = reserveBookSchema.safeParse(raw);
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };
  const { bookId, memberCode } = validation.data;

  const member = await db.query.users.findFirst({
    where: sql`LOWER(${users.memberCode}) = LOWER(${memberCode})`,
  });
  if (!member) return { error: `Member with code "${memberCode}" was not found.` };

  // Authorization check: member reserving for themselves OR librarian/admin
  const isSelf = session.appUser.id === member.id;
  const isLibrarian = hasPermission(session.appUser.role, PERMISSIONS.RESERVE_BOOK);
  if (!isSelf && !isLibrarian) {
    return { error: "Unauthorized to place reservations for other members." };
  }

  const bookRec = await db.query.books.findFirst({ where: eq(books.id, bookId) });
  if (!bookRec) return { error: "Book title was not found." };

  // Prevent duplicate pending or fulfilled reservation
  const existing = await db.query.reservations.findFirst({
    where: and(
      eq(reservations.bookId, bookId),
      eq(reservations.userId, member.id),
      sql`${reservations.status} IN ('pending', 'fulfilled')`
    ),
  });
  if (existing) {
    return { error: "You already have an active hold or ready reservation for this title." };
  }

  // Determine next queue position
  const maxPosRes = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(${reservations.queuePosition}), 0)` })
    .from(reservations)
    .where(and(eq(reservations.bookId, bookId), eq(reservations.status, "pending")));
  const nextPos = Number(maxPosRes[0]?.maxPos ?? 0) + 1;

  try {
    let newResId = "";
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

      newResId = newRes.id;

      await recordAudit(
        tx,
        "reservation_created",
        "reservation",
        newResId,
        { bookId, memberId: member.id, queuePosition: nextPos },
        session.appUser.id
      );

      // Notify member
      await sendNotification(tx, {
        userId: member.id,
        title: "Reservation Placed",
        message: `Hold placed for "${bookRec.title}". You are #${nextPos} in the waitlist queue.`,
        type: "reservation_created",
        link: "/my-loans",
      });
    });
  } catch (e) {
    console.error("Reserve error:", e);
    return { error: "Failed to place reservation." };
  }

  revalidatePath(`/catalogue/${bookId}`);
  revalidatePath("/my-loans");
  revalidatePath("/circulation");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Reservation placed successfully! You are #${nextPos} in the waitlist queue.`,
  };
}

/** Cancel a reservation */
export async function cancelReservationAction(
  _prevState: unknown,
  formData: FormData
): Promise<CirculationResult> {
  const session = await requireAuthUser();
  const raw: CancelReservationInput = {
    reservationId: formData.get("reservationId")?.toString().trim() ?? "",
  };
  const validation = cancelReservationSchema.safeParse(raw);
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };
  const { reservationId } = validation.data;

  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, reservationId),
    with: { book: true },
  });
  if (!reservation) return { error: "Reservation record was not found." };
  if (reservation.status === "cancelled") {
    return { error: "Reservation is already cancelled." };
  }

  // Only owner or librarian/admin can cancel
  const isOwner = reservation.userId === session.appUser.id;
  const canManage = session.appUser.role === "librarian" || session.appUser.role === "admin";
  if (!isOwner && !canManage) {
    return { error: "You cannot cancel this reservation." };
  }

  const bookTitle = reservation.book?.title ?? "Book";

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(reservations)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(reservations.id, reservationId));

      // Re-index subsequent queue positions to keep queue contiguous
      if (reservation.status === "pending") {
        await tx
          .update(reservations)
          .set({ queuePosition: sql`${reservations.queuePosition} - 1` })
          .where(
            and(
              eq(reservations.bookId, reservation.bookId),
              eq(reservations.status, "pending"),
              sql`${reservations.queuePosition} > ${reservation.queuePosition}`
            )
          );
      }

      await recordAudit(
        tx,
        "reservation_cancelled",
        "reservation",
        reservationId,
        { bookId: reservation.bookId },
        session.appUser.id
      );

      // Notify reserving member
      await sendNotification(tx, {
        userId: reservation.userId,
        title: "Hold Cancelled",
        message: `Your reservation hold for "${bookTitle}" has been cancelled.`,
        type: "reservation_cancelled",
        link: "/my-loans",
      });
    });
  } catch (e) {
    console.error("Cancel reservation error:", e);
    return { error: "Failed to cancel reservation." };
  }

  revalidatePath(`/catalogue/${reservation.bookId}`);
  revalidatePath("/my-loans");
  revalidatePath("/circulation");

  return { success: true, message: "Reservation cancelled successfully." };
}

/** Lookup a member by library code for quick checkout inspection */
export async function lookupMemberAction(memberCode: string): Promise<CirculationResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.VIEW_MEMBERS)) {
    return { error: "Unauthorized to lookup members." };
  }
  const validation = memberLookupSchema.safeParse({ memberCode });
  if (!validation.success) return { fieldErrors: validation.error.flatten().fieldErrors };

  const member = await db.query.users.findFirst({
    where: sql`LOWER(${users.memberCode}) = LOWER(${memberCode.trim()})`,
  });
  if (!member) return { error: `No member found with card code "${memberCode}".` };

  // Gather active loan count & unpaid fines
  const activeLoans = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(loans)
    .where(and(eq(loans.userId, member.id), eq(loans.status, "active")));

  const unpaidFines = await db
    .select({ total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)` })
    .from(fines)
    .where(and(eq(fines.userId, member.id), eq(fines.status, "unpaid")));

  const policy = await getPolicyForRole(member.role);

  return {
    success: true,
    data: {
      user: member,
      activeLoanCount: Number(activeLoans[0]?.cnt ?? 0),
      maxActiveLoans: policy.maxActiveLoans,
      loanDurationDays: policy.loanDurationDays,
      unpaidFinesCents: Number(unpaidFines[0]?.total ?? 0),
    },
  };
}
