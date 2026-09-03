// Page persistence: CRUD. Pages are always "published" once created.
// Source: ai/requirements.md F2 (section 7.1), schema 6.1.

import { addToList, kv, KvKeys, removeFromList } from "./kv.ts";
import { recordCache } from "./perf.ts";
import type { Page } from "@/types/index.ts";
import { slugify } from "@/utils/slugify.ts";
import { isValidSlug } from "@/utils/validate.ts";
import { nowIso } from "@/utils/date.ts";

/** Fields accepted from the page editor form. */
export interface PageInput {
  title: string;
  slug?: string;
  content?: string;
  template?: Page["template"];
  showInMenu?: boolean;
  menuOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export type PageResult =
  | { ok: true; page: Page }
  | { ok: false; error: string };

const PAGES_PREFIX = ["pages"];
const PAGE_SUMMARY_PREFIX = ["summaries", "page"] as const;
const SUMMARY_WRITE_CHUNK = 100;

/** Fields needed by pickers / menus (no Markdown body). */
export type PageSummary = Omit<Page, "content">;

const SUMMARY_CACHE_TTL_MS = 60_000;
let pageSummaryCache: { at: number; pages: PageSummary[] } | null = null;

/** Drop the page list cache after create / update / delete. */
export function invalidatePageSummaryCache(): void {
  pageSummaryCache = null;
}

export function toPageSummary(page: Page): PageSummary {
  const { content: _content, ...summary } = page;
  return summary;
}

export function queuePageSummary(
  op: Deno.AtomicOperation,
  page: Page,
): Deno.AtomicOperation {
  return op.set(KvKeys.pageSummary(page.id), toPageSummary(page));
}

async function listPageSummariesFromKv(): Promise<PageSummary[]> {
  const pages: PageSummary[] = [];
  const iter = kv.list<PageSummary>({ prefix: PAGE_SUMMARY_PREFIX });
  for await (const entry of iter) pages.push(entry.value);
  return pages;
}

async function rebuildPageSummaries(): Promise<PageSummary[]> {
  const existing = kv.list({ prefix: PAGE_SUMMARY_PREFIX });
  for await (const entry of existing) await kv.delete(entry.key);
  const pages = (await listPages()).map(toPageSummary);
  for (let i = 0; i < pages.length; i += SUMMARY_WRITE_CHUNK) {
    const chunk = pages.slice(i, i + SUMMARY_WRITE_CHUNK);
    const op = kv.atomic();
    for (const summary of chunk) {
      op.set(KvKeys.pageSummary(summary.id), summary);
    }
    await op.commit();
  }
  return pages;
}

async function loadPageSummaries(): Promise<PageSummary[]> {
  const [fromKv, ids] = await Promise.all([
    listPageSummariesFromKv(),
    kv.get<string[]>(KvKeys.pageIds()),
  ]);
  const expected = ids.value?.length ?? 0;
  if (expected > 0 && fromKv.length !== expected) {
    return await rebuildPageSummaries();
  }
  if (expected === 0 && fromKv.length > 0) {
    return await rebuildPageSummaries();
  }
  return fromKv;
}

/** All pages, ordered by slug. */
export async function listPages(): Promise<Page[]> {
  const pages: Page[] = [];
  const iter = kv.list<Page>({ prefix: PAGES_PREFIX });
  for await (const entry of iter) pages.push(entry.value);
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** All pages without Markdown bodies (summary keys only). */
export async function listPageSummaries(): Promise<PageSummary[]> {
  if (
    pageSummaryCache &&
    Date.now() - pageSummaryCache.at < SUMMARY_CACHE_TTL_MS
  ) {
    recordCache("page-summaries", true);
    return pageSummaryCache.pages;
  }
  recordCache("page-summaries", false);
  const pages = (await loadPageSummaries()).sort((a, b) =>
    a.slug.localeCompare(b.slug)
  );
  pageSummaryCache = { pages, at: Date.now() };
  return pages;
}

export async function getPageSummary(id: string): Promise<PageSummary | null> {
  return (await kv.get<PageSummary>(KvKeys.pageSummary(id))).value;
}

/** id/slug/title only — for admin selects. */
export type PagePickerItem = Pick<Page, "id" | "slug" | "title">;

export async function listPagePickers(): Promise<PagePickerItem[]> {
  return (await listPageSummaries()).map(({ id, slug, title }) => ({
    id,
    slug,
    title,
  }));
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return (await kv.get<Page>(KvKeys.page(slug))).value;
}

export async function getPageById(id: string): Promise<Page | null> {
  const iter = kv.list<Page>({ prefix: PAGES_PREFIX });
  for await (const entry of iter) {
    if (entry.value.id === id) return entry.value;
  }
  return null;
}

/** True when another page already uses the slug. */
export async function isPageSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const page = await getPageBySlug(slug);
  return page !== null && page.id !== excludeId;
}

/** Slug guaranteed to be free: base, base-2, base-3, ... */
async function uniquePageSlug(base: string): Promise<string> {
  const stem = base || "page";
  for (let i = 0;; i++) {
    const candidate = i === 0 ? stem : `${stem}-${i + 1}`;
    if (!(await isPageSlugTaken(candidate))) return candidate;
  }
}

/** Create a page; the slug is auto-generated and made unique. */
export async function createPage(input: PageInput): Promise<PageResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const now = nowIso();
  const page: Page = {
    id: crypto.randomUUID(),
    slug: await uniquePageSlug(input.slug?.trim() || slugify(title)),
    title,
    content: input.content ?? "",
    template: input.template ?? "default",
    showInMenu: input.showInMenu ?? false,
    menuOrder: input.menuOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  await queuePageSummary(kv.atomic().set(KvKeys.page(page.slug), page), page)
    .commit();
  await addToList(KvKeys.pageIds(), page.id);
  invalidatePageSummaryCache();
  return { ok: true, page };
}

/** Update page fields. Slug uniqueness is enforced here (before write). */
export async function updatePage(
  id: string,
  input: PageInput,
): Promise<PageResult> {
  const page = await getPageById(id);
  if (!page) return { ok: false, error: "Page not found." };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  const slug = input.slug?.trim() || page.slug;
  if (!isValidSlug(slug)) return { ok: false, error: "Invalid slug." };
  if (await isPageSlugTaken(slug, id)) {
    return { ok: false, error: "Slug is already in use." };
  }
  const updated: Page = {
    ...page,
    title: input.title.trim(),
    slug,
    content: input.content !== undefined ? input.content : page.content,
    template: input.template ?? page.template,
    showInMenu: input.showInMenu ?? page.showInMenu,
    menuOrder: input.menuOrder ?? page.menuOrder,
    metaTitle: input.metaTitle?.trim() || undefined,
    metaDescription: input.metaDescription?.trim() || undefined,
    updatedAt: nowIso(),
  };
  const op = queuePageSummary(
    kv.atomic().set(KvKeys.page(slug), updated),
    updated,
  );
  if (slug !== page.slug) op.delete(KvKeys.page(page.slug));
  await op.commit();
  invalidatePageSummaryCache();
  return { ok: true, page: updated };
}

export async function deletePage(id: string): Promise<boolean> {
  const page = await getPageById(id);
  if (!page) return false;
  await kv.atomic()
    .delete(KvKeys.page(page.slug))
    .delete(KvKeys.pageSummary(id))
    .commit();
  await removeFromList(KvKeys.pageIds(), id);
  invalidatePageSummaryCache();
  return true;
}
