import React from "react";
import Link from "next/link";
import { BookOpen, Edit2, ExternalLink } from "lucide-react";
import type { BookWithRelations, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { DeleteBookDialog } from "./delete-book-dialog";

interface BookTableProps {
  books: BookWithRelations[];
  currentUser: User;
}

export function BookTable({ books, currentUser }: BookTableProps) {
  const canEdit = hasPermission(currentUser.role as UserRole, PERMISSIONS.UPDATE_BOOK);
  const canDelete = hasPermission(currentUser.role as UserRole, PERMISSIONS.DELETE_BOOK);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            <tr>
              <th className="py-3.5 pl-4 pr-3 sm:pl-6">Title & Edition</th>
              <th className="px-3 py-3.5">Author(s)</th>
              <th className="px-3 py-3.5">Category</th>
              <th className="px-3 py-3.5">ISBN & Call #</th>
              <th className="px-3 py-3.5 text-center">Availability</th>
              <th className="py-3.5 pl-3 pr-4 text-right sm:pr-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 text-zinc-700 dark:divide-zinc-800 dark:text-zinc-300">
            {books.map((book) => {
              const authorNames =
                book.authors && book.authors.length > 0
                  ? book.authors.map((a) => a.name).join(", ")
                  : "Unknown Author";

              const isAvailable = book.availableCopies > 0;
              const isLowStock = book.availableCopies === 1;

              return (
                <tr
                  key={book.id}
                  className="transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50"
                >
                  {/* Title & Cover preview */}
                  <td className="py-3.5 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {book.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={book.coverImageUrl}
                            alt=""
                            className="size-9 rounded-lg object-cover"
                          />
                        ) : (
                          <BookOpen className="size-4" />
                        )}
                      </div>
                      <div className="max-w-[220px] sm:max-w-xs">
                        <Link
                          href={`/catalogue/${book.id}`}
                          className="truncate font-bold text-zinc-900 hover:underline block dark:text-zinc-100"
                          title={book.title}
                        >
                          {book.title}
                        </Link>
                        {book.subtitle && (
                          <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                            {book.subtitle}
                          </p>
                        )}
                        {book.edition && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            Ed: {book.edition}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Authors */}
                  <td className="px-3 py-3.5">
                    <span className="line-clamp-1 max-w-[150px] font-medium text-zinc-800 dark:text-zinc-200">
                      {authorNames}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5">
                    {book.category ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {book.category.name}
                      </Badge>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                  </td>

                  {/* ISBN & Call number */}
                  <td className="px-3 py-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    <div>{book.isbn}</div>
                    {book.callNumber && (
                      <div className="text-[10px] text-zinc-400 font-sans dark:text-zinc-500">
                        Call: {book.callNumber}
                      </div>
                    )}
                  </td>

                  {/* Availability */}
                  <td className="px-3 py-3.5 text-center">
                    {book.totalCopies === 0 ? (
                      <Badge variant="outline" className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        0 Copies
                      </Badge>
                    ) : !isAvailable ? (
                      <Badge variant="destructive" className="text-[10px]">
                        0 / {book.totalCopies}
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning" className="text-[10px]">
                        1 / {book.totalCopies}
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        {book.availableCopies} / {book.totalCopies}
                      </Badge>
                    )}
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 pl-3 pr-4 text-right sm:pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/catalogue/${book.id}`}
                        className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                        title="View Details"
                      >
                        <ExternalLink className="size-3" />
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/catalogue/${book.id}/edit`}
                          className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                          title="Edit Title"
                        >
                          <Edit2 className="size-3" />
                        </Link>
                      )}

                      {canDelete && (
                        <DeleteBookDialog
                          bookId={book.id}
                          bookTitle={book.title}
                          variant="icon"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
