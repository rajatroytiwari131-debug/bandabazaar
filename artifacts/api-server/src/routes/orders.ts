import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, storesTable, productsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  RateOrderParams,
  RateOrderBody,
} from "@workspace/api-zod";
import { requireOwner } from "../middleware/auth";

const router: IRouter = Router();

const COMMISSION_RATE = 8;

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

// ─── Public: list orders (filter by customerPhone for order history, or storeId) ──
router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { storeId, customerPhone, status } = query.data;
  const conditions = [];
  if (storeId) conditions.push(eq(ordersTable.storeId, storeId));
  if (customerPhone) conditions.push(eq(ordersTable.customerPhone, customerPhone));
  if (status) conditions.push(eq(ordersTable.status, status));

  const orders = conditions.length
    ? await db.select().from(ordersTable).where(and(...conditions))
    : await db.select().from(ordersTable);

  res.json(orders.map(formatOrder));
});

// ─── Public: place a new order (COD, no account required) ─────────────────────
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, parsed.data.storeId));
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  if (store.status !== "approved") {
    res.status(400).json({ error: "Store is not accepting orders right now" });
    return;
  }

  const products = await db.select().from(productsTable)
    .where(eq(productsTable.storeId, parsed.data.storeId));

  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      price: Number(product.price),
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const commissionRate = Number(store.commissionRate ?? COMMISSION_RATE);
  const commissionAmount = (subtotal * commissionRate) / 100;

  const [order] = await db.insert(ordersTable).values({
    storeId: parsed.data.storeId,
    storeName: store.name,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    customerAddress: parsed.data.customerAddress,
    items: orderItems,
    subtotal: String(subtotal),
    commissionAmount: String(commissionAmount),
    paymentMethod: parsed.data.paymentMethod,
    status: "placed",
  }).returning();

  res.status(201).json(formatOrder(order));
});

// ─── Public: get order by ID (order tracking) ─────────────────────────────────
router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

// ─── Protected: update order status (store owner of that order, or admin) ─────
router.put("/orders/:orderId", requireOwner, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch the order first to verify store ownership
  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.orderId));
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Store owners can only update orders for their own store
  if (req.user!.role === "store_owner" && req.user!.storeId !== existing.storeId) {
    res.status(403).json({ error: "You can only manage orders for your own store." });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Recalculate store rating when order is delivered
  if (parsed.data.status === "delivered") {
    const deliveredOrders = await db.select().from(ordersTable)
      .where(and(eq(ordersTable.storeId, order.storeId), eq(ordersTable.status, "delivered")));

    const ratings = deliveredOrders.filter((o) => o.rating != null).map((o) => o.rating as number);
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      await db.update(storesTable)
        .set({ rating: String(avgRating.toFixed(2)), totalRatings: ratings.length })
        .where(eq(storesTable.id, order.storeId));
    }
  }

  res.json(formatOrder(order));
});

// ─── Public: rate an order (customers rate without account) ───────────────────
router.post("/orders/:orderId/rating", async (req, res): Promise<void> => {
  const params = RateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ rating: parsed.data.rating, ratingComment: parsed.data.ratingComment ?? null })
    .where(eq(ordersTable.id, params.data.orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const deliveredOrders = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.storeId, order.storeId), eq(ordersTable.status, "delivered")));

  const ratings = deliveredOrders.filter((o) => o.rating != null).map((o) => o.rating as number);
  if (ratings.length > 0) {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    await db.update(storesTable)
      .set({ rating: String(avgRating.toFixed(2)), totalRatings: ratings.length })
      .where(eq(storesTable.id, order.storeId));
  }

  res.json(formatOrder(order));
});

export default router;
