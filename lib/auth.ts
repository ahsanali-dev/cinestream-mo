import crypto from "crypto";
import { getDb, inMemoryStore } from "./mongodb";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  authProvider?: "credentials" | "google";
  token?: string;
  createdAt?: string;
}

const AUTH_SECRET = process.env.AUTH_SECRET || "cinestream_secure_jwt_secret_key_2026_xyz";

/**
 * Hash password securely with PBKDF2 (Native Node.js Crypto)
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return { hash, salt };
}

/**
 * Verify password against stored hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

/**
 * Generate a signed session token
 */
export function generateToken(userId: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email: email.toLowerCase().trim(),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30 * 86400 * 1000, // 30 days
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify session token
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(payloadB64)
      .digest("base64url");

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (Date.now() > payload.expiresAt) return null;

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Get user by verified token from MongoDB or fallback in-memory store
 */
export async function getUserFromToken(token: string): Promise<UserSession | null> {
  const verified = verifyToken(token);
  if (!verified) return null;

  try {
    const db = await getDb();
    if (db) {
      const userDoc = await db.collection("users").findOne({ email: verified.email });
      if (userDoc) {
        return {
          id: String(userDoc._id),
          name: userDoc.name || verified.email.split("@")[0],
          email: userDoc.email,
          avatar: userDoc.avatar || "",
          authProvider: userDoc.authProvider || "credentials",
          createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : new Date().toISOString(),
          token,
        };
      }
    }
  } catch (err) {
    console.error("getUserFromToken Mongo error:", err);
  }

  // Fallback to in-memory store
  if (inMemoryStore?.users?.has(verified.email)) {
    const u = inMemoryStore.users.get(verified.email);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar || "",
      authProvider: u.authProvider || "credentials",
      createdAt: u.createdAt || new Date().toISOString(),
      token,
    };
  }

  return {
    id: verified.userId,
    name: verified.email.split("@")[0],
    email: verified.email,
    token,
  };
}
