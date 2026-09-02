// Managed redirects (F18): ["redirects", from] -> { to, code }, checked
// in routes/_middleware.ts before routing. The map is cached in memory
// for 60 seconds like menu/settings; writes refresh the cache.
// Source: ai/requirements.md F18, schema 6.1.

import { kv, KvKeys } from "./kv.ts";
import type { RedirectEntry } from "@/types/index.ts";

const CACHE_TTL_MS = 60_000;
let cached: { entries: Map<string, RedirectEntry>; at: number } | null = null;

/** All redirects as a from -> entry map, cached for 60 seconds. */
export async function getRedirects(): Promise<Map<string, RedirectEntry>> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.entries;
  const entries = new Map<string, RedirectEntry>();
  const iter = kv.list<RedirectEntry>({ prefix: ["redirects"] });
  for await (const entry of iter) {
    entries.set(String(entry.key[1]), entry.value);
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
  return { from, to, code: code as RedirectEntry["code"] };
}

/** Create or overwrite a redirect and refresh the cache. */
export async function saveRedirect(entry: RedirectEntry): Promise<void> {
  await kv.set(KvKeys.redirect(entry.from), entry);
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
