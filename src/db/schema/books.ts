import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { publishers } from "./publishers";

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  isbn: varchar("isbn", { length: 20 }).unique().notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  edition: varchar("edition", { length: 50 }),
  publishYear: integer("publish_year"),
  pages: integer("pages"),
  language: varchar("language", { length: 50 }).default("English").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  publisherId: uuid("publisher_id").references(() => publishers.id, {
    onDelete: "set null",
  }),
  callNumber: varchar("call_number", { length: 100 }),
  totalCopies: integer("total_copies").default(0).notNull(),
  availableCopies: integer("available_copies").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
