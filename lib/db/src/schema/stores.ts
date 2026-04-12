import { pgTable, serial, text, boolean, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storesTable = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  address: text("address").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | blocked
  isOpen: boolean("is_open").notNull().default(true),
  deliveryTimeMinutes: integer("delivery_time_minutes").notNull().default(30),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  totalRatings: integer("total_ratings").notNull().default(0),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("8"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStoreSchema = createInsertSchema(storesTable).omit({ id: true, createdAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof storesTable.$inferSelect;
