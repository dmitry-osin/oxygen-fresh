// Site menu reads with a 60s in-memory cache (F6: public site reads the
// menu on every render, cached). The menu builder (writes) lands in stage 9.
// Source: ai/requirements.md F6 (section 7.1), schema 6.1.

import { kv, KvKeys } from "./kv.ts";
import { listPages } from "./pages.ts";
import type { MenuItem } from "@/types/index.ts";

const CACHE_TTL_MS = 60_000;
let cached: { items: MenuItem[]; at: number } | null = null;

/** Raw menu items from KV, cached in memory for 60 seconds. */
export async function getMenuItems(): Promise<MenuItem[]> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.items;
  const items = (await kv.get<MenuItem[]>(KvKeys.menuItems())).value ?? [];
  cached = { items, at: Date.now() };
  return items;
}

export interface NavLink {
  label: string;
  href: string;
}

function toNavLink(item: MenuItem): NavLink {
  const href = item.type === "external"
    ? item.target
    : item.type === "page"
    ? `/page/${item.target}`
    : `/${item.target}`;
  return { label: item.label, href };
}

/**
 * Navigation links for the public header. Falls back to pages with
 * showInMenu=true (ordered by menuOrder) while the menu builder is empty.
 */
export async function getNavLinks(): Promise<NavLink[]> {
  const items = await getMenuItems();
  if (items.length > 0) {
    return items.sort((a, b) => a.order - b.order).map(toNavLink);
  }
  const pages = await listPages();
  return pages
    .filter((p) => p.showInMenu)
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .map((p) => ({ label: p.title, href: `/page/${p.slug}` }));
}
