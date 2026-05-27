import { Router, type IRouter } from "express";
import { eq, and, isNull, or } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

function formatCoupon(c: typeof couponsTable.$inferSelect) {
  return {
    id: c.id,
    code: c.code,
    type: c.type as "percent" | "fixed",
    value: Number(c.value),
    minOrderAmount: Number(c.minOrderAmount),
    maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : null,
    storeId: c.storeId ?? null,
    isActive: c.isActive,
    usageLimit: c.usageLimit ?? null,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    description: c.description ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

const CreateCouponBody = z.object({
  code: z.string().toUpperCase(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional().default(0),
  maxDiscount: z.number().positive().nullish(),
  isActive: z.boolean().optional().default(true),
  usageLimit: z.number().int().positive().nullish(),
  expiresAt: z.string().nullish(),
  description: z.string().nullish(),
});

const UpdateCouponBody = z.object({
  value: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().nullish(),
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().positive().nullish(),
  expiresAt: z.string().nullish(),
  description: z.string().nullish(),
});

const ValidateCouponBody = z.object({
  code: z.string(),
  orderAmount: z.number().positive(),
  storeId: z.number().int().nullish(),
});

// POST /coupons/validate — public endpoint, anyone can validate
router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { code, orderAmount, storeId } = parsed.data;
  const upperCode = code.toUpperCase();

  const [coupon] = await db.select().from(couponsTable)
    .where(eq(couponsTable.code, upperCode))
    .limit(1);

  if (!coupon) {
    res.status(400).json({
      valid: false, code: upperCode, discountAmount: 0,
      message: "Invalid coupon code"
    });
    return;
  }

  if (!coupon.isActive) {
    res.status(400).json({ valid: false, code: upperCode, discountAmount: 0, message: "Coupon is inactive" });
    return;
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400).json({ valid: false, code: upperCode, discountAmount: 0, message: "Coupon has expired" });
    return;
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ valid: false, code: upperCode, discountAmount: 0, message: "Coupon usage limit reached" });
    return;
  }

  if (orderAmount < Number(coupon.minOrderAmount)) {
    res.status(400).json({
      valid: false, code: upperCode, discountAmount: 0,
      message: `Minimum order amount ₹${coupon.minOrderAmount} required`
    });
    return;
  }

  // Coupon must be platform-wide (storeId null) or match the specific store
  if (coupon.storeId != null && storeId != null && coupon.storeId !== storeId) {
    res.status(400).json({ valid: false, code: upperCode, discountAmount: 0, message: "Coupon not valid for this store" });
    return;
  }

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = (orderAmount * Number(coupon.value)) / 100;
    if (coupon.maxDiscount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    discountAmount = Number(coupon.value);
  }
  discountAmount = Math.min(discountAmount, orderAmount);
  discountAmount = Math.round(discountAmount * 100) / 100;

  res.json({
    valid: true,
    code: upperCode,
    discountAmount,
    message: `₹${discountAmount} discount applied!`,
    coupon: formatCoupon(coupon),
  });
});

// ─── Store Owner Coupon Routes ─────────────────────────────────────────────────

router.get("/stores/:storeId/coupons", async (req, res): Promise<void> => {
  const storeId = parseInt(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "Invalid storeId" }); return; }

  const coupons = await db.select().from(couponsTable)
    .where(or(eq(couponsTable.storeId, storeId), isNull(couponsTable.storeId)));

  res.json(coupons.map(formatCoupon));
});

router.post("/stores/:storeId/coupons", async (req, res): Promise<void> => {
  const storeId = parseInt(req.params.storeId);
  if (isNaN(storeId)) { res.status(400).json({ error: "Invalid storeId" }); return; }

  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const d = parsed.data;
  const [coupon] = await db.insert(couponsTable).values({
    code: d.code,
    type: d.type,
    value: String(d.value),
    minOrderAmount: String(d.minOrderAmount ?? 0),
    maxDiscount: d.maxDiscount != null ? String(d.maxDiscount) : null,
    storeId,
    isActive: d.isActive ?? true,
    usageLimit: d.usageLimit ?? null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    description: d.description ?? null,
  }).returning();

  res.status(201).json(formatCoupon(coupon));
});

router.put("/stores/:storeId/coupons/:code", async (req, res): Promise<void> => {
  const storeId = parseInt(req.params.storeId);
  const code = req.params.code.toUpperCase();
  if (isNaN(storeId)) { res.status(400).json({ error: "Invalid storeId" }); return; }

  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const d = parsed.data;
  const updateData: Partial<typeof couponsTable.$inferInsert> = {};
  if (d.value != null) updateData.value = String(d.value);
  if (d.minOrderAmount != null) updateData.minOrderAmount = String(d.minOrderAmount);
  if ("maxDiscount" in d) updateData.maxDiscount = d.maxDiscount != null ? String(d.maxDiscount) : null;
  if (d.isActive != null) updateData.isActive = d.isActive;
  if ("usageLimit" in d) updateData.usageLimit = d.usageLimit ?? null;
  if ("expiresAt" in d) updateData.expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;
  if ("description" in d) updateData.description = d.description ?? null;

  const [coupon] = await db.update(couponsTable)
    .set(updateData)
    .where(and(eq(couponsTable.code, code), eq(couponsTable.storeId, storeId)))
    .returning();

  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json(formatCoupon(coupon));
});

router.delete("/stores/:storeId/coupons/:code", async (req, res): Promise<void> => {
  const storeId = parseInt(req.params.storeId);
  const code = req.params.code.toUpperCase();

  await db.delete(couponsTable)
    .where(and(eq(couponsTable.code, code), eq(couponsTable.storeId, storeId)));

  res.sendStatus(204);
});

// ─── Admin Coupon Routes ───────────────────────────────────────────────────────

router.get("/admin/coupons", async (_req, res): Promise<void> => {
  const coupons = await db.select().from(couponsTable);
  res.json(coupons.map(formatCoupon));
});

router.post("/admin/coupons", async (req, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const d = parsed.data;
  const [coupon] = await db.insert(couponsTable).values({
    code: d.code,
    type: d.type,
    value: String(d.value),
    minOrderAmount: String(d.minOrderAmount ?? 0),
    maxDiscount: d.maxDiscount != null ? String(d.maxDiscount) : null,
    storeId: null, // platform-wide
    isActive: d.isActive ?? true,
    usageLimit: d.usageLimit ?? null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    description: d.description ?? null,
  }).returning();

  res.status(201).json(formatCoupon(coupon));
});

router.put("/admin/coupons/:code", async (req, res): Promise<void> => {
  const code = req.params.code.toUpperCase();
  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const d = parsed.data;
  const updateData: Partial<typeof couponsTable.$inferInsert> = {};
  if (d.value != null) updateData.value = String(d.value);
  if (d.minOrderAmount != null) updateData.minOrderAmount = String(d.minOrderAmount);
  if ("maxDiscount" in d) updateData.maxDiscount = d.maxDiscount != null ? String(d.maxDiscount) : null;
  if (d.isActive != null) updateData.isActive = d.isActive;
  if ("usageLimit" in d) updateData.usageLimit = d.usageLimit ?? null;
  if ("expiresAt" in d) updateData.expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;
  if ("description" in d) updateData.description = d.description ?? null;

  const [coupon] = await db.update(couponsTable)
    .set(updateData)
    .where(eq(couponsTable.code, code))
    .returning();

  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json(formatCoupon(coupon));
});

router.delete("/admin/coupons/:code", async (req, res): Promise<void> => {
  const code = req.params.code.toUpperCase();
  await db.delete(couponsTable).where(eq(couponsTable.code, code));
  res.sendStatus(204);
});

export default router;
