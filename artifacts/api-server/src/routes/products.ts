import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import type { ProductVariant, TierPricing } from "@workspace/db";
import {
  ListProductsParams,
  ListProductsQueryParams,
  CreateProductParams,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  const now = new Date();
  const flashSaleActive = p.flashSalePrice != null && p.flashSaleEndsAt != null && p.flashSaleEndsAt > now;

  return {
    id: p.id,
    storeId: p.storeId,
    name: p.name,
    nameHindi: p.nameHindi ?? null,
    price: Number(p.price),
    unit: p.unit ?? null,
    category: p.category,
    imageUrl: p.imageUrl ?? null,
    inStock: p.inStock,
    variants: (p.variants as ProductVariant[] | null) ?? null,
    customNotesEnabled: p.customNotesEnabled,
    flashSalePrice: flashSaleActive ? Number(p.flashSalePrice) : null,
    flashSaleEndsAt: flashSaleActive ? p.flashSaleEndsAt!.toISOString() : null,
    tieredPricing: (p.tieredPricing as TierPricing[] | null) ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/stores/:storeId/products", async (req, res): Promise<void> => {
  const params = ListProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, search } = query.data;
  const conditions = [eq(productsTable.storeId, params.data.storeId)];
  if (category) conditions.push(eq(productsTable.category, category));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  const products = await db.select().from(productsTable).where(and(...conditions));
  res.json(products.map(formatProduct));
});

router.post("/stores/:storeId/products", async (req, res): Promise<void> => {
  const params = CreateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const [product] = await db.insert(productsTable).values({
    storeId: params.data.storeId,
    name: d.name,
    nameHindi: d.nameHindi ?? null,
    price: String(d.price),
    unit: d.unit ?? null,
    category: d.category,
    imageUrl: d.imageUrl ?? null,
    inStock: d.inStock ?? true,
    variants: d.variants ?? null,
    customNotesEnabled: d.customNotesEnabled ?? false,
    flashSalePrice: d.flashSalePrice != null ? String(d.flashSalePrice) : null,
    flashSaleEndsAt: d.flashSaleEndsAt ? new Date(d.flashSaleEndsAt) : null,
    tieredPricing: d.tieredPricing ?? null,
  }).returning();

  res.status(201).json(formatProduct(product));
});

router.put("/stores/:storeId/products/:productId", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const d = parsed.data;
  const updateData: Partial<typeof productsTable.$inferInsert> = {};
  if (d.name != null) updateData.name = d.name;
  if (d.nameHindi != null) updateData.nameHindi = d.nameHindi;
  if (d.price != null) updateData.price = String(d.price);
  if (d.unit != null) updateData.unit = d.unit;
  if (d.category != null) updateData.category = d.category;
  if (d.imageUrl != null) updateData.imageUrl = d.imageUrl;
  if (d.inStock != null) updateData.inStock = d.inStock;
  if ("variants" in d) updateData.variants = d.variants ?? null;
  if ("customNotesEnabled" in d && d.customNotesEnabled != null) updateData.customNotesEnabled = d.customNotesEnabled;
  if ("flashSalePrice" in d) updateData.flashSalePrice = d.flashSalePrice != null ? String(d.flashSalePrice) : null;
  if ("flashSaleEndsAt" in d) updateData.flashSaleEndsAt = d.flashSaleEndsAt ? new Date(d.flashSaleEndsAt) : null;
  if ("tieredPricing" in d) updateData.tieredPricing = d.tieredPricing ?? null;

  const [product] = await db.update(productsTable)
    .set(updateData)
    .where(and(eq(productsTable.id, params.data.productId), eq(productsTable.storeId, params.data.storeId)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.delete("/stores/:storeId/products/:productId", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable)
    .where(and(eq(productsTable.id, params.data.productId), eq(productsTable.storeId, params.data.storeId)))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
