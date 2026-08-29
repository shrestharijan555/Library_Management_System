"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne, count, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  bookCopies,
  loans,
  users,
  authors,
  bookAuthors,
} from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import {
  addCopiesSchema,
  updateCopySchema,
  updateCopyStatusSchema,
  deleteCopySchema,
  barcodeLookupSchema,
} from "@/lib/inventory/validation";
import type { BookCopy, Book, Author, CopyStatus } from "@/types";

export interface ActiveLoanSummary {
  loanId: string;
  issueDate: Date;
  dueDate: Date;
  renewalCount: number;
  userId: string;
  userName: string;
  memberCode: string;
  userEmail: string;
}

export interface BarcodeLookupData {
  copy: BookCopy;
  book: Book;
  authors: Array<Pick<Author, "id" | "name">>;
  activeLoan: ActiveLoanSummary | null;
  totalCirculationCount: number;
}

export interface InventoryActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
  data?: BarcodeLookupData;
}

/**
 * Recalculates and updates `totalCopies` and `availableCopies` on the books table
 * to ensure 100% data consistency.
 */
async function syncBookCopyCounters(bookId: string): Promise<void> {
  const [totalRes] = await db
    .select({ count: count() })
    .from(bookCopies)
    .where(eq(bookCopies.bookId, bookId));

  const [availableRes] = await db
    .select({ count: count() })
    .from(bookCopies)
    .where(
      and(
        eq(bookCopies.bookId, bookId),
        eq(bookCopies.status, "available")
      )
    );

  const total = totalRes?.count ?? 0;
  const available = availableRes?.count ?? 0;

  await db
    .update(books)
    .set({
      totalCopies: total,
      availableCopies: available,
      updatedAt: new Date(),
    })
    .where(eq(books.id, bookId));
}

/**
 * Generates a collision-resistant unique barcode for a book copy.
 */
async function generateUniqueBarcode(isbn: string, index: number): Promise<string> {
  const cleanIsbn = isbn.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const candidate = `BC-${cleanIsbn}-${index}-${randomSuffix}`;
    const existing = await db.query.bookCopies.findFirst({
      where: eq(bookCopies.barcode, candidate),
    });
    if (!existing) {
      return candidate;
    }
  }
  return `BC-${cleanIsbn}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Server Action: Add one or multiple physical copies to an existing book title.
 * Enforces `inventory:manage` permission.
 */
export async function addBookCopiesAction(
  _prevState: InventoryActionResult | null,
  formData: FormData
): Promise<InventoryActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_INVENTORY)) {
    return {
      error: "Unauthorized. You do not have permission to add physical copies.",
    };
  }

  const rawData = {
    bookId: formData.get("bookId")?.toString().trim() ?? "",
    quantity: formData.get("quantity")?.toString().trim() ?? "1",
    shelfLocation: formData.get("shelfLocation")?.toString().trim() ?? "General Stacks",
    conditionNotes: formData.get("conditionNotes")?.toString().trim() ?? "",
    customBarcode: formData.get("customBarcode")?.toString().trim() ?? "",
    status: (formData.get("status")?.toString().trim() || "available") as "available" | "maintenance" | "lost",
  };

  const validation = addCopiesSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { bookId, quantity, shelfLocation, conditionNotes, customBarcode, status } =
    validation.data;

  // 1. Verify book exists
  const book = await db.query.books.findFirst({
    where: eq(books.id, bookId),
  });

  if (!book) {
    return { error: "Target catalogue title was not found." };
  }

  // 2. If custom barcode provided (single addition), verify uniqueness
  if (customBarcode && customBarcode.length > 0) {
    const existingBarcode = await db.query.bookCopies.findFirst({
      where: eq(bookCopies.barcode, customBarcode),
    });

    if (existingBarcode) {
      return {
        fieldErrors: {
          customBarcode: [
            `Barcode "${customBarcode}" is already assigned to another physical copy in the inventory.`,
          ],
        },
      };
    }
  }

  // 3. Count existing copies to determine barcode indices
  const [existingCopiesCountRes] = await db
    .select({ count: count() })
    .from(bookCopies)
    .where(eq(bookCopies.bookId, bookId));

  const baseIndex = (existingCopiesCountRes?.count ?? 0) + 1;

  try {
    const newCopyRows = [];

    for (let i = 0; i < quantity; i++) {
      let barcode: string;
      if (quantity === 1 && customBarcode && customBarcode.length > 0) {
        barcode = customBarcode;
      } else {
        barcode = await generateUniqueBarcode(book.isbn, baseIndex + i);
      }

      newCopyRows.push({
        bookId,
        barcode,
        shelfLocation,
        conditionNotes: conditionNotes || null,
        status: status as CopyStatus,
      });
    }

    // Insert copy records
    await db.insert(bookCopies).values(newCopyRows);

    // Sync book copy counters for atomic consistency
    await syncBookCopyCounters(bookId);
  } catch (err) {
    console.error("Error adding book copies:", err);
    return {
      error: "An unexpected database error occurred while creating copies. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${bookId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Successfully registered ${quantity} physical ${
      quantity === 1 ? "copy" : "copies"
    } in inventory.`,
  };
}

/**
 * Server Action: Update metadata for an existing physical copy.
 * Enforces `inventory:manage` permission.
 */
export async function updateBookCopyAction(
  copyId: string,
  _prevState: InventoryActionResult | null,
  formData: FormData
): Promise<InventoryActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_INVENTORY)) {
    return {
      error: "Unauthorized. You do not have permission to update inventory copies.",
    };
  }

  const rawData = {
    copyId,
    bookId: formData.get("bookId")?.toString().trim() ?? "",
    barcode: formData.get("barcode")?.toString().trim() ?? "",
    shelfLocation: formData.get("shelfLocation")?.toString().trim() ?? "",
    conditionNotes: formData.get("conditionNotes")?.toString().trim() ?? "",
    status: formData.get("status")?.toString().trim() as CopyStatus,
  };

  const validation = updateCopySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { bookId, barcode, shelfLocation, conditionNotes, status: newStatus } =
    validation.data;

  // 1. Verify copy exists
  const existingCopy = await db.query.bookCopies.findFirst({
    where: eq(bookCopies.id, copyId),
  });

  if (!existingCopy) {
    return { error: "Copy record was not found." };
  }

  // 2. Check barcode conflict with other copies
  if (barcode !== existingCopy.barcode) {
    const barcodeConflict = await db.query.bookCopies.findFirst({
      where: and(eq(bookCopies.barcode, barcode), ne(bookCopies.id, copyId)),
    });

    if (barcodeConflict) {
      return {
        fieldErrors: {
          barcode: [`Barcode "${barcode}" is already assigned to another physical copy.`],
        },
      };
    }
  }

  // 3. Safety checks on status changes
  if (newStatus !== existingCopy.status) {
    const activeLoan = await db.query.loans.findFirst({
      where: and(eq(loans.copyId, copyId), eq(loans.status, "active")),
    });

    if (activeLoan) {
      if (newStatus === "available") {
        return {
          error:
            "Cannot set status to 'Available' while this copy is currently checked out on an active loan. Process the return via the circulation desk first.",
        };
      }
    }
  }

  try {
    await db
      .update(bookCopies)
      .set({
        barcode,
        shelfLocation,
        conditionNotes: conditionNotes || null,
        status: newStatus as CopyStatus,
        updatedAt: new Date(),
      })
      .where(eq(bookCopies.id, copyId));

    // Recalculate counters
    await syncBookCopyCounters(bookId);
  } catch (err) {
    console.error("Error updating book copy:", err);
    return {
      error: "An unexpected error occurred while updating copy metadata.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${bookId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Physical copy metadata updated successfully.",
  };
}

/**
 * Server Action: Quickly update the status and optional notes of a copy.
 * Enforces `inventory:manage` permission and safe transition rules.
 */
export async function updateCopyStatusAction(
  copyId: string,
  bookId: string,
  newStatus: CopyStatus,
  conditionNotes?: string
): Promise<InventoryActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_INVENTORY)) {
    return {
      error: "Unauthorized. You do not have permission to change copy statuses.",
    };
  }

  const validation = updateCopyStatusSchema.safeParse({
    copyId,
    bookId,
    status: newStatus,
    conditionNotes,
  });

  if (!validation.success) {
    return {
      error: "Invalid status update payload.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const existingCopy = await db.query.bookCopies.findFirst({
    where: eq(bookCopies.id, copyId),
  });

  if (!existingCopy) {
    return { error: "Copy record was not found." };
  }

  // Safety checks: Active loans
  const activeLoan = await db.query.loans.findFirst({
    where: and(eq(loans.copyId, copyId), eq(loans.status, "active")),
  });

  if (activeLoan && newStatus === "available") {
    return {
      error:
        "Cannot mark copy as Available while it is currently checked out on an active loan.",
    };
  }

  try {
    await db
      .update(bookCopies)
      .set({
        status: newStatus,
        conditionNotes: conditionNotes !== undefined ? conditionNotes || null : existingCopy.conditionNotes,
        updatedAt: new Date(),
      })
      .where(eq(bookCopies.id, copyId));

    await syncBookCopyCounters(bookId);
  } catch (err) {
    console.error("Error updating copy status:", err);
    return {
      error: "Failed to update copy status.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${bookId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Copy status updated to ${newStatus}.`,
  };
}

/**
 * Server Action: Safely delete a physical copy record.
 * Enforces `inventory:manage` permission, checks for active loans,
 * and handles historical loan foreign key constraints safely.
 */
export async function deleteBookCopyAction(
  copyId: string,
  bookId: string
): Promise<InventoryActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_INVENTORY)) {
    return {
      error: "Unauthorized. You do not have permission to delete physical copies.",
    };
  }

  const validation = deleteCopySchema.safeParse({ copyId, bookId });

  if (!validation.success) {
    return { error: "Invalid copy deletion request." };
  }

  // 1. Verify copy exists
  const existingCopy = await db.query.bookCopies.findFirst({
    where: eq(bookCopies.id, copyId),
  });

  if (!existingCopy) {
    return { error: "Copy record was not found or has already been deleted." };
  }

  // 2. Check for active loan
  const activeLoan = await db.query.loans.findFirst({
    where: and(eq(loans.copyId, copyId), eq(loans.status, "active")),
  });

  if (activeLoan) {
    return {
      error:
        "Cannot delete this physical copy because it is currently checked out on an active loan. Process the return first.",
    };
  }

  // 3. Check for historical circulation loans (foreign key restrict safety)
  const historicalLoan = await db.query.loans.findFirst({
    where: eq(loans.copyId, copyId),
  });

  if (historicalLoan) {
    return {
      error:
        "Cannot permanently delete this copy because historical circulation records reference it. To decommission this physical item, please change its status to 'Lost' or 'Maintenance' instead.",
    };
  }

  try {
    await db.delete(bookCopies).where(eq(bookCopies.id, copyId));

    // Recalculate counters
    await syncBookCopyCounters(bookId);
  } catch (err) {
    console.error("Error deleting book copy:", err);
    return {
      error: "An unexpected error occurred while deleting the copy.",
    };
  }

  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/${bookId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Physical copy removed from inventory.",
  };
}

/**
 * Server Action: Barcode Quick Lookup
 * Resolves barcode -> physical copy, book title, authors, copy status, location, and active loan details.
 * Enforces `inventory:scan` or `inventory:manage` or `catalogue:view`.
 */
export async function lookupBarcodeAction(
  barcode: string
): Promise<InventoryActionResult> {
  const session = await requireAuthUser();

  if (
    !hasPermission(session.appUser.role, PERMISSIONS.SCAN_BARCODE) &&
    !hasPermission(session.appUser.role, PERMISSIONS.MANAGE_INVENTORY) &&
    !hasPermission(session.appUser.role, PERMISSIONS.VIEW_CATALOGUE)
  ) {
    return {
      error: "Unauthorized. You do not have permission to perform barcode lookups.",
    };
  }

  const validation = barcodeLookupSchema.safeParse({ barcode: barcode.trim() });

  if (!validation.success) {
    return {
      error: "Please enter a valid barcode to search.",
    };
  }

  const searchBarcode = validation.data.barcode;

  try {
    // 1. Query copy
    const copy = await db.query.bookCopies.findFirst({
      where: sql`LOWER(${bookCopies.barcode}) = LOWER(${searchBarcode})`,
    });

    if (!copy) {
      return {
        error: `No copy found in inventory with barcode "${searchBarcode}".`,
      };
    }

    // 2. Query parent book
    const book = await db.query.books.findFirst({
      where: eq(books.id, copy.bookId),
    });

    if (!book) {
      return {
        error: "Copy exists but associated catalogue title record was not found.",
      };
    }

    // 3. Query authors
    const bookAuthorsList = await db
      .select({
        id: authors.id,
        name: authors.name,
      })
      .from(bookAuthors)
      .innerJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, book.id));

    // 4. Query active loan if currently checked out
    let activeLoanInfo = null;
    if (copy.status === "borrowed") {
      const activeLoan = await db
        .select({
          loanId: loans.id,
          issueDate: loans.issueDate,
          dueDate: loans.dueDate,
          renewalCount: loans.renewalCount,
          userId: users.id,
          userName: users.fullName,
          memberCode: users.memberCode,
          userEmail: users.email,
        })
        .from(loans)
        .innerJoin(users, eq(loans.userId, users.id))
        .where(
          and(eq(loans.copyId, copy.id), eq(loans.status, "active"))
        )
        .limit(1);

      if (activeLoan.length > 0) {
        activeLoanInfo = activeLoan[0];
      }
    }

    // 5. Query total circulation count
    const [loanCountRes] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.copyId, copy.id));

    return {
      success: true,
      data: {
        copy,
        book,
        authors: bookAuthorsList,
        activeLoan: activeLoanInfo,
        totalCirculationCount: loanCountRes?.count ?? 0,
      },
    };
  } catch (err) {
    console.error("Barcode lookup error:", err);
    return {
      error: "An unexpected error occurred during barcode lookup.",
    };
  }
}
