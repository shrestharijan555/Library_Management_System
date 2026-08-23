import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum, userStatusEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  supabaseAuthId: uuid("supabase_auth_id").unique(),
  memberCode: varchar("member_code", { length: 50 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 50 }),
  role: userRoleEnum("role").default("student").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  avatarUrl: text("avatar_url"),
  department: varchar("department", { length: 100 }),
  gradeClass: varchar("grade_class", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
