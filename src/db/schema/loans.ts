import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { books } from "./books";
import { bookCopies } from "./book-copies";
import { users } from "./users";
import { loanStatusEnum } from "./enums";

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  copyId: uuid("copy_id")
    .references(() => bookCopies.id, { onDelete: "restrict" })
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "restrict" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  issuedById: uuid("issued_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  issueDate: timestamp("issue_date", { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  returnDate: timestamp("return_date", { withTimezone: true }),
  status: loanStatusEnum("status").default("active").notNull(),
  renewalCount: integer("renewal_count").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
