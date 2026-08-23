import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { books } from "./books";
import { copyStatusEnum } from "./enums";

export const bookCopies = pgTable("book_copies", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  barcode: varchar("barcode", { length: 100 }).unique().notNull(),
  shelfLocation: varchar("shelf_location", { length: 100 }).notNull(),
  status: copyStatusEnum("status").default("available").notNull(),
  conditionNotes: text("condition_notes"),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
