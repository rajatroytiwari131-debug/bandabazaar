import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeOwnersTable = pgTable("store_owners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  storeId: integer("store_id"),
  businessLicenseNo: text("business_license_no"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStoreOwnerSchema = createInsertSchema(storeOwnersTable).omit({ id: true, createdAt: true });
export type InsertStoreOwner = z.infer<typeof insertStoreOwnerSchema>;
export type StoreOwner = typeof storeOwnersTable.$inferSelect;
