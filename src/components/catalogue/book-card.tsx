import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Bookmark,
  Calendar,
  Layers,
  Edit2,
  ExternalLink,
} from "lucide-react";
import type { BookWithRelations, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { DeleteBookDialog } from "./delete-book-dialog";

interface BookCardProps {
  book: BookWithRelations;
  currentUser: User;
}

export function BookCard({ book, currentUser }: BookCardProps) {
  const canEdit = hasPermission(currentUser.role as UserRole, PERMISSIONS.UPDATE_BOOK);
  const canDelete = hasPermission(currentUser.role as UserRole, PERMISSIONS.DELETE_BOOK);

  const authorNames =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(", ")
      : "Unknown Author";

  const isAvailable = book.availableCopies > 0;
  const isLowStock = book.availableCopies === 1;

  const getStatusBadge = () => {
    if (book.totalCopies === 0) {
      return (
        <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-200">
          No Copies
        </Badge>
      );
    }
    if (!isAvailable) {
      return (
        <Badge variant="destructive" className="text-[10px]">
          Checked Out (0/{book.totalCopies})
        </Badge>
      );
    }
    if (isLowStock) {
      return (
        <Badge variant="warning" className="text-[10px]">
          Low Stock (1/{book.totalCopies})
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="text-[10px]">
        Available ({book.availableCopies}/{book.totalCopies})
      </Badge>
    );
  };

  return (
    <Card className="group flex flex-col overflow-hidden border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-md">
      {/* Book Header / Spine Banner */}
      <div className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 p-4 text-center text-zinc-50">
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1.5 px-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-200 shadow-inner">
              <BookOpen className="size-5" />
            </div>
            <span className="line-clamp-2 text-xs font-semibold text-zinc-200">
              {book.title}
            </span>
          </div>
        )}

        {/* Floating Top Badges */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          {book.category && (
            <Badge
              variant="secondary"
              className="bg-black/60 text-zinc-100 backdrop-blur-xs text-[10px] font-medium border-0"
            >
              {book.category.name}
            </Badge>
          )}
        </div>

        <div className="absolute right-2.5 top-2.5">
          {getStatusBadge()}
        </div>
      </div>

      {/* Book Metadata Content */}
      <CardHeader className="p-4 pb-2">
        <Link
          href={`/catalogue/${book.id}`}
          className="line-clamp-1 text-sm font-bold text-zinc-900 transition-colors hover:text-zinc-600"
          title={book.title}
        >
          {book.title}
        </Link>
        {book.subtitle && (
          <p className="line-clamp-1 text-xs text-zinc-500" title={book.subtitle}>
            {book.subtitle}
          </p>
        )}
        <p className="line-clamp-1 text-xs font-medium text-zinc-600">
          by <span className="text-zinc-900">{authorNames}</span>
        </p>
      </CardHeader>

      <CardContent className="flex-1 px-4 py-2 text-xs text-zinc-500">
        <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 pt-2.5 text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <Bookmark className="size-3 shrink-0 text-zinc-400" />
            <span className="font-mono text-zinc-700">{book.isbn}</span>
          </div>
          {book.publishYear && (
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar className="size-3 shrink-0 text-zinc-400" />
              <span>{book.publishYear}</span>
            </div>
          )}
          {book.callNumber && (
            <div className="flex items-center gap-1.5 col-span-2 truncate">
              <Layers className="size-3 shrink-0 text-zinc-400" />
              <span className="text-zinc-600">Call #: {book.callNumber}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Card Action Footer */}
      <CardFooter className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-3">
        <Link
          href={`/catalogue/${book.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 transition-colors hover:text-zinc-600"
        >
          <span>Details</span>
          <ExternalLink className="size-3" />
        </Link>

        <div className="flex items-center gap-1.5">
          {canEdit && (
            <Link
              href={`/catalogue/${book.id}/edit`}
              className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              title="Edit Title"
            >
              <Edit2 className="size-3" />
            </Link>
          )}
          {canDelete && (
            <DeleteBookDialog bookId={book.id} bookTitle={book.title} />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
