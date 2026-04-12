import { pgTable, serial, text, integer, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  storeName: text("store_name").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  items: json("items").notNull().$type<Array<{ productId: number; productName: string; quantity: number; price: number }>>(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("placed"), // placed | confirmed | out_for_delivery | delivered | cancelled
  paymentMethod: text("payment_method").notNull().default("cod"),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
