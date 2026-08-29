import React from "react";
import { notFound, redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  categories,
  authors,
  publishers,
  bookAuthors,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { BookForm } from "@/components/catalogue/book-form";

interface EditBookPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Book | Library Management System",
  description: "Update catalogue title metadata and authors.",
};

export default async function EditBookPage({ params }: EditBookPageProps) {
  const { appUser } = await requireAuthUser();
  const { id: bookId } = await params;

  // Role guard: Only admin and librarian can edit books
  if (!hasPermission(appUser.role as UserRole, PERMISSIONS.UPDATE_BOOK)) {
    redirect(`/catalogue/${bookId}`);
  }

  // 1. Fetch book record
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId));

  if (!book) {
    notFound();
  }

  // 2. Fetch associated authors
  const bookAuthorsList = await db
    .select({
      id: authors.id,
      name: authors.name,
      bio: authors.bio,
      website: authors.website,
      createdAt: authors.createdAt,
    })
    .from(bookAuthors)
    .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
    .where(eq(bookAuthors.bookId, bookId));

  // 3. Pre-fetch dropdown option lists
  const [allCategories, allAuthors, allPublishers] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(authors).orderBy(asc(authors.name)),
    db.select().from(publishers).orderBy(asc(publishers.name)),
  ]);

  const initialBookData = {
    ...book,
    authors: bookAuthorsList,
  };

  return (
    <div className="mx-auto max-w-5xl">
      <BookForm
        mode="edit"
        initialData={initialBookData}
        categories={allCategories}
        authors={allAuthors}
        publishers={allPublishers}
      />
    </div>
  );
}
