import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, customersTable, storeOwnersTable, storesTable } from "@workspace/db";
import {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  TOKEN_COOKIE,
  COOKIE_OPTIONS,
} from "../lib/auth";

const router: IRouter = Router();

// ─── Helper: format a customer row for the API response ──────────────────────
function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    role: "customer" as const,
    address: c.deliveryAddress,
    storeId: null,
  };
}

// ─── Helper: format a store-owner row for the API response ───────────────────
function formatStoreOwner(o: typeof storeOwnersTable.$inferSelect) {
  return {
    id: o.id,
    name: o.name,
    phone: o.phone,
    email: o.email,
    role: "store_owner" as const,
    address: null,
    storeId: o.storeId,
  };
}

// ─── POST /auth/signup ────────────────────────────────────────────────────────
router.post("/auth/signup", async (req: Request, res: Response): Promise<void> => {
  const { role, name, phone, email, password, address, storeName, storeAddress, storeCategory } =
    req.body as {
      role: string;
      name: string;
      phone: string;
      email?: string;
      password: string;
      address?: string;
      storeName?: string;
      storeAddress?: string;
      storeCategory?: string;
    };

  if (!role || !name || !phone || !password) {
    res.status(400).json({ error: "name, phone, password, and role are required" });
    return;
  }
  if (!["customer", "store_owner"].includes(role)) {
    res.status(400).json({ error: "role must be customer or store_owner" });
    return;
  }
  if (role === "store_owner" && (!storeName || !storeAddress)) {
    res.status(400).json({ error: "storeName and storeAddress are required for store owners" });
    return;
  }

  // Check uniqueness across both tables
  const [existingCustomer] = await db.select({ id: customersTable.id })
    .from(customersTable).where(eq(customersTable.phone, phone)).limit(1);
  const [existingOwner] = await db.select({ id: storeOwnersTable.id })
    .from(storeOwnersTable).where(eq(storeOwnersTable.phone, phone)).limit(1);

  if (existingCustomer || existingOwner) {
    res.status(409).json({ error: "An account with this phone number already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);

  if (role === "customer") {
    const [customer] = await db
      .insert(customersTable)
      .values({ name, phone, email: email ?? null, passwordHash, deliveryAddress: address ?? null })
      .returning();

    const token = signToken({ userId: customer.id, role: "customer", storeId: null });
    res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    res.status(201).json({
      user: formatCustomer(customer),
      message: "Account created successfully.",
    });
    return;
  }

  // role === "store_owner"
  const [owner] = await db
    .insert(storeOwnersTable)
    .values({ name, phone, email: email ?? null, passwordHash })
    .returning();

  const [store] = await db
    .insert(storesTable)
    .values({
      name: storeName!,
      ownerPhone: phone,
      ownerUserId: owner.id,
      address: storeAddress!,
      category: storeCategory ?? "Grocery",
      status: "pending",
    })
    .returning();

  await db.update(storeOwnersTable)
    .set({ storeId: store.id })
    .where(eq(storeOwnersTable.id, owner.id));

  const updatedOwner = { ...owner, storeId: store.id };
  const token = signToken({ userId: owner.id, role: "store_owner", storeId: store.id });
  res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
  res.status(201).json({
    user: formatStoreOwner(updatedOwner),
    message: "Store registered! Waiting for admin approval.",
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
// Looks up the phone in customers first, then store_owners, then users (admin).
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { phone, password } = req.body as { phone: string; password: string };

  if (!phone || !password) {
    res.status(400).json({ error: "phone and password are required" });
    return;
  }

  // 1. Try customers table
  const [customer] = await db.select().from(customersTable)
    .where(eq(customersTable.phone, phone)).limit(1);

  if (customer) {
    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid phone number or password" });
      return;
    }
    if (!customer.isActive) {
      res.status(403).json({ error: "Account is deactivated. Contact support." });
      return;
    }
    const token = signToken({ userId: customer.id, role: "customer", storeId: null });
    res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    res.json({ user: formatCustomer(customer) });
    return;
  }

  // 2. Try store_owners table
  const [owner] = await db.select().from(storeOwnersTable)
    .where(eq(storeOwnersTable.phone, phone)).limit(1);

  if (owner) {
    const valid = await verifyPassword(password, owner.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid phone number or password" });
      return;
    }
    if (!owner.isActive) {
      res.status(403).json({ error: "Account is deactivated. Contact support." });
      return;
    }
    const token = signToken({ userId: owner.id, role: "store_owner", storeId: owner.storeId });
    res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    res.json({ user: formatStoreOwner(owner) });
    return;
  }

  // 3. Fallback: admin in users table
  const [adminUser] = await db.select().from(usersTable)
    .where(eq(usersTable.phone, phone)).limit(1);

  if (adminUser && adminUser.role === "admin") {
    const valid = await verifyPassword(password, adminUser.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid phone number or password" });
      return;
    }
    if (!adminUser.isActive) {
      res.status(403).json({ error: "Account is deactivated." });
      return;
    }
    const token = signToken({ userId: adminUser.id, role: "admin", storeId: null });
    res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    res.json({
      user: {
        id: adminUser.id,
        name: adminUser.name,
        phone: adminUser.phone,
        email: adminUser.email,
        role: "admin",
        address: adminUser.address,
        storeId: null,
      },
    });
    return;
  }

  res.status(401).json({ error: "Invalid phone number or password" });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post("/auth/logout", (_req: Request, res: Response): void => {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.[TOKEN_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.clearCookie(TOKEN_COOKIE, { path: "/" });
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  // Route lookup to the correct table based on role in the JWT
  if (payload.role === "customer") {
    const [customer] = await db.select().from(customersTable)
      .where(eq(customersTable.id, payload.userId)).limit(1);
    if (!customer || !customer.isActive) {
      res.clearCookie(TOKEN_COOKIE, { path: "/" });
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user: formatCustomer(customer) });
    return;
  }

  if (payload.role === "store_owner") {
    const [owner] = await db.select().from(storeOwnersTable)
      .where(eq(storeOwnersTable.id, payload.userId)).limit(1);
    if (!owner || !owner.isActive) {
      res.clearCookie(TOKEN_COOKIE, { path: "/" });
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user: formatStoreOwner(owner) });
    return;
  }

  // admin — still in users table
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, payload.userId)).limit(1);
  if (!user || !user.isActive) {
    res.clearCookie(TOKEN_COOKIE, { path: "/" });
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      address: user.address,
      storeId: user.storeId,
    },
  });
});

export default router;
