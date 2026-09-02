// Site menu: reads with a 60s in-memory cache (F6: public site reads the
// menu on every render, cached) and writes from the menu builder.
// Source: ai/requirements.md F6 (section 7.1), schema 6.1.

import { kv, KvKeys } from "./kv.ts";
import { listPages } from "./pages.ts";
import { recordCache } from "./perf.ts";
import type { MenuItem } from "@/types/index.ts";

const CACHE_TTL_MS = 60_000;
let cached: { items: MenuItem[]; at: number } | null = null;

/** Raw menu items from KV, cached in memory for 60 seconds. */
export async function getMenuItems(): Promise<MenuItem[]> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    recordCache("menu", true);
    return cached.items;
  }
  const items = (await kv.get<MenuItem[]>(KvKeys.menuItems())).value ?? [];
  cached = { items, at: Date.now() };
  recordCache("menu", false);
  return items;
}

/** Fields for a new menu item; id and order are assigned here. */
export interface MenuItemInput {
  type: MenuItem["type"];
  label: string;
  target: string;
}

/** Persist the full item list (normalized by order) and refresh the cache. */
export async function saveMenuItems(items: MenuItem[]): Promise<void> {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  await kv.set(KvKeys.menuItems(), sorted);
  cached = { items: sorted, at: Date.now() };
}

/** Append an item at the end of the menu. */
export async function addMenuItem(
  input: MenuItemInput,
): Promise<void> {
  const items = await getMenuItems();
  const order = items.reduce((max, item) => Math.max(max, item.order), -1) + 1;
  const item: MenuItem = { id: crypto.randomUUID(), order, ...input };
  await saveMenuItems([...items, item]);
}

/** Remove an item by id; unknown ids are ignored. */
export async function deleteMenuItem(id: string): Promise<void> {
  const items = await getMenuItems();
  await saveMenuItems(items.filter((item) => item.id !== id));
}

/**
 * Re-assign order values from an array of item ids (as dragged in the
 * menu builder). Items missing from the list keep their relative order
 * at the end as a defensive fallback.
 */
export async function reorderMenuItems(orderedIds: string[]): Promise<void> {
  const items = await getMenuItems();
  const moved = orderedIds
    .map((id, index) => {
      const item = items.find((candidate) => candidate.id === id);
      return item ? { ...item, order: index } : null;
    })
    .filter((item): item is MenuItem => item !== null);
  const rest = items
    .filter((item) => !orderedIds.includes(item.id))
    .map((item, index) => ({ ...item, order: orderedIds.length + index }));
  await saveMenuItems([...moved, ...rest]);
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
    return [...items].sort((a, b) => a.order - b.order).map(toNavLink);
  }
  const pages = await listPages();
  return pages
    .filter((p) => p.showInMenu)
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .map((p) => ({ label: p.title, href: `/page/${p.slug}` }));
}
