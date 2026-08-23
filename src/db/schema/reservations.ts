import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { books } from "./books";
import { users } from "./users";
import { reservationStatusEnum } from "./enums";

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  reservationDate: timestamp("reservation_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  status: reservationStatusEnum("status").default("pending").notNull(),
  queuePosition: integer("queue_position").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
