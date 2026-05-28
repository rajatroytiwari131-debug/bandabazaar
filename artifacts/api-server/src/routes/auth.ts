import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, storesTable } from "@workspace/db";
import {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  TOKEN_COOKIE,
  COOKIE_OPTIONS,
} from "../lib/auth";

const router: IRouter = Router();

// ─── POST /auth/signup ────────────────────────────────────────────────────────
// Creates a new customer or store_owner account.
// For store_owner: also creates the store record with status=pending.
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

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this phone number already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({ name, phone, email: email ?? null, passwordHash, role, address: address ?? null })
    .returning();

  let storeId: number | null = null;

  if (role === "store_owner") {
    const [store] = await db
      .insert(storesTable)
      .values({
        name: storeName!,
        ownerPhone: phone,
        ownerUserId: user.id,
        address: storeAddress!,
        category: storeCategory ?? "Grocery",
        status: "pending",
      })
      .returning();
    storeId = store.id;
    await db
      .update(usersTable)
      .set({ storeId })
      .where(eq(usersTable.id, user.id));
  }

  const token = signToken({ userId: user.id, role: user.role, storeId });
  res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
  res.status(201).json({
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, storeId },
    message: role === "store_owner"
      ? "Store registered! Waiting for admin approval."
      : "Account created successfully.",
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { phone, password } = req.body as { phone: string; password: string };

  if (!phone || !password) {
    res.status(400).json({ error: "phone and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, phone))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid phone number or password" });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid phone number or password" });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: "Account is deactivated. Contact support." });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, storeId: user.storeId });
  res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
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

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);

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
