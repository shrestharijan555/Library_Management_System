import { relations } from "drizzle-orm";
import { users } from "./users";
import { categories } from "./categories";
import { authors } from "./authors";
import { publishers } from "./publishers";
import { books } from "./books";
import { bookAuthors } from "./book-authors";
import { bookCopies } from "./book-copies";
import { loans } from "./loans";
import { reservations } from "./reservations";
import { fines } from "./fines";
import { auditLogs } from "./audit-logs";

export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans, { relationName: "user_loans" }),
  issuedLoans: many(loans, { relationName: "issued_by_loans" }),
  reservations: many(reservations),
  fines: many(fines, { relationName: "user_fines" }),
  waivedFines: many(fines, { relationName: "waived_fines" }),
  auditLogs: many(auditLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  bookAuthors: many(bookAuthors),
}));

export const publishersRelations = relations(publishers, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id],
  }),
  publisher: one(publishers, {
    fields: [books.publisherId],
    references: [publishers.id],
  }),
  bookAuthors: many(bookAuthors),
  copies: many(bookCopies),
  loans: many(loans),
  reservations: many(reservations),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, {
    fields: [bookAuthors.bookId],
    references: [books.id],
  }),
  author: one(authors, {
    fields: [bookAuthors.authorId],
    references: [authors.id],
  }),
}));

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
  book: one(books, {
    fields: [bookCopies.bookId],
    references: [books.id],
  }),
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  copy: one(bookCopies, {
    fields: [loans.copyId],
    references: [bookCopies.id],
  }),
  book: one(books, {
    fields: [loans.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
    relationName: "user_loans",
  }),
  issuedBy: one(users, {
    fields: [loans.issuedById],
    references: [users.id],
    relationName: "issued_by_loans",
  }),
  fines: many(fines),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  book: one(books, {
    fields: [reservations.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
}));

export const finesRelations = relations(fines, ({ one }) => ({
  loan: one(loans, {
    fields: [fines.loanId],
    references: [loans.id],
  }),
  user: one(users, {
    fields: [fines.userId],
    references: [users.id],
    relationName: "user_fines",
  }),
  waivedBy: one(users, {
    fields: [fines.waivedById],
    references: [users.id],
    relationName: "waived_fines",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
