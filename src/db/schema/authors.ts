import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const authors = pgTable("authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
