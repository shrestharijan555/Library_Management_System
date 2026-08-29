import React from "react";
import Link from "next/link";
import {
  ilike,
  or,
  eq,
  gt,
  lte,
  and,
  desc,
  asc,
  count,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  categories,
  bookAuthors,
  authors,
  publishers,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import type { BookWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Layers,
  BookCheck,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Library,
} from "lucide-react";
import { CatalogueSearch } from "@/components/catalogue/catalogue-search";
import { CatalogueFilters } from "@/components/catalogue/catalogue-filters";
import { BookCard } from "@/components/catalogue/book-card";
import { BookTable } from "@/components/catalogue/book-table";

interface CataloguePageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    status?: string;
    sort?: string;
    view?: string;
    page?: string;
  }>;
}

export default async function CataloguePage({
  searchParams,
}: CataloguePageProps) {
  const { appUser } = await requireAuthUser();
  const params = await searchParams;

  const query = params.query?.trim() || "";
  const categorySlug = params.category?.trim() || "";
  const status = params.status || "all";
  const sort = params.sort || "newest";
  const view = params.view === "table" ? "table" : "grid";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 12;
  const offset = (page - 1) * limit;

  // 1. Fetch categories for filter dropdown
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));

  // 2. Build dynamic where filters
  const conditions = [];

  if (query) {
    conditions.push(
      or(
        ilike(books.title, `%${query}%`),
        ilike(books.isbn, `%${query}%`),
        ilike(books.subtitle, `%${query}%`),
        ilike(books.callNumber, `%${query}%`)
      )
    );
  }

  if (categorySlug) {
    const selectedCategory = allCategories.find((c) => c.slug === categorySlug);
    if (selectedCategory) {
      conditions.push(eq(books.categoryId, selectedCategory.id));
    }
  }

  if (status === "available") {
    conditions.push(gt(books.availableCopies, 0));
  } else if (status === "borrowed") {
    conditions.push(eq(books.availableCopies, 0));
  } else if (status === "low_stock") {
    conditions.push(and(gt(books.availableCopies, 0), lte(books.availableCopies, 1)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 3. Determine order by
  let orderByClause;
  switch (sort) {
    case "oldest":
      orderByClause = asc(books.createdAt);
      break;
    case "title_asc":
      orderByClause = asc(books.title);
      break;
    case "title_desc":
      orderByClause = desc(books.title);
      break;
    case "year_desc":
      orderByClause = desc(books.publishYear);
      break;
    case "year_asc":
      orderByClause = asc(books.publishYear);
      break;
    case "copies_desc":
      orderByClause = desc(books.availableCopies);
      break;
    case "newest":
    default:
      orderByClause = desc(books.createdAt);
      break;
  }

  // 4. Query total count matching filter
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(books)
    .where(whereClause);

  const totalItems = totalCountResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // 5. Query matching books
  const booksList = await db
    .select()
    .from(books)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // 6. Populate relations (category, publisher, authors)
  const bookIds = booksList.map((b) => b.id);

  let bookAuthorsMap: Record<string, (typeof authors)["$inferSelect"][]> = {};
  if (bookIds.length > 0) {
    const bookAuthorsList = await db
      .select({
        bookId: bookAuthors.bookId,
        author: authors,
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(sql`${bookAuthors.bookId} IN ${bookIds}`);

    bookAuthorsMap = bookAuthorsList.reduce((acc, curr) => {
      if (!acc[curr.bookId]) acc[curr.bookId] = [];
      acc[curr.bookId].push(curr.author);
      return acc;
    }, {} as Record<string, (typeof authors)["$inferSelect"][]>);
  }

  const publishersMap = (
    await db.select().from(publishers)
  ).reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {} as Record<string, (typeof publishers)["$inferSelect"]>);

  const categoriesMap = allCategories.reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {} as Record<string, (typeof categories)["$inferSelect"]>);

  const enrichedBooks: BookWithRelations[] = booksList.map((b) => ({
    ...b,
    category: b.categoryId ? categoriesMap[b.categoryId] || null : null,
    publisher: b.publisherId ? publishersMap[b.publisherId] || null : null,
    authors: bookAuthorsMap[b.id] || [],
  }));

  // 7. Overall stats for summary strip
  const [statsTotalBooks] = await db.select({ count: count() }).from(books);
  const [statsAvailableBooks] = await db
    .select({ count: count() })
    .from(books)
    .where(gt(books.availableCopies, 0));
  const [statsTotalCopies] = await db
    .select({ sum: sql<number>`COALESCE(SUM(${books.totalCopies}), 0)` })
    .from(books);

  const canCreateBook = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.CREATE_BOOK
  );

  // Helper for pagination links
  const createPageUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    if (query) p.set("query", query);
    if (categorySlug) p.set("category", categorySlug);
    if (status && status !== "all") p.set("status", status);
    if (sort && sort !== "newest") p.set("sort", sort);
    if (view && view !== "grid") p.set("view", view);
    p.set("page", pageNumber.toString());
    return `/catalogue?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-xs font-medium">
              <Library className="size-3 text-zinc-900" />
              Phase 6 Catalogue
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalItems} {totalItems === 1 ? "Title" : "Titles"} Found
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Book Catalogue & Holdings
          </h1>
          <p className="text-sm text-zinc-500">
            Search, filter, and manage institutional literature holdings and physical inventory.
          </p>
        </div>

        {canCreateBook && (
          <Link href="/catalogue/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="size-4" />
              <span>Add New Book</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Summary KPI Counters Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
            <BookOpen className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Titles
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {statsTotalBooks?.count ?? 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <BookCheck className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Available Titles
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {statsAvailableBooks?.count ?? 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
            <Layers className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Physical Copies
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {statsTotalCopies?.sum ?? 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <FolderOpen className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Categories
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {allCategories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <CatalogueSearch defaultValue={query} />
        </div>
        <CatalogueFilters categories={allCategories} />
      </div>

      {/* Catalogue Content: Grid / Table View or Empty State */}
      {enrichedBooks.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <BookOpen className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-zinc-900">
            No books found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            {query || categorySlug || status !== "all"
              ? "No catalogue items matched your current search filters. Try adjusting your keywords or clearing filters."
              : "The library catalogue is currently empty. Add your first book to begin building the collection."}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {query || categorySlug || status !== "all" ? (
              <Link href="/catalogue">
                <Button variant="outline" size="sm">
                  Clear All Filters
                </Button>
              </Link>
            ) : canCreateBook ? (
              <Link href="/catalogue/new">
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-4" />
                  <span>Add First Book</span>
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      ) : view === "table" ? (
        <BookTable books={enrichedBooks} currentUser={appUser} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {enrichedBooks.map((book) => (
            <BookCard key={book.id} book={book} currentUser={appUser} />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row">
          <span className="text-xs text-zinc-500">
            Showing <strong className="text-zinc-900">{offset + 1}</strong> to{" "}
            <strong className="text-zinc-900">
              {Math.min(offset + limit, totalItems)}
            </strong>{" "}
            of <strong className="text-zinc-900">{totalItems}</strong> titles
          </span>

          <div className="flex items-center gap-1.5">
            {page > 1 ? (
              <Link href={createPageUrl(page - 1)}>
                <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-xs">
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 gap-1 px-2.5 text-xs opacity-50"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>
            )}

            <div className="flex items-center gap-1 px-2 text-xs font-semibold text-zinc-700">
              Page {page} of {totalPages}
            </div>

            {page < totalPages ? (
              <Link href={createPageUrl(page + 1)}>
                <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-xs">
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 gap-1 px-2.5 text-xs opacity-50"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
