import { pgTable, serial, text, boolean, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // 'percent' | 'fixed'
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }), // cap for percent coupons
  storeId: integer("store_id"), // null = platform-wide (admin coupon)
  isActive: boolean("is_active").notNull().default(true),
  usageLimit: integer("usage_limit"), // null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true, usedCount: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;
