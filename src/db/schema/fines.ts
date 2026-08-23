import { pgTable, uuid, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { loans } from "./loans";
import { users } from "./users";
import { fineStatusEnum } from "./enums";

export const fines = pgTable("fines", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id").references(() => loans.id, { onDelete: "set null" }),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: fineStatusEnum("status").default("unpaid").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  waivedById: uuid("waived_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reason: varchar("reason", { length: 255 }).default("Overdue loan").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
