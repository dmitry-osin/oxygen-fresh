// Page persistence: CRUD.
// Stage 3 note: only the read helper needed by the sitemap lives here for
// now; full CRUD lands in stage 5 (see ai/tasks.md).

import { kv } from "./kv.ts";
import type { Page } from "@/types/index.ts";

/** All pages, ordered by slug. */
export async function listPages(): Promise<Page[]> {
  const pages: Page[] = [];
  const iter = kv.list<Page>({ prefix: ["pages"] });
  for await (const entry of iter) pages.push(entry.value);
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}
