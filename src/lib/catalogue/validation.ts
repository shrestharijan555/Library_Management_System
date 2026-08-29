import { z } from "zod";

export const bookFormSchema = z.object({
  title: z
    .string()
    .min(1, "Book title is required")
    .max(500, "Title cannot exceed 500 characters"),
  subtitle: z
    .string()
    .max(500, "Subtitle cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
  isbn: z
    .string()
    .min(10, "ISBN must be at least 10 characters")
    .max(20, "ISBN cannot exceed 20 characters")
    .regex(/^[0-9X\-]+$/i, "ISBN contains invalid characters"),
  description: z.string().optional().or(z.literal("")),
  coverImageUrl: z
    .string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
  edition: z
    .string()
    .max(50, "Edition cannot exceed 50 characters")
    .optional()
    .or(z.literal("")),
  publishYear: z.coerce
    .number()
    .int()
    .min(1000, "Invalid publication year")
    .max(new Date().getFullYear() + 1, "Publication year cannot be in the future")
    .optional()
    .nullable(),
  pages: z.coerce
    .number()
    .int()
    .positive("Pages must be greater than 0")
    .optional()
    .nullable(),
  language: z
    .string()
    .min(1, "Language is required")
    .max(50, "Language cannot exceed 50 characters")
    .default("English"),
  categoryId: z.string().uuid("Invalid category ID").optional().or(z.literal("")),
  publisherId: z.string().uuid("Invalid publisher ID").optional().or(z.literal("")),
  callNumber: z
    .string()
    .max(100, "Call number cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  authorIds: z.array(z.string().uuid()).min(1, "At least one author is required"),
  // Fields for initial copy generation (used on create)
  initialCopies: z.coerce
    .number()
    .int()
    .min(0, "Copies cannot be negative")
    .max(100, "Cannot add more than 100 copies at once")
    .default(1),
  shelfLocation: z
    .string()
    .max(100, "Shelf location cannot exceed 100 characters")
    .default("General Stacks")
    .optional()
    .or(z.literal("")),
});

export type BookFormInput = z.infer<typeof bookFormSchema>;

export const catalogueQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  status: z.enum(["all", "available", "borrowed", "low_stock"]).default("all"),
  sort: z
    .enum([
      "newest",
      "oldest",
      "title_asc",
      "title_desc",
      "year_desc",
      "year_asc",
      "copies_desc",
    ])
    .default("newest"),
  view: z.enum(["grid", "table"]).default("grid"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(12),
});

export type CatalogueQueryParams = z.infer<typeof catalogueQuerySchema>;
