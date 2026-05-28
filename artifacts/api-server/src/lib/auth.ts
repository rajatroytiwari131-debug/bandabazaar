import crypto from "crypto";

const SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-in-production";
const TOKEN_EXPIRY_SECONDS = 86400 * 30; // 30 days

export interface TokenPayload {
  userId: number;
  role: string;
  storeId?: number | null;
  iat: number;
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  if (sig !== expected) throw new Error("Invalid token signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, hash) => {
      if (err) return reject(err);
      resolve(`${salt}:${hash.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return resolve(false);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString("hex") === hash);
    });
  });
}

export const TOKEN_COOKIE = "bb_token";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  maxAge: TOKEN_EXPIRY_SECONDS * 1000,
  path: "/",
};
