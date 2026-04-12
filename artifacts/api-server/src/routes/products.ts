import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
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

  const [product] = await db.insert(productsTable).values({
    storeId: params.data.storeId,
    name: parsed.data.name,
    nameHindi: parsed.data.nameHindi ?? null,
    price: String(parsed.data.price),
    unit: parsed.data.unit ?? null,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl ?? null,
    inStock: parsed.data.inStock ?? true,
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

  const updateData: Partial<typeof productsTable.$inferInsert> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.nameHindi != null) updateData.nameHindi = parsed.data.nameHindi;
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.unit != null) updateData.unit = parsed.data.unit;
  if (parsed.data.category != null) updateData.category = parsed.data.category;
  if (parsed.data.imageUrl != null) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.inStock != null) updateData.inStock = parsed.data.inStock;

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
