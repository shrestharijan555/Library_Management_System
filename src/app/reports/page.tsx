// src/app/reports/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, sql, desc, and, gte, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { loans, books, bookCopies, users, categories, fines, reservations } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { ReportsDashboard, type ReportStats } from "@/components/reports/reports-dashboard";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports & Analytics | EduLibrary",
  description: "Institutional reporting, circulation metrics, collection analytics, and CSV exports.",
};

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{
    range?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { appUser } = await requireAuthUser();

  if (!hasPermission(appUser.role, PERMISSIONS.VIEW_REPORTS)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const currentRange = params.range || "30days";

  // Calculate Date Boundaries
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = new Date();

  if (currentRange === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (currentRange === "7days") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (currentRange === "30days") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (currentRange === "this_month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (currentRange === "last_month") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // "all"
    startDate = null;
    endDate = null;
  }

  // --- 1. Circulation & Loans Metrics ---
  const [totalLoansRes] = await db.select({ count: sql<number>`count(*)::int` }).from(loans);
  const [activeLoansRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loans)
    .where(eq(loans.status, "active"));
  const [returnedLoansRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loans)
    .where(eq(loans.status, "returned"));
  const [overdueLoansRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loans)
    .where(or(eq(loans.status, "overdue"), and(eq(loans.status, "active"), sql`${loans.dueDate} < ${now}`)));

  // Period-specific loan metrics
  const loanPeriodCondition = startDate && endDate
    ? and(gte(loans.issueDate, startDate), lte(loans.issueDate, endDate))
    : startDate
    ? gte(loans.issueDate, startDate)
    : undefined;

  const [periodIssuesRes] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalRenewals: sql<number>`COALESCE(SUM(${loans.renewalCount}), 0)::int`,
    })
    .from(loans)
    .where(loanPeriodCondition);

  const returnPeriodCondition = startDate && endDate
    ? and(gte(loans.returnDate, startDate), lte(loans.returnDate, endDate))
    : startDate
    ? gte(loans.returnDate, startDate)
    : undefined;

  const [periodReturnsRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loans)
    .where(and(eq(loans.status, "returned"), returnPeriodCondition));

  // --- 2. Inventory Metrics ---
  const [totalBooksRes] = await db.select({ count: sql<number>`count(*)::int` }).from(books);
  const [totalCopiesRes] = await db.select({ count: sql<number>`count(*)::int` }).from(bookCopies);
  const [availableCopiesRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "available"));
  const [borrowedCopiesRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "borrowed"));
  const [reservedCopiesRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "reserved"));
  const [maintenanceCopiesRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "maintenance"));
  const [lostCopiesRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "lost"));

  // --- 3. Financial / Fines Metrics ---
  const [finesAllTimeAssessedRes] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(fines);

  const [finesPaidRes] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(fines)
    .where(eq(fines.status, "paid"));

  const [finesWaivedRes] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(fines)
    .where(eq(fines.status, "waived"));

  const [finesUnpaidRes] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(fines)
    .where(eq(fines.status, "unpaid"));

  // --- 4. Reservations Metrics ---
  const [totalReservationsRes] = await db.select({ count: sql<number>`count(*)::int` }).from(reservations);
  const [pendingReservationsRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reservations)
    .where(eq(reservations.status, "pending"));
  const [fulfilledReservationsRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reservations)
    .where(eq(reservations.status, "fulfilled"));
  const [cancelledReservationsRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reservations)
    .where(eq(reservations.status, "cancelled"));
  const [expiredReservationsRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reservations)
    .where(eq(reservations.status, "expired"));

  // --- 5. Member / User Metrics ---
  const [totalMembersRes] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [activeMembersRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "active"));
  const [suspendedMembersRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "suspended"));
  const [inactiveMembersRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "inactive"));

  const rawRoleCounts = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)::int`,
    })
    .from(users)
    .groupBy(users.role);

  const roleDistribution = rawRoleCounts.map((r) => ({
    role: r.role,
    count: Number(r.count || 0),
  }));

  // Top Borrowers
  const topBorrowersRaw = await db
    .select({
      id: users.id,
      name: users.fullName,
      email: users.email,
      memberCode: users.memberCode,
      role: users.role,
      loanCount: sql<number>`count(${loans.id})::int`,
    })
    .from(users)
    .innerJoin(loans, eq(users.id, loans.userId))
    .groupBy(users.id)
    .orderBy(desc(sql`count(${loans.id})`))
    .limit(5);

  // --- 6. Book Demand & Category Breakdown ---
  const rawTopBooks = await db
    .select({
      id: books.id,
      title: books.title,
      coverImageUrl: books.coverImageUrl,
      circulationCount: sql<number>`count(${loans.id})::int`,
      categoryName: categories.name,
    })
    .from(books)
    .leftJoin(loans, eq(books.id, loans.bookId))
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .groupBy(books.id, categories.name)
    .orderBy(desc(sql`count(${loans.id})`))
    .limit(6);

  const totalBooksCount = Number(totalBooksRes?.count ?? 0);
  const rawCategoryStats = await db
    .select({
      name: categories.name,
      bookCount: sql<number>`count(${books.id})::int`,
    })
    .from(categories)
    .leftJoin(books, eq(categories.id, books.categoryId))
    .groupBy(categories.id, categories.name)
    .orderBy(desc(sql`count(${books.id})`));

  const categoryStats = rawCategoryStats.map((c) => {
    const count = Number(c.bookCount ?? 0);
    return {
      name: c.name,
      bookCount: count,
      percentage: totalBooksCount > 0 ? Math.round((count / totalBooksCount) * 100) : 0,
    };
  });

  // --- 7. Export Datasets (Loans, Inventory, Fines, Reservations, Members) ---
  const exportableLoansRaw = await db
    .select({
      LoanID: loans.id,
      BookTitle: books.title,
      CopyBarcode: bookCopies.barcode,
      BorrowerName: users.fullName,
      MemberCode: users.memberCode,
      IssueDate: loans.issueDate,
      DueDate: loans.dueDate,
      ReturnDate: loans.returnDate,
      Status: loans.status,
      Renewals: loans.renewalCount,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
    .innerJoin(users, eq(loans.userId, users.id))
    .orderBy(desc(loans.issueDate))
    .limit(1000);

  const exportableInventoryRaw = await db
    .select({
      CopyID: bookCopies.id,
      Barcode: bookCopies.barcode,
      BookTitle: books.title,
      ISBN: books.isbn,
      ShelfLocation: bookCopies.shelfLocation,
      Status: bookCopies.status,
      ConditionNotes: bookCopies.conditionNotes,
    })
    .from(bookCopies)
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .limit(1000);

  const exportableFinesRaw = await db
    .select({
      FineID: fines.id,
      BorrowerName: users.fullName,
      MemberCode: users.memberCode,
      AmountUSD: sql`(${fines.amountCents}::numeric / 100)`,
      Status: fines.status,
      Reason: fines.reason,
      DateAssessed: fines.createdAt,
      DatePaid: fines.paidAt,
    })
    .from(fines)
    .innerJoin(users, eq(fines.userId, users.id))
    .orderBy(desc(fines.createdAt))
    .limit(1000);

  const exportableReservationsRaw = await db
    .select({
      ReservationID: reservations.id,
      BookTitle: books.title,
      MemberName: users.fullName,
      MemberCode: users.memberCode,
      ReservationDate: reservations.reservationDate,
      ExpiryDate: reservations.expiryDate,
      Status: reservations.status,
      QueuePosition: reservations.queuePosition,
    })
    .from(reservations)
    .innerJoin(books, eq(reservations.bookId, books.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .orderBy(desc(reservations.reservationDate))
    .limit(1000);

  const exportableMembersRaw = await db
    .select({
      UserID: users.id,
      FullName: users.fullName,
      Email: users.email,
      MemberCode: users.memberCode,
      Role: users.role,
      Status: users.status,
      CreatedAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(1000);

  const stats: ReportStats = {
    currentRange,
    // Loans
    totalLoans: Number(totalLoansRes?.count ?? 0),
    activeLoans: Number(activeLoansRes?.count ?? 0),
    returnedLoans: Number(returnedLoansRes?.count ?? 0),
    overdueLoans: Number(overdueLoansRes?.count ?? 0),
    periodIssuedLoans: Number(periodIssuesRes?.count ?? 0),
    periodReturnedLoans: Number(periodReturnsRes?.count ?? 0),
    periodRenewals: Number(periodIssuesRes?.totalRenewals ?? 0),
    // Books & Copies
    totalBooks: totalBooksCount,
    totalCopies: Number(totalCopiesRes?.count ?? 0),
    availableCopies: Number(availableCopiesRes?.count ?? 0),
    borrowedCopies: Number(borrowedCopiesRes?.count ?? 0),
    reservedCopies: Number(reservedCopiesRes?.count ?? 0),
    maintenanceCopies: Number(maintenanceCopiesRes?.count ?? 0),
    lostCopies: Number(lostCopiesRes?.count ?? 0),
    // Financials
    totalFinesAssessedCents: Number(finesAllTimeAssessedRes?.total ?? 0),
    totalFinesCollectedCents: Number(finesPaidRes?.total ?? 0),
    totalFinesWaivedCents: Number(finesWaivedRes?.total ?? 0),
    totalFinesUnpaidCents: Number(finesUnpaidRes?.total ?? 0),
    unpaidFinesCount: Number(finesUnpaidRes?.count ?? 0),
    paidFinesCount: Number(finesPaidRes?.count ?? 0),
    waivedFinesCount: Number(finesWaivedRes?.count ?? 0),
    // Reservations
    totalReservations: Number(totalReservationsRes?.count ?? 0),
    pendingReservations: Number(pendingReservationsRes?.count ?? 0),
    fulfilledReservations: Number(fulfilledReservationsRes?.count ?? 0),
    cancelledReservations: Number(cancelledReservationsRes?.count ?? 0),
    expiredReservations: Number(expiredReservationsRes?.count ?? 0),
    // Users
    totalMembers: Number(totalMembersRes?.count ?? 0),
    activeMembers: Number(activeMembersRes?.count ?? 0),
    suspendedMembers: Number(suspendedMembersRes?.count ?? 0),
    inactiveMembers: Number(inactiveMembersRes?.count ?? 0),
    roleDistribution,
    topBorrowers: topBorrowersRaw.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      memberCode: u.memberCode,
      role: u.role,
      loanCount: Number(u.loanCount ?? 0),
    })),
    // Book Ranking & Category Stats
    topBooks: rawTopBooks.map((b) => ({
      id: b.id,
      title: b.title,
      coverImageUrl: b.coverImageUrl,
      circulationCount: Number(b.circulationCount ?? 0),
      categoryName: b.categoryName || "General",
    })),
    categoryStats,
    // Datasets
    exportableLoans: exportableLoansRaw,
    exportableInventory: exportableInventoryRaw,
    exportableFines: exportableFinesRaw,
    exportableReservations: exportableReservationsRaw,
    exportableMembers: exportableMembersRaw,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            Reports & Institutional Analytics
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Institutional metrics on circulation, collections, finances, reservations, and 5 CSV reporting streams.
          </p>
        </div>
      </div>

      <ReportsDashboard stats={stats} />
    </div>
  );
}
