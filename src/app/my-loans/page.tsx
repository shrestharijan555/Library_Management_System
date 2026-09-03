import { Metadata } from "next";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { loans, bookCopies, books, reservations, fines, authors, bookAuthors } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { DEFAULT_LIBRARY_POLICIES } from "@/config/site";
import { MyActiveLoans, MyLoanItem } from "@/components/my-loans/my-active-loans";
import { MyReservations, MyReservationItem } from "@/components/my-loans/my-reservations";
import { MyHistory, MyHistoryItem } from "@/components/my-loans/my-history";
import { MyFinesSummary, MyFineItem } from "@/components/my-loans/my-fines-summary";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/circulation/circulation-tabs";
import { BookOpen, ListOrdered, History, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "My Loans & Library Portal | EduLibrary",
  description: "View your currently borrowed books, manage reservations, and check borrowing history.",
};

export const dynamic = "force-dynamic";

export default async function MyLoansPage() {
  const { appUser } = await requireAuthUser();

  const userId = appUser.id;
  const userRole = appUser.role as keyof typeof DEFAULT_LIBRARY_POLICIES;
  const policy = DEFAULT_LIBRARY_POLICIES[userRole] ?? DEFAULT_LIBRARY_POLICIES.student;

  // 1. Fetch active loans
  const activeLoansRaw = await db
    .select({
      id: loans.id,
      bookId: loans.bookId,
      bookTitle: books.title,
      bookCoverUrl: books.coverImageUrl,
      barcode: bookCopies.barcode,
      shelfLocation: bookCopies.shelfLocation,
      issueDate: loans.issueDate,
      dueDate: loans.dueDate,
      renewalCount: loans.renewalCount,
      status: loans.status,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
    .where(and(eq(loans.userId, userId), eq(loans.status, "active")))
    .orderBy(loans.dueDate);

  // Collect authors for active loans
  const activeLoanItems: MyLoanItem[] = [];
  for (const l of activeLoansRaw) {
    const bookAuthorsList = await db
      .select({ name: authors.name })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, l.bookId));

    const now = new Date();
    const due = new Date(l.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    activeLoanItems.push({
      id: l.id,
      bookId: l.bookId,
      bookTitle: l.bookTitle,
      bookCoverUrl: l.bookCoverUrl,
      authors: bookAuthorsList.map((a) => a.name),
      barcode: l.barcode,
      shelfLocation: l.shelfLocation,
      issueDate: l.issueDate.toISOString(),
      dueDate: l.dueDate.toISOString(),
      renewalCount: l.renewalCount,
      maxRenewals: policy.maxRenewals,
      isOverdue: daysRemaining < 0,
      daysRemaining,
    });
  }

  // 2. Fetch reservations
  const reservationsRaw = await db
    .select({
      id: reservations.id,
      bookId: reservations.bookId,
      bookTitle: books.title,
      bookCoverUrl: books.coverImageUrl,
      reservationDate: reservations.reservationDate,
      queuePosition: reservations.queuePosition,
      status: reservations.status,
    })
    .from(reservations)
    .innerJoin(books, eq(reservations.bookId, books.id))
    .where(and(eq(reservations.userId, userId), eq(reservations.status, "pending")))
    .orderBy(reservations.reservationDate);

  const reservationItems: MyReservationItem[] = [];
  for (const r of reservationsRaw) {
    const bookAuthorsList = await db
      .select({ name: authors.name })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, r.bookId));

    reservationItems.push({
      id: r.id,
      bookId: r.bookId,
      bookTitle: r.bookTitle,
      bookCoverUrl: r.bookCoverUrl,
      authors: bookAuthorsList.map((a) => a.name),
      reservationDate: r.reservationDate.toISOString(),
      queuePosition: r.queuePosition,
      status: r.status as "pending" | "fulfilled" | "cancelled" | "expired",
    });
  }

  // 3. Fetch borrowing history (returned loans)
  const historyRaw = await db
    .select({
      id: loans.id,
      bookId: loans.bookId,
      bookTitle: books.title,
      bookCoverUrl: books.coverImageUrl,
      barcode: bookCopies.barcode,
      issueDate: loans.issueDate,
      returnDate: loans.returnDate,
      renewals: loans.renewalCount,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
    .where(and(eq(loans.userId, userId), eq(loans.status, "returned")))
    .orderBy(desc(loans.returnDate))
    .limit(50);

  const historyItems: MyHistoryItem[] = [];
  for (const h of historyRaw) {
    const bookAuthorsList = await db
      .select({ name: authors.name })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, h.bookId));

    historyItems.push({
      id: h.id,
      bookId: h.bookId,
      bookTitle: h.bookTitle,
      bookCoverUrl: h.bookCoverUrl,
      authors: bookAuthorsList.map((a) => a.name),
      barcode: h.barcode,
      issueDate: h.issueDate.toISOString(),
      returnDate: h.returnDate ? h.returnDate.toISOString() : new Date().toISOString(),
      renewals: h.renewals,
    });
  }

  // 4. Fetch fines
  const finesRaw = await db
    .select({
      id: fines.id,
      amountCents: fines.amountCents,
      status: fines.status,
      reason: fines.reason,
      createdAt: fines.createdAt,
      paidAt: fines.paidAt,
    })
    .from(fines)
    .where(eq(fines.userId, userId))
    .orderBy(desc(fines.createdAt));

  const fineItems: MyFineItem[] = finesRaw.map((f) => ({
    id: f.id,
    amountCents: f.amountCents,
    status: f.status as "unpaid" | "paid" | "waived",
    reason: f.reason,
    createdAt: f.createdAt.toISOString(),
    paidAt: f.paidAt ? f.paidAt.toISOString() : null,
  }));

  const totalUnpaidFines = fineItems
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amountCents, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            My Library Portal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track your borrowed books, manage reservations, and check account standing.
          </p>
        </div>

        {/* Quota Tracker */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Borrowing Quota:</span>{" "}
            <strong className="font-semibold text-indigo-700 dark:text-indigo-300">
              {activeLoanItems.length} / {policy.maxActiveLoans} Books
            </strong>
          </div>

          {totalUnpaidFines > 0 && (
            <div className="px-4 py-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Due Fines:</span>{" "}
              <strong className="font-semibold text-rose-700 dark:text-rose-300">
                ${(totalUnpaidFines / 100).toFixed(2)}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <BookOpen className="w-4 h-4 mr-2" />
            Active Loans ({activeLoanItems.length})
          </TabsTrigger>
          <TabsTrigger value="holds">
            <ListOrdered className="w-4 h-4 mr-2" />
            My Holds ({reservationItems.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History ({historyItems.length})
          </TabsTrigger>
          <TabsTrigger value="fines">
            <DollarSign className="w-4 h-4 mr-2" />
            Dues & Fines ({fineItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <MyActiveLoans loans={activeLoanItems} />
        </TabsContent>

        <TabsContent value="holds">
          <MyReservations reservations={reservationItems} />
        </TabsContent>

        <TabsContent value="history">
          <MyHistory history={historyItems} />
        </TabsContent>

        <TabsContent value="fines">
          <MyFinesSummary fines={fineItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
