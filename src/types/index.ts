import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  categories,
  authors,
  publishers,
  books,
  bookAuthors,
  bookCopies,
  loans,
  reservations,
  fines,
  auditLogs,
  systemSettings,
} from "@/db/schema";

export type { UserRole, Permission } from "@/config/roles";
export type { LibraryPolicy, NavItem } from "@/config/site";

// Database Model Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserStatus = User["status"];

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Author = InferSelectModel<typeof authors>;
export type NewAuthor = InferInsertModel<typeof authors>;

export type Publisher = InferSelectModel<typeof publishers>;
export type NewPublisher = InferInsertModel<typeof publishers>;

export type Book = InferSelectModel<typeof books>;
export type NewBook = InferInsertModel<typeof books>;

export type BookAuthor = InferSelectModel<typeof bookAuthors>;
export type NewBookAuthor = InferInsertModel<typeof bookAuthors>;

export type BookCopy = InferSelectModel<typeof bookCopies>;
export type NewBookCopy = InferInsertModel<typeof bookCopies>;
export type CopyStatus = BookCopy["status"];

export type Loan = InferSelectModel<typeof loans>;
export type NewLoan = InferInsertModel<typeof loans>;

export type Reservation = InferSelectModel<typeof reservations>;
export type NewReservation = InferInsertModel<typeof reservations>;

export type Fine = InferSelectModel<typeof fines>;
export type NewFine = InferInsertModel<typeof fines>;

export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;

export type SystemSetting = InferSelectModel<typeof systemSettings>;
export type NewSystemSetting = InferInsertModel<typeof systemSettings>;

// Composite Domain Types for UI / API
export interface BookWithRelations extends Book {
  category?: Category | null;
  publisher?: Publisher | null;
  authors?: Author[];
  copies?: BookCopy[];
}

export interface LoanWithRelations extends Loan {
  book?: Book;
  copy?: BookCopy;
  user?: User;
  fines?: Fine[];
}

export interface MemberSummary extends User {
  activeLoansCount?: number;
  totalFinesDueCents?: number;
}
