// Authentication: password hashing (bcrypt) and KV-backed sessions.
// Source: ai/requirements.md F9 (section 7.1), schema 6.1 users/sessions.

import bcrypt from "bcryptjs";
import { kv, KvKeys } from "./kv.ts";
import type { Session, User } from "@/types/index.ts";
import { nowIso } from "@/utils/date.ts";
import { SESSION_TTL_MS } from "./session-cookie.ts";

export {
  clearSessionCookie,
  readSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  setSessionCookie,
} from "./session-cookie.ts";

export const ADMIN_USERNAME = "admin";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function getUser(username: string): Promise<User | null> {
  return (await kv.get<User>(KvKeys.user(username))).value;
}

/**
 * Create the admin user from env on first use (first setup).
 * Optional profile fields (ADMIN_FIRST_NAME, …) apply only on create.
 * Returns null when ADMIN_PASSWORD_HASH is missing.
 */
export async function ensureAdminUser(): Promise<User | null> {
  const existing = await getUser(ADMIN_USERNAME);
  if (existing) return existing;
  const passwordHash = Deno.env.get("ADMIN_PASSWORD_HASH");
  if (!passwordHash) return null;
  const trim = (name: string) => Deno.env.get(name)?.trim() || undefined;
  const user: User = {
    username: ADMIN_USERNAME,
    passwordHash,
    role: "admin",
    createdAt: nowIso(),
    firstName: trim("ADMIN_FIRST_NAME"),
    lastName: trim("ADMIN_LAST_NAME"),
    bio: trim("ADMIN_BIO"),
    email: trim("ADMIN_EMAIL"),
    location: trim("ADMIN_LOCATION"),
    website: trim("ADMIN_WEBSITE"),
  };
  await kv.set(KvKeys.user(ADMIN_USERNAME), user);
  return user;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Create a session in KV with automatic expiry. */
export async function createSession(username: string): Promise<Session> {
  const session: Session = {
    token: generateToken(),
    username,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  await kv.set(KvKeys.session(session.token), session, {
    expireIn: SESSION_TTL_MS,
  });
  return session;
}

/** Resolve a session token to a user; null when missing or expired. */
export async function getSessionUser(token: string): Promise<User | null> {
  const session = (await kv.get<Session>(KvKeys.session(token))).value;
  if (!session) return null;
  if (session.expiresAt <= nowIso()) return null;
  return await getUser(session.username);
}

export async function deleteSession(token: string): Promise<void> {
  await kv.delete(KvKeys.session(token));
}
