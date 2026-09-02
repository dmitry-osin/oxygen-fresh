// View counters and daily aggregation (F13).
// Source: ai/requirements.md 147-149 (schema), F13 (section 7.1).
// Daily keys use the UTC date (YYYY-MM-DD); entity counters are plain
// numbers incremented atomically via lib/kv.ts.

import { incrementCounter, kv, KvKeys } from "./kv.ts";

export type ViewKind = "post" | "page";

export interface DailyViews {
  postViews: number;
  pageViews: number;
}

function viewsKey(kind: ViewKind, id: string) {
  return kind === "post" ? KvKeys.postViews(id) : KvKeys.pageViews(id);
}

/** Atomic increment of the daily { postViews, pageViews } object. */
async function incrementDaily(date: string, kind: ViewKind): Promise<void> {
  const key = KvKeys.analyticsDaily(date);
  for (;;) {
    const entry = await kv.get<DailyViews>(key);
    const current = entry.value ?? { postViews: 0, pageViews: 0 };
    const next = kind === "post"
      ? { ...current, postViews: current.postViews + 1 }
      : { ...current, pageViews: current.pageViews + 1 };
    const res = await kv.atomic().check(entry).set(key, next).commit();
    if (res.ok) return;
  }
}

/** Count one view of a post or page. Called from public routes. */
export async function trackView(kind: ViewKind, id: string): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  await Promise.all([
    incrementCounter(viewsKey(kind, id)),
    incrementDaily(date, kind),
  ]);
}

export interface ViewCount {
  id: string;
  views: number;
}

/** All per-entity counters for a kind, highest first. */
export async function listViews(kind: ViewKind): Promise<ViewCount[]> {
  const counts: ViewCount[] = [];
  const iter = kv.list<number>({ prefix: ["views", kind] });
  for await (const entry of iter) {
    counts.push({ id: String(entry.key[2]), views: entry.value });
  }
  return counts.sort((a, b) => b.views - a.views);
}

export interface DailyPoint extends DailyViews {
  date: string;
}

/** Daily aggregates for the last `days` days, zero-filled for missing days. */
export async function dailyViews(days: number): Promise<DailyPoint[]> {
  const byDate = new Map<string, DailyViews>();
  const iter = kv.list<DailyViews>({ prefix: ["analytics", "daily"] });
  for await (const entry of iter) {
    byDate.set(String(entry.key[2]), entry.value);
  }
  const points: DailyPoint[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    points.push({
      date,
      ...byDate.get(date) ?? { postViews: 0, pageViews: 0 },
    });
  }
  return points;
}
