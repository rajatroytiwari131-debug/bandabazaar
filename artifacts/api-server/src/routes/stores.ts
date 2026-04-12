import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, storesTable, ordersTable } from "@workspace/db";
import {
  ListStoresQueryParams,
  CreateStoreBody,
  GetStoreParams,
  UpdateStoreParams,
  UpdateStoreBody,
  GetStoreStatsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatStore(s: typeof storesTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    ownerPhone: s.ownerPhone,
    address: s.address,
    category: s.category,
    imageUrl: s.imageUrl ?? null,
    status: s.status,
    isOpen: s.isOpen,
    deliveryTimeMinutes: s.deliveryTimeMinutes,
    rating: s.rating ? Number(s.rating) : null,
    totalRatings: s.totalRatings,
    minOrderAmount: Number(s.minOrderAmount),
    commissionRate: Number(s.commissionRate),
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/stores", async (req, res): Promise<void> => {
  const query = ListStoresQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { category, search } = query.data;

  const conditions = [eq(storesTable.status, "approved")];
  if (category) conditions.push(eq(storesTable.category, category));
  if (search) conditions.push(ilike(storesTable.name, `%${search}%`));

  const stores = await db.select().from(storesTable).where(and(...conditions));
  res.json(stores.map(formatStore));
});

router.post("/stores", async (req, res): Promise<void> => {
  const parsed = CreateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db.insert(storesTable).values({
    name: parsed.data.name,
    ownerPhone: parsed.data.ownerPhone,
    address: parsed.data.address,
    category: parsed.data.category,
    imageUrl: parsed.data.imageUrl ?? null,
    minOrderAmount: String(parsed.data.minOrderAmount ?? 0),
    deliveryTimeMinutes: parsed.data.deliveryTimeMinutes ?? 30,
  }).returning();

  res.status(201).json(formatStore(store));
});

router.get("/stores/:storeId", async (req, res): Promise<void> => {
  const params = GetStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, params.data.storeId));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(store));
});

router.put("/stores/:storeId", async (req, res): Promise<void> => {
  const params = UpdateStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof storesTable.$inferInsert> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.address != null) updateData.address = parsed.data.address;
  if (parsed.data.category != null) updateData.category = parsed.data.category;
  if (parsed.data.imageUrl != null) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.isOpen != null) updateData.isOpen = parsed.data.isOpen;
  if (parsed.data.minOrderAmount != null) updateData.minOrderAmount = String(parsed.data.minOrderAmount);
  if (parsed.data.deliveryTimeMinutes != null) updateData.deliveryTimeMinutes = parsed.data.deliveryTimeMinutes;

  const [store] = await db.update(storesTable).set(updateData).where(eq(storesTable.id, params.data.storeId)).returning();
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(store));
});

router.get("/stores/:storeId/stats", async (req, res): Promise<void> => {
  const params = GetStoreStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const storeId = params.data.storeId;

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.storeId, storeId));

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const pendingOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.subtotal), 0);
  const totalCommission = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.commissionAmount), 0);

  res.json({
    storeId,
    totalOrders,
    totalRevenue,
    totalCommission,
    netEarnings: totalRevenue - totalCommission,
    pendingOrders,
    completedOrders,
  });
});

export default router;
