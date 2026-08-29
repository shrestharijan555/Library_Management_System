"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  bookAuthors,
  bookCopies,
  authors,
  categories,
  publishers,
  loans,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { bookFormSchema } from "@/lib/catalogue/validation";

export interface CatalogueActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  bookId?: string;
}

/**
 * Creates a new book in the catalogue along with authors and initial inventory copies.
 * Enforces `catalogue:create` permission.
 */
export async function createBookAction(
  _prevState: CatalogueActionResult | null,
  formData: FormData
): Promise<CatalogueActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.CREATE_BOOK)) {
    return { error: "Unauthorized. You do not have permission to add catalogue items." };
  }

  // Extract raw form entries
  const rawAuthorIds = formData.getAll("authorIds").map((id) => id.toString()).filter(Boolean);
  const newAuthorName = formData.get("newAuthorName")?.toString().trim();
  const newCategoryName = formData.get("newCategoryName")?.toString().trim();
  const newPublisherName = formData.get("newPublisherName")?.toString().trim();

  let categoryId = formData.get("categoryId")?.toString() || null;
  let publisherId = formData.get("publisherId")?.toString() || null;

  // Handle on-the-fly Category creation if specified
  if (newCategoryName) {
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const [insertedCategory] = await db
        .insert(categories)
        .values({
          name: newCategoryName,
          slug: slug || `cat-${Date.now()}`,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedCategory) {
        categoryId = insertedCategory.id;
      } else {
        const existingCat = await db.query.categories.findFirst({
          where: eq(categories.name, newCategoryName),
        });
        if (existingCat) categoryId = existingCat.id;
      }
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  }

  // Handle on-the-fly Publisher creation if specified
  if (newPublisherName) {
    try {
      const [insertedPublisher] = await db
        .insert(publishers)
        .values({
          name: newPublisherName,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedPublisher) {
        publisherId = insertedPublisher.id;
      } else {
        const existingPub = await db.query.publishers.findFirst({
          where: eq(publishers.name, newPublisherName),
        });
        if (existingPub) publisherId = existingPub.id;
      }
    } catch (err) {
      console.error("Failed to create publisher:", err);
    }
  }

  // Handle on-the-fly Author creation if specified
  const authorIds = [...rawAuthorIds];
  if (newAuthorName) {
    try {
      const [insertedAuthor] = await db
        .insert(authors)
        .values({
          name: newAuthorName,
        })
        .returning();

      if (insertedAuthor) {
        authorIds.push(insertedAuthor.id);
      }
    } catch (err) {
      console.error("Failed to create author:", err);
    }
  }

  const rawData = {
    title: formData.get("title")?.toString().trim() ?? "",
    subtitle: formData.get("subtitle")?.toString().trim() ?? "",
    isbn: formData.get("isbn")?.toString().trim().toUpperCase() ?? "",
    description: formData.get("description")?.toString().trim() ?? "",
    coverImageUrl: formData.get("coverImageUrl")?.toString().trim() ?? "",
    edition: formData.get("edition")?.toString().trim() ?? "",
    publishYear: formData.get("publishYear")?.toString() || null,
    pages: formData.get("pages")?.toString() || null,
    language: formData.get("language")?.toString().trim() || "English",
    categoryId: categoryId || undefined,
    publisherId: publisherId || undefined,
    callNumber: formData.get("callNumber")?.toString().trim() ?? "",
    authorIds: authorIds,
    initialCopies: formData.get("initialCopies")?.toString() || "1",
    shelfLocation: formData.get("shelfLocation")?.toString().trim() || "General Stacks",
  };

  const validation = bookFormSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  // Verify unique ISBN
  const existingIsbn = await db.query.books.findFirst({
    where: eq(books.isbn, data.isbn),
  });

  if (existingIsbn) {
    return {
      fieldErrors: {
        isbn: ["This ISBN is already registered for another book in the catalogue."],
      },
    };
  }

  let createdBookId: string;

  try {
    const initialCopiesCount = data.initialCopies || 0;

    // 1. Insert book record
    const [newBook] = await db
      .insert(books)
      .values({
        title: data.title,
        subtitle: data.subtitle || null,
        isbn: data.isbn,
        description: data.description || null,
        coverImageUrl: data.coverImageUrl || null,
        edition: data.edition || null,
        publishYear: data.publishYear || null,
        pages: data.pages || null,
        language: data.language,
        categoryId: data.categoryId || null,
        publisherId: data.publisherId || null,
        callNumber: data.callNumber || null,
        totalCopies: initialCopiesCount,
        availableCopies: initialCopiesCount,
      })
      .returning();

    createdBookId = newBook.id;

    // 2. Link authors
    if (data.authorIds.length > 0) {
      await db.insert(bookAuthors).values(
        data.authorIds.map((authorId) => ({
          bookId: newBook.id,
          authorId,
        }))
      );
    }

    // 3. Generate physical copies if requested
    if (initialCopiesCount > 0) {
      const copyValues = Array.from({ length: initialCopiesCount }).map((_, index) => {
        const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return {
          bookId: newBook.id,
          barcode: `BC-${data.isbn.replace(/[^A-Z0-9]/g, "")}-${index + 1}-${uniqueSuffix}`,
          shelfLocation: data.shelfLocation || "General Stacks",
          status: "available" as const,
        };
      });

      await db.insert(bookCopies).values(copyValues);
    }
  } catch (err) {
    console.error("Error creating book:", err);
    return {
      error: "An unexpected error occurred while saving the book. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath("/dashboard");
  redirect(`/catalogue/${createdBookId}`);
}

/**
 * Updates an existing book in the catalogue.
 * Enforces `catalogue:update` permission.
 */
export async function updateBookAction(
  bookId: string,
  _prevState: CatalogueActionResult | null,
  formData: FormData
): Promise<CatalogueActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.UPDATE_BOOK)) {
    return { error: "Unauthorized. You do not have permission to update catalogue items." };
  }

  const rawAuthorIds = formData.getAll("authorIds").map((id) => id.toString()).filter(Boolean);
  const newAuthorName = formData.get("newAuthorName")?.toString().trim();
  const newCategoryName = formData.get("newCategoryName")?.toString().trim();
  const newPublisherName = formData.get("newPublisherName")?.toString().trim();

  let categoryId = formData.get("categoryId")?.toString() || null;
  let publisherId = formData.get("publisherId")?.toString() || null;

  if (newCategoryName) {
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const [insertedCategory] = await db
        .insert(categories)
        .values({
          name: newCategoryName,
          slug: slug || `cat-${Date.now()}`,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedCategory) {
        categoryId = insertedCategory.id;
      } else {
        const existingCat = await db.query.categories.findFirst({
          where: eq(categories.name, newCategoryName),
        });
        if (existingCat) categoryId = existingCat.id;
      }
    } catch (err) {
      console.error("Failed to create category during update:", err);
    }
  }

  if (newPublisherName) {
    try {
      const [insertedPublisher] = await db
        .insert(publishers)
        .values({
          name: newPublisherName,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedPublisher) {
        publisherId = insertedPublisher.id;
      } else {
        const existingPub = await db.query.publishers.findFirst({
          where: eq(publishers.name, newPublisherName),
        });
        if (existingPub) publisherId = existingPub.id;
      }
    } catch (err) {
      console.error("Failed to create publisher during update:", err);
    }
  }

  const authorIds = [...rawAuthorIds];
  if (newAuthorName) {
    try {
      const [insertedAuthor] = await db
        .insert(authors)
        .values({
          name: newAuthorName,
        })
        .returning();

      if (insertedAuthor) {
        authorIds.push(insertedAuthor.id);
      }
    } catch (err) {
      console.error("Failed to create author during update:", err);
    }
  }

  const rawData = {
    title: formData.get("title")?.toString().trim() ?? "",
    subtitle: formData.get("subtitle")?.toString().trim() ?? "",
    isbn: formData.get("isbn")?.toString().trim().toUpperCase() ?? "",
    description: formData.get("description")?.toString().trim() ?? "",
    coverImageUrl: formData.get("coverImageUrl")?.toString().trim() ?? "",
    edition: formData.get("edition")?.toString().trim() ?? "",
    publishYear: formData.get("publishYear")?.toString() || null,
    pages: formData.get("pages")?.toString() || null,
    language: formData.get("language")?.toString().trim() || "English",
    categoryId: categoryId || undefined,
    publisherId: publisherId || undefined,
    callNumber: formData.get("callNumber")?.toString().trim() ?? "",
    authorIds: authorIds,
    initialCopies: 0,
  };

  const validation = bookFormSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  // Check unique ISBN on other books
  const isbnConflict = await db.query.books.findFirst({
    where: and(eq(books.isbn, data.isbn), ne(books.id, bookId)),
  });

  if (isbnConflict) {
    return {
      fieldErrors: {
        isbn: ["This ISBN is already assigned to another book."],
      },
    };
  }

  try {
    // 1. Update book record
    await db
      .update(books)
      .set({
        title: data.title,
        subtitle: data.subtitle || null,
        isbn: data.isbn,
        description: data.description || null,
        coverImageUrl: data.coverImageUrl || null,
        edition: data.edition || null,
        publishYear: data.publishYear || null,
        pages: data.pages || null,
        language: data.language,
        categoryId: data.categoryId || null,
        publisherId: data.publisherId || null,
        callNumber: data.callNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId));

    // 2. Refresh book authors: delete existing relations, then insert updated
    await db.delete(bookAuthors).where(eq(bookAuthors.bookId, bookId));

    if (data.authorIds.length > 0) {
      await db.insert(bookAuthors).values(
        data.authorIds.map((authorId) => ({
          bookId,
          authorId,
        }))
      );
    }
  } catch (err) {
    console.error("Error updating book:", err);
    return {
      error: "An unexpected error occurred while updating the book.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${bookId}`);
  redirect(`/catalogue/${bookId}`);
}

/**
 * Deletes a book from the catalogue with safety checks.
 * Enforces `catalogue:delete` permission and prevents deletion if active loans exist.
 */
export async function deleteBookAction(bookId: string): Promise<CatalogueActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.DELETE_BOOK)) {
    return { error: "Unauthorized. You do not have permission to delete catalogue items." };
  }

  try {
    // Safety check: Check for active loans associated with this book
    const activeLoan = await db.query.loans.findFirst({
      where: and(eq(loans.bookId, bookId), eq(loans.status, "active")),
    });

    if (activeLoan) {
      return {
        error: "Cannot delete this title because one or more copies are currently checked out on active loan.",
      };
    }

    // Delete the book (cascade foreign keys will remove book_authors and book_copies)
    await db.delete(books).where(eq(books.id, bookId));
  } catch (err) {
    console.error("Error deleting book:", err);
    return {
      error: "An error occurred while attempting to delete the book.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath("/dashboard");
  redirect("/catalogue");
}
