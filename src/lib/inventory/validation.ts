import { z } from "zod";

export const addCopiesSchema = z
  .object({
    bookId: z.string().uuid("Invalid book ID"),
    quantity: z.coerce
      .number()
      .int()
      .min(1, "Quantity must be at least 1")
      .max(100, "Cannot add more than 100 copies in a single batch")
      .default(1),
    shelfLocation: z
      .string()
      .min(1, "Shelf location is required")
      .max(100, "Shelf location cannot exceed 100 characters")
      .default("General Stacks"),
    conditionNotes: z
      .string()
      .max(500, "Condition notes cannot exceed 500 characters")
      .optional()
      .or(z.literal("")),
    customBarcode: z
      .string()
      .max(100, "Barcode cannot exceed 100 characters")
      .regex(
        /^[A-Za-z0-9\-_.]+$/,
        "Barcode may only contain alphanumeric characters, hyphens, dots, and underscores"
      )
      .optional()
      .or(z.literal("")),
    status: z
      .enum(["available", "maintenance", "lost"])
      .default("available"),
  })
  .refine(
    (data) => {
      // If quantity > 1, customBarcode must not be provided (barcodes must be auto-generated for batches)
      if (data.quantity > 1 && data.customBarcode && data.customBarcode.trim().length > 0) {
        return false;
      }
      return true;
    },
    {
      message: "Custom barcode can only be specified when adding a single copy. Use auto-generation for batch additions.",
      path: ["customBarcode"],
    }
  );

export type AddCopiesInput = z.infer<typeof addCopiesSchema>;

export const updateCopySchema = z.object({
  copyId: z.string().uuid("Invalid copy ID"),
  bookId: z.string().uuid("Invalid book ID"),
  barcode: z
    .string()
    .min(1, "Barcode is required")
    .max(100, "Barcode cannot exceed 100 characters")
    .regex(
      /^[A-Za-z0-9\-_.]+$/,
      "Barcode may only contain alphanumeric characters, hyphens, dots, and underscores"
    ),
  shelfLocation: z
    .string()
    .min(1, "Shelf location is required")
    .max(100, "Shelf location cannot exceed 100 characters"),
  conditionNotes: z
    .string()
    .max(500, "Condition notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum([
    "available",
    "borrowed",
    "reserved",
    "lost",
    "maintenance",
  ]),
});

export type UpdateCopyInput = z.infer<typeof updateCopySchema>;

export const updateCopyStatusSchema = z.object({
  copyId: z.string().uuid("Invalid copy ID"),
  bookId: z.string().uuid("Invalid book ID"),
  status: z.enum([
    "available",
    "borrowed",
    "reserved",
    "lost",
    "maintenance",
  ]),
  conditionNotes: z
    .string()
    .max(500, "Condition notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateCopyStatusInput = z.infer<typeof updateCopyStatusSchema>;

export const deleteCopySchema = z.object({
  copyId: z.string().uuid("Invalid copy ID"),
  bookId: z.string().uuid("Invalid book ID"),
});

export type DeleteCopyInput = z.infer<typeof deleteCopySchema>;

export const barcodeLookupSchema = z.object({
  barcode: z
    .string()
    .min(1, "Please enter a barcode to look up")
    .max(100, "Barcode is too long"),
});

export type BarcodeLookupInput = z.infer<typeof barcodeLookupSchema>;
