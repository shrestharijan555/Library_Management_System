// src/app/circulation/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { loans, bookCopies, books, users, reservations } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { IssueDeskTab } from "@/components/circulation/issue-desk-tab";
import { ReturnDeskTab } from "@/components/circulation/return-desk-tab";
import { LoansLiveTable, CirculationLoanItem } from "@/components/circulation/loans-live-table";
import { ReservationsDeskTab, ReservationQueueItem } from "@/components/circulation/reservations-desk-tab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/circulation/circulation-tabs";
import { ArrowRightLeft, BookUp, BookDown, ListOrdered } from "lucide-react";

export const metadata: Metadata = {
  title: "Circulation Desk | EduLibrary",
  description: "Check out, return, renew books, and manage hold reservations.",
};

export const dynamic = "force-dynamic";

export default async function CirculationPage() {
  const { appUser } = await requireAuthUser();

  // Check permission for circulation desk
  if (
    !hasPermission(appUser.role, PERMISSIONS.ISSUE_BOOK) &&
    !hasPermission(appUser.role, PERMISSIONS.RETURN_BOOK)
  ) {
    redirect("/my-loans");
  }

  // 1. Fetch live loans with related books, copies, and borrowers
  const rawLoans = await db
    .select({
      id: loans.id,
      bookId: loans.bookId,
      bookTitle: books.title,
      bookCoverUrl: books.coverImageUrl,
      copyId: loans.copyId,
      barcode: bookCopies.barcode,
      shelfLocation: bookCopies.shelfLocation,
      userId: loans.userId,
      borrowerName: users.fullName,
      borrowerEmail: users.email,
      memberCode: users.memberCode,
      borrowerRole: users.role,
      issueDate: loans.issueDate,
      dueDate: loans.dueDate,
      returnDate: loans.returnDate,
      status: loans.status,
      renewalCount: loans.renewalCount,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
    .innerJoin(users, eq(loans.userId, users.id))
    .orderBy(desc(loans.issueDate))
    .limit(100);

  const formattedLoans: CirculationLoanItem[] = rawLoans.map((l) => ({
    id: l.id,
    bookId: l.bookId,
    bookTitle: l.bookTitle,
    bookCoverUrl: l.bookCoverUrl,
    copyId: l.copyId,
    barcode: l.barcode,
    shelfLocation: l.shelfLocation,
    userId: l.userId,
    borrowerName: l.borrowerName,
    borrowerEmail: l.borrowerEmail,
    memberCode: l.memberCode,
    borrowerRole: l.borrowerRole,
    issueDate: l.issueDate.toISOString(),
    dueDate: l.dueDate.toISOString(),
    returnDate: l.returnDate ? l.returnDate.toISOString() : null,
    status: l.status as "active" | "returned" | "overdue" | "lost",
    renewalCount: l.renewalCount,
  }));

  // 2. Fetch pending reservations queue
  const rawReservations = await db
    .select({
      id: reservations.id,
      bookId: reservations.bookId,
      bookTitle: books.title,
      bookCoverUrl: books.coverImageUrl,
      availableCopies: books.availableCopies,
      totalCopies: books.totalCopies,
      userId: reservations.userId,
      userName: users.fullName,
      userEmail: users.email,
      memberCode: users.memberCode,
      userRole: users.role,
      reservationDate: reservations.reservationDate,
      queuePosition: reservations.queuePosition,
      status: reservations.status,
    })
    .from(reservations)
    .innerJoin(books, eq(reservations.bookId, books.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .where(eq(reservations.status, "pending"))
    .orderBy(reservations.queuePosition);

  const formattedReservations: ReservationQueueItem[] = rawReservations.map((r) => ({
    id: r.id,
    bookId: r.bookId,
    bookTitle: r.bookTitle,
    bookCoverUrl: r.bookCoverUrl,
    availableCopies: r.availableCopies,
    totalCopies: r.totalCopies,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    memberCode: r.memberCode,
    userRole: r.userRole,
    reservationDate: r.reservationDate.toISOString(),
    queuePosition: r.queuePosition,
    status: r.status as "pending" | "fulfilled" | "cancelled" | "expired",
  }));

  const activeLoansCount = formattedLoans.filter((l) => l.status === "active").length;
  const overdueCount = formattedLoans.filter((l) => {
    if (l.status !== "active") return false;
    return new Date(l.dueDate) < new Date();
  }).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            Circulation Desk
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Barcode-driven counter for book checkout, returns, renewals, and reservation queues.
          </p>
        </div>

        {/* Quick Summary Pill Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Active Checked Out:</span>{" "}
            <strong className="font-semibold text-indigo-700 dark:text-indigo-300">
              {activeLoansCount}
            </strong>
          </div>

          {overdueCount > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Overdue:</span>{" "}
              <strong className="font-semibold text-rose-700 dark:text-rose-300">
                {overdueCount}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="issue">
        <TabsList>
          <TabsTrigger value="issue">
            <BookUp className="w-4 h-4 mr-2" />
            Issue (Check-Out)
          </TabsTrigger>
          <TabsTrigger value="return">
            <BookDown className="w-4 h-4 mr-2" />
            Return (Check-In)
          </TabsTrigger>
          <TabsTrigger value="loans">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Loans Monitor ({activeLoansCount})
          </TabsTrigger>
          <TabsTrigger value="reservations">
            <ListOrdered className="w-4 h-4 mr-2" />
            Hold Queues ({formattedReservations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issue">
          <IssueDeskTab />
        </TabsContent>

        <TabsContent value="return">
          <ReturnDeskTab />
        </TabsContent>

        <TabsContent value="loans">
          <LoansLiveTable initialLoans={formattedLoans} />
        </TabsContent>

        <TabsContent value="reservations">
          <ReservationsDeskTab initialReservations={formattedReservations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
