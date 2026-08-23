import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const publishers = pgTable("publishers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
