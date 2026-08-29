import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  categories,
  publishers,
  bookAuthors,
  authors,
  bookCopies,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Bookmark,
  Calendar,
  Layers,
  ArrowLeft,
  Edit2,
  Building,
  Globe,
  FileText,
  Barcode,
  MapPin,
} from "lucide-react";
import { DeleteBookDialog } from "@/components/catalogue/delete-book-dialog";
import { AddCopyDialog } from "@/components/inventory/add-copy-dialog";
import { EditCopyDialog } from "@/components/inventory/edit-copy-dialog";
import { DeleteCopyDialog } from "@/components/inventory/delete-copy-dialog";
import { CopyStatusDropdown } from "@/components/inventory/copy-status-dropdown";
import { BarcodeQuickLookup } from "@/components/inventory/barcode-quick-lookup";

interface BookDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookDetailsPage({ params }: BookDetailsPageProps) {
  const { appUser } = await requireAuthUser();
  const { id: bookId } = await params;

  // 1. Fetch book record
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId));

  if (!book) {
    notFound();
  }

  // 2. Fetch related Category & Publisher
  const category = book.categoryId
    ? (await db.select().from(categories).where(eq(categories.id, book.categoryId)))[0] || null
    : null;

  const publisher = book.publisherId
    ? (await db.select().from(publishers).where(eq(publishers.id, book.publisherId)))[0] || null
    : null;

  // 3. Fetch Authors
  const bookAuthorsList = await db
    .select({
      authorId: authors.id,
      name: authors.name,
      bio: authors.bio,
      website: authors.website,
    })
    .from(bookAuthors)
    .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
    .where(eq(bookAuthors.bookId, bookId));

  // 4. Fetch Physical Copies
  const copies = await db
    .select()
    .from(bookCopies)
    .where(eq(bookCopies.bookId, bookId))
    .orderBy(asc(bookCopies.barcode));

  // RBAC Permission checks
  const canEdit = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.UPDATE_BOOK
  );
  const canDelete = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.DELETE_BOOK
  );
  const canManageInventory = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.MANAGE_INVENTORY
  );
  const canScanBarcode = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.SCAN_BARCODE
  );

  const isAvailable = book.availableCopies > 0;

  // Inventory count breakdowns
  const availableCount = copies.filter((c) => c.status === "available").length;
  const borrowedCount = copies.filter((c) => c.status === "borrowed").length;
  const reservedCount = copies.filter((c) => c.status === "reserved").length;
  const maintenanceCount = copies.filter((c) => c.status === "maintenance").length;
  const lostCount = copies.filter((c) => c.status === "lost").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/catalogue"
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Catalogue Detail
              </Badge>
              {category && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  {category.name}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              {book.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(canScanBarcode || canManageInventory) && <BarcodeQuickLookup />}

          {canEdit && (
            <Link href={`/catalogue/${book.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 shadow-xs">
                <Edit2 className="size-3.5" />
                <span>Edit Title</span>
              </Button>
            </Link>
          )}

          {canDelete && (
            <DeleteBookDialog
              bookId={book.id}
              bookTitle={book.title}
              variant="button"
            />
          )}
        </div>
      </div>

      {/* Main Metadata Overview Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 1 Column: Cover Image & Quick Classification */}
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-6 space-y-4 text-center">
            <div className="relative mx-auto flex h-64 w-44 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 shadow-md text-zinc-100">
              {book.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 p-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200">
                    <BookOpen className="size-6" />
                  </div>
                  <span className="text-xs font-bold leading-tight">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                {isAvailable ? (
                  <Badge variant="success" className="px-2.5 py-0.5 text-xs">
                    {book.availableCopies} of {book.totalCopies} Available
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="px-2.5 py-0.5 text-xs">
                    All Copies Checked Out
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Holdings Status in Circulation Desk
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right 2 Columns: Book Metadata Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metadata Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-zinc-700" />
                Bibliographic Information
              </CardTitle>
              <CardDescription>
                Cataloguing fields and publisher records
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Authors List */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Authors / Contributors
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {bookAuthorsList.length === 0 ? (
                    <span className="text-xs text-zinc-500">Unspecified author</span>
                  ) : (
                    bookAuthorsList.map((a) => (
                      <div
                        key={a.authorId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-800"
                      >
                        <span className="font-semibold">{a.name}</span>
                        {a.website && (
                          <a
                            href={a.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-zinc-700"
                          >
                            <Globe className="size-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div className="space-y-1.5 border-t border-zinc-100 pt-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Synopsis / Summary
                  </span>
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Data Specifications Grid */}
              <div className="grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    ISBN
                  </span>
                  <p className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-900">
                    <Bookmark className="size-3.5 text-zinc-400" />
                    {book.isbn}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Call Number
                  </span>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Layers className="size-3.5 text-zinc-400" />
                    {book.callNumber || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Publisher
                  </span>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Building className="size-3.5 text-zinc-400" />
                    {publisher?.name || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Publish Year
                  </span>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Calendar className="size-3.5 text-zinc-400" />
                    {book.publishYear || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Edition
                  </span>
                  <p className="text-xs font-semibold text-zinc-900">
                    {book.edition || "Standard"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Pages / Language
                  </span>
                  <p className="text-xs font-semibold text-zinc-900">
                    {book.pages ? `${book.pages} pp.` : "—"} &bull; {book.language}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Physical Copies Inventory Section (Phase 7) */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="border-b border-zinc-100 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Barcode className="size-4 text-zinc-700" />
                Physical Copies & Inventory ({copies.length})
              </CardTitle>
              <CardDescription>
                Tracked physical holdings, barcodes, shelf placements, and condition audits
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {canManageInventory && (
                <AddCopyDialog
                  bookId={book.id}
                  bookTitle={book.title}
                  isbn={book.isbn}
                  defaultShelfLocation={book.callNumber ? `Shelf ${book.callNumber}` : "General Stacks"}
                />
              )}
            </div>
          </div>

          {/* Inventory Breakdown Strip */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 pt-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Total Copies
              </span>
              <span className="text-base font-bold text-zinc-900">{copies.length}</span>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 block">
                Available
              </span>
              <span className="text-base font-bold text-emerald-800">{availableCount}</span>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 block">
                Checked Out
              </span>
              <span className="text-base font-bold text-amber-800">{borrowedCount}</span>
            </div>

            <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 block">
                Reserved
              </span>
              <span className="text-base font-bold text-sky-800">{reservedCount}</span>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 block">
                Maintenance
              </span>
              <span className="text-base font-bold text-orange-800">{maintenanceCount}</span>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50/60 p-2.5 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700 block">
                Lost / Missing
              </span>
              <span className="text-base font-bold text-red-800">{lostCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {copies.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <Barcode className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">No Physical Copies Registered</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are currently no physical copy items tracked in the inventory for this title.
                </p>
              </div>
              {canManageInventory && (
                <AddCopyDialog
                  bookId={book.id}
                  bookTitle={book.title}
                  isbn={book.isbn}
                  defaultShelfLocation="General Stacks"
                />
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="py-3 pl-4 pr-3 sm:pl-6">Copy #</th>
                    <th className="px-3 py-3">Barcode</th>
                    <th className="px-3 py-3">Shelf Location</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Condition Notes</th>
                    <th className="px-3 py-3">Acquired</th>
                    {canManageInventory && (
                      <th className="py-3 pl-3 pr-4 text-right sm:pr-6">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {copies.map((copy, index) => (
                    <tr key={copy.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 pl-4 pr-3 font-semibold text-zinc-900 sm:pl-6">
                        Copy {index + 1}
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-zinc-800">
                        <div className="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5">
                          <Barcode className="size-3 text-zinc-400" />
                          <span>{copy.barcode}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-zinc-600">
                          <MapPin className="size-3 text-zinc-400" />
                          <span>{copy.shelfLocation}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <CopyStatusDropdown
                          copyId={copy.id}
                          bookId={book.id}
                          currentStatus={copy.status}
                          canManage={canManageInventory}
                        />
                      </td>
                      <td className="px-3 py-3 text-zinc-500 max-w-[200px] truncate">
                        {copy.conditionNotes || "Good Condition"}
                      </td>
                      <td className="px-3 py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(copy.acquiredAt).toLocaleDateString()}
                      </td>
                      {canManageInventory && (
                        <td className="py-3 pl-3 pr-4 text-right sm:pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <EditCopyDialog copy={copy} bookTitle={book.title} />
                            <DeleteCopyDialog copy={copy} bookTitle={book.title} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
