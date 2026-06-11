import type { Request, Response, NextFunction } from "express";
import { verifyToken, TOKEN_COOKIE, type TokenPayload } from "../lib/auth";

// ─── Extend Express Request to carry authenticated user ───────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ─── Internal helper: parse JWT cookie silently ───────────────────────────────
function parseToken(req: Request): TokenPayload | null {
  const token = req.cookies?.[TOKEN_COOKIE] as string | undefined;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

// ─── Middleware: attach user if present (non-blocking) ────────────────────────
// Use on public routes that optionally benefit from knowing the user.
export function extractUser(req: Request, _res: Response, next: NextFunction): void {
  req.user = parseToken(req) ?? undefined;
  next();
}

// ─── Middleware: require valid JWT ────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = parseToken(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required. Please login." });
    return;
  }
  req.user = user;
  next();
}

// ─── Middleware: require admin role ───────────────────────────────────────────
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = parseToken(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }
  req.user = user;
  next();
}

// ─── Middleware: require store_owner or admin ─────────────────────────────────
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const user = parseToken(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (user.role !== "store_owner" && user.role !== "admin") {
    res.status(403).json({ error: "Store owner access required." });
    return;
  }
  req.user = user;
  next();
}

// ─── Middleware factory: require ownership of a specific store ─────────────────
// Admin users bypass ownership check and can manage any store.
// Store owners must have storeId in their JWT matching the route param.
export function requireStoreOwnership(storeIdParam = "storeId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = parseToken(req);
    if (!user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (user.role === "admin") {
      req.user = user;
      next();
      return;
    }

    if (user.role !== "store_owner") {
      res.status(403).json({ error: "Store owner access required." });
      return;
    }

    const storeId = parseInt(req.params[storeIdParam] as string ?? "", 10);
    if (isNaN(storeId)) {
      res.status(400).json({ error: "Invalid store ID." });
      return;
    }

    if (user.storeId !== storeId) {
      res.status(403).json({ error: "You can only manage your own store." });
      return;
    }

    req.user = user;
    next();
  };
}
