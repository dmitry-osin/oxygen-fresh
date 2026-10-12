// Signed opaque session tokens. Session data and expiry remain in KV.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SIGNED_TOKEN = /^[0-9a-f]{64}\.[0-9a-f]{64}$/;
const encoder = new TextEncoder();

function signature(token: string): string {
  const secret = Deno.env.get("SESSION_SECRET");
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret).update(`session:${token}`).digest("hex");
}

/** Read a token only after verifying its cookie signature. */
export function readSessionToken(headers: Headers): string | undefined {
  const header = headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1 || part.slice(0, eq).trim() !== SESSION_COOKIE) continue;
    let value: string;
    try {
      value = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return undefined;
    }
    if (!SIGNED_TOKEN.test(value)) return undefined;
    const [token, supplied] = value.split(".");
    const expected = signature(token);
    return timingSafeEqual(encoder.encode(supplied), encoder.encode(expected))
      ? token
      : undefined;
  }
  return undefined;
}

/** Attach an HMAC-signed, httpOnly session cookie. */
export function setSessionCookie(headers: Headers, token: string): void {
  const value = `${token}.${signature(token)}`;
  const secure = (Deno.env.get("SITE_URL") ?? "").startsWith("https://")
    ? "; Secure"
    : "";
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${
      SESSION_TTL_MS / 1000
    }${secure}`,
  );
}

/** Expire the cookie without requiring a signing secret. */
export function clearSessionCookie(headers: Headers): void {
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
}
