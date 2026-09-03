// src/app/reports/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { loans, books, bookCopies, users, categories, fines } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { ReportsDashboard, ReportStats } from "@/components/reports/reports-dashboard";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports & Analytics | EduLibrary",
  description: "Institutional reporting, circulation metrics, collection analytics, and CSV exports.",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { appUser } = await requireAuthUser();

  if (!hasPermission(appUser.role, PERMISSIONS.VIEW_REPORTS)) {
    redirect("/dashboard");
  }

  // 1. Loans Metrics
  const [totalLoansRes] = await db.select({ count: sql`count(*)` }).from(loans);
  const [activeLoansRes] = await db
    .select({ count: sql`count(*)` })
    .from(loans)
    .where(eq(loans.status, "active"));
  const [returnedLoansRes] = await db
    .select({ count: sql`count(*)` })
    .from(loans)
    .where(eq(loans.status, "returned"));

  const now = new Date();
  const [overdueLoansRes] = await db
    .select({ count: sql`count(*)` })
    .from(loans)
    .where(sql`${loans.status} = 'active' AND ${loans.dueDate} < ${now}`);

  // 2. Inventory Metrics
  const [totalBooksRes] = await db.select({ count: sql`count(*)` }).from(books);
  const [totalCopiesRes] = await db.select({ count: sql`count(*)` }).from(bookCopies);
  const [availableCopiesRes] = await db
    .select({ count: sql`count(*)` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "available"));
  const [borrowedCopiesRes] = await db
    .select({ count: sql`count(*)` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "borrowed"));
  const [maintenanceCopiesRes] = await db
    .select({ count: sql`count(*)` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "maintenance"));
  const [lostCopiesRes] = await db
    .select({ count: sql`count(*)` })
    .from(bookCopies)
    .where(eq(bookCopies.status, "lost"));

  // 3. User Metrics
  const [totalMembersRes] = await db.select({ count: sql`count(*)` }).from(users);

  // 4. Financial Metrics
  const [finesAssessedRes] = await db
    .select({ total: sql`COALESCE(SUM(${fines.amountCents}), 0)` })
    .from(fines);
  const [finesCollectedRes] = await db
    .select({ total: sql`COALESCE(SUM(${fines.amountCents}), 0)` })
    .from(fines)
    .where(eq(fines.status, "paid"));
  const [finesWaivedRes] = await db
    .select({ total: sql`COALESCE(SUM(${fines.amountCents}), 0)` })
    .from(fines)
    .where(eq(fines.status, "waived"));

  // 5. Top Circulated Books
  const rawTopBooks = await db
    .select({
      id: books.id,
      title: books.title,
      coverImageUrl: books.coverImageUrl,
      circulationCount: sql`count(${loans.id})`,
      categoryName: categories.name,
    })
    .from(books)
    .leftJoin(loans, eq(books.id, loans.bookId))
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .groupBy(books.id, categories.name)
    .orderBy(desc(sql`count(${loans.id})`))
    .limit(5);

  // 6. Category Statistics
  const totalBooksCount = Number(totalBooksRes?.count ?? 0);
  const rawCategoryStats = await db
    .select({
      name: categories.name,
      bookCount: sql`count(${books.id})`,
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

  // 7. Export Datasets
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
    .limit(500);

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
    .limit(500);

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
    .limit(500);

  const stats: ReportStats = {
    totalLoans: Number(totalLoansRes?.count ?? 0),
    activeLoans: Number(activeLoansRes?.count ?? 0),
    returnedLoans: Number(returnedLoansRes?.count ?? 0),
    overdueLoans: Number(overdueLoansRes?.count ?? 0),
    totalBooks: totalBooksCount,
    totalCopies: Number(totalCopiesRes?.count ?? 0),
    availableCopies: Number(availableCopiesRes?.count ?? 0),
    borrowedCopies: Number(borrowedCopiesRes?.count ?? 0),
    maintenanceCopies: Number(maintenanceCopiesRes?.count ?? 0),
    lostCopies: Number(lostCopiesRes?.count ?? 0),
    totalMembers: Number(totalMembersRes?.count ?? 0),
    totalFinesAssessedCents: Number(finesAssessedRes?.total ?? 0),
    totalFinesCollectedCents: Number(finesCollectedRes?.total ?? 0),
    totalFinesWaivedCents: Number(finesWaivedRes?.total ?? 0),
    topBooks: rawTopBooks.map((b) => ({
      id: b.id,
      title: b.title,
      coverImageUrl: b.coverImageUrl,
      circulationCount: Number(b.circulationCount ?? 0),
      categoryName: b.categoryName || "General",
    })),
    categoryStats,
    exportableLoans: exportableLoansRaw,
    exportableInventory: exportableInventoryRaw,
    exportableFines: exportableFinesRaw,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          Reports & Institutional Analytics
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Detailed metrics on library circulation, collection utilization, member activity, and CSV reporting.
        </p>
      </div>

      <ReportsDashboard stats={stats} />
    </div>
  );
}
