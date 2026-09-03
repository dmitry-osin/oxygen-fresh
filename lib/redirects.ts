// Managed redirects (F18): ["redirects", from] -> { to, code }, checked
// in routes/_middleware.ts before routing. The map is cached in memory
// for 60 seconds like menu/settings; writes refresh the cache.
// Short links for posts reuse the same store as /s/{code} → /{slug} (302).
// Source: ai/requirements.md F18, schema 6.1.

import { kv, KvKeys } from "./kv.ts";
import type { RedirectEntry } from "@/types/index.ts";

const CACHE_TTL_MS = 60_000;
let cached: { entries: Map<string, RedirectEntry>; at: number } | null = null;

/** Public short-link path prefix (must not collide with post slugs). */
export const SHORT_LINK_PREFIX = "/s/";

const CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 7;

/** All redirects as a from -> entry map, cached for 60 seconds. */
export async function getRedirects(): Promise<Map<string, RedirectEntry>> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.entries;
  const entries = new Map<string, RedirectEntry>();
  const iter = kv.list<RedirectEntry>({ prefix: ["redirects"] });
  for await (const entry of iter) {
    entries.set(String(entry.key[1]), {
      ...entry.value,
      from: entry.value.from || String(entry.key[1]),
    });
  }
  cached = { entries, at: Date.now() };
  return entries;
}

/** Redirect for a request path, or null. */
export async function findRedirect(
  path: string,
): Promise<RedirectEntry | null> {
  return (await getRedirects()).get(path) ?? null;
}

/** Validation shared by the admin form and the importer. */
export function validateRedirect(
  from: string,
  to: string,
  code: number,
): RedirectEntry | null {
  const ok = from.startsWith("/") && !from.endsWith("/") &&
    (to.startsWith("/") || /^https?:\/\//.test(to)) &&
    to !== from && (code === 301 || code === 302);
  if (!ok) return null;
  return { from, to, code: code as RedirectEntry["code"], source: "manual" };
}

/** Create or overwrite a redirect and refresh the cache. */
export async function saveRedirect(entry: RedirectEntry): Promise<void> {
  const { from, ...rest } = entry;
  await kv.set(KvKeys.redirect(from), { ...rest, from });
  cached = null;
}

/** Remove a redirect by source path; unknown paths are ignored. */
export async function deleteRedirect(from: string): Promise<void> {
  await kv.delete(KvKeys.redirect(from));
  cached = null;
}

/** Drop the cache (used by the importer after a bulk replace). */
export function invalidateRedirectCache(): void {
  cached = null;
}

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let out = "";
  for (const byte of bytes) {
    out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return out;
}

/** Existing short link for a post, if any. */
export async function findShortLinkForPost(
  postId: string,
): Promise<RedirectEntry | null> {
  for (const entry of (await getRedirects()).values()) {
    if (entry.source === "short" && entry.postId === postId) return entry;
  }
  return null;
}

/**
 * Create a /s/{code} → /{slug} short link for a published post.
 * Returns the existing link if one is already bound to this post.
 */
export async function createPostShortLink(
  postId: string,
  slug: string,
): Promise<RedirectEntry> {
  const existing = await findShortLinkForPost(postId);
  if (existing) {
    const target = `/${slug}`;
    if (existing.to !== target) {
      const updated = { ...existing, to: target };
      await saveRedirect(updated);
      return updated;
    }
    return existing;
  }

  const redirects = await getRedirects();
  for (let attempt = 0; attempt < 20; attempt++) {
    const from = `${SHORT_LINK_PREFIX}${randomCode()}`;
    if (redirects.has(from)) continue;
    const entry: RedirectEntry = {
      from,
      to: `/${slug}`,
      code: 302,
      source: "short",
      postId,
    };
    await saveRedirect(entry);
    return entry;
  }
  throw new Error("Could not allocate a short link code.");
}

/** Keep short-link targets in sync when a published post slug changes. */
export async function syncPostShortLink(
  postId: string,
  slug: string,
): Promise<void> {
  const existing = await findShortLinkForPost(postId);
  if (!existing) return;
  const target = `/${slug}`;
  if (existing.to === target) return;
  await saveRedirect({ ...existing, to: target });
}

/** Remove the short link bound to a post (unpublish / delete). */
export async function deletePostShortLink(postId: string): Promise<void> {
  const existing = await findShortLinkForPost(postId);
  if (existing) await deleteRedirect(existing.from);
}
