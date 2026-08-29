import React from "react";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories, authors, publishers } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { BookForm } from "@/components/catalogue/book-form";

export const metadata = {
  title: "Add New Book | Library Management System",
  description: "Register a new catalogue title into the library management system.",
};

export default async function NewBookPage() {
  const { appUser } = await requireAuthUser();

  // Role guard: Only admin and librarian can create books
  if (!hasPermission(appUser.role as UserRole, PERMISSIONS.CREATE_BOOK)) {
    redirect("/catalogue");
  }

  // Pre-fetch related dropdown data
  const [allCategories, allAuthors, allPublishers] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(authors).orderBy(asc(authors.name)),
    db.select().from(publishers).orderBy(asc(publishers.name)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <BookForm
        mode="create"
        categories={allCategories}
        authors={allAuthors}
        publishers={allPublishers}
      />
    </div>
  );
}
