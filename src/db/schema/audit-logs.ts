import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_logs_created_at").on(table.createdAt),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_user_id").on(table.userId),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
