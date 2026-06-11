import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, storesTable, ordersTable } from "@workspace/db";
import {
  AdminListStoresQueryParams,
  ApproveStoreParams,
  RejectStoreParams,
  BlockStoreParams,
  BlockStoreBody,
  ListCommissionsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/auth";

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

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    storeId: o.storeId,
    storeName: o.storeName,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    items: o.items as Array<{ productId: number; productName: string; quantity: number; price: number }>,
    subtotal: Number(o.subtotal),
    commissionAmount: Number(o.commissionAmount),
    status: o.status,
    paymentMethod: o.paymentMethod,
    rating: o.rating ?? null,
    ratingComment: o.ratingComment ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt?.toISOString() ?? null,
  };
}

router.get("/admin/stores", requireAdmin, async (req, res): Promise<void> => {
  const query = AdminListStoresQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status } = query.data;
  const stores = status
    ? await db.select().from(storesTable).where(eq(storesTable.status, status))
    : await db.select().from(storesTable);

  res.json(stores.map(formatStore));
});

router.post("/admin/stores/:storeId/approve", requireAdmin, async (req, res): Promise<void> => {
  const params = ApproveStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.update(storesTable)
    .set({ status: "approved" })
    .where(eq(storesTable.id, params.data.storeId))
    .returning();

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(store));
});

router.post("/admin/stores/:storeId/reject", requireAdmin, async (req, res): Promise<void> => {
  const params = RejectStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [store] = await db.update(storesTable)
    .set({ status: "rejected" })
    .where(eq(storesTable.id, params.data.storeId))
    .returning();

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(store));
});

router.post("/admin/stores/:storeId/block", requireAdmin, async (req, res): Promise<void> => {
  const params = BlockStoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = BlockStoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db.update(storesTable)
    .set({ status: parsed.data.blocked ? "blocked" : "approved" })
    .where(eq(storesTable.id, params.data.storeId))
    .returning();

  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json(formatStore(store));
});

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const stores = await db.select().from(storesTable);
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

  const totalStores = stores.length;
  const pendingStores = stores.filter((s) => s.status === "pending").length;
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.subtotal), 0);
  const totalCommission = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.commissionAmount), 0);

  const recentOrders = orders.slice(0, 10).map(formatOrder);
  const approvedStores = stores.filter((s) => s.status === "approved");
  const topStores = approvedStores
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
    .slice(0, 5)
    .map(formatStore);

  res.json({
    totalStores,
    pendingStores,
    totalOrders,
    totalRevenue,
    totalCommission,
    recentOrders,
    topStores,
  });
});

router.get("/admin/commissions", requireAdmin, async (req, res): Promise<void> => {
  const query = ListCommissionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { storeId } = query.data;
  const orders = storeId
    ? await db.select().from(ordersTable).where(eq(ordersTable.storeId, storeId))
    : await db.select().from(ordersTable);

  const commissions = orders.map((o) => ({
    orderId: o.id,
    storeId: o.storeId,
    storeName: o.storeName,
    orderAmount: Number(o.subtotal),
    commissionRate: 8,
    commissionAmount: Number(o.commissionAmount),
    createdAt: o.createdAt.toISOString(),
  }));

  res.json(commissions);
});

export default router;
