import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "librarian",
  "staff",
  "student",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "inactive",
]);

export const copyStatusEnum = pgEnum("copy_status", [
  "available",
  "borrowed",
  "reserved",
  "lost",
  "maintenance",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "returned",
  "overdue",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "fulfilled",
  "cancelled",
  "expired",
]);

export const fineStatusEnum = pgEnum("fine_status", [
  "unpaid",
  "paid",
  "waived",
]);
