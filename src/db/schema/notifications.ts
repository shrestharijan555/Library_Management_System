import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    link: varchar("link", { length: 255 }),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_notifications_user_id_created_at").on(table.userId, table.createdAt),
    index("idx_notifications_user_unread").on(table.userId, table.isRead),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
