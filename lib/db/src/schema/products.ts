import { pgTable, serial, text, boolean, integer, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ProductVariant = {
  label: string;
  priceAdjust: number;
  inStock: boolean;
};

export type TierPricing = {
  minQty: number;
  pricePerUnit: number;
};

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  // Variant support
  variants: json("variants").$type<ProductVariant[]>(),
  customNotesEnabled: boolean("custom_notes_enabled").notNull().default(false),
  // Flash sale
  flashSalePrice: numeric("flash_sale_price", { precision: 10, scale: 2 }),
  flashSaleEndsAt: timestamp("flash_sale_ends_at", { withTimezone: true }),
  // Tiered pricing (buy-more-pay-less)
  tieredPricing: json("tiered_pricing").$type<TierPricing[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
