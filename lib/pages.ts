// Page persistence: CRUD. Pages are always "published" once created.
// Source: ai/requirements.md F2 (section 7.1), schema 6.1.

import { addToList, kv, KvKeys, removeFromList } from "./kv.ts";
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

/** All pages, ordered by slug. */
export async function listPages(): Promise<Page[]> {
  const pages: Page[] = [];
  const iter = kv.list<Page>({ prefix: PAGES_PREFIX });
  for await (const entry of iter) pages.push(entry.value);
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Fields needed by pickers / menus (no Markdown body). */
export type PageSummary = Omit<Page, "content">;

function toPageSummary(page: Page): PageSummary {
  const { content: _content, ...summary } = page;
  return summary;
}

/** All pages without Markdown bodies. */
export async function listPageSummaries(): Promise<PageSummary[]> {
  return (await listPages()).map(toPageSummary);
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
  await kv.set(KvKeys.page(page.slug), page);
  await addToList(KvKeys.pageIds(), page.id);
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
    content: input.content ?? page.content,
    template: input.template ?? page.template,
    showInMenu: input.showInMenu ?? page.showInMenu,
    menuOrder: input.menuOrder ?? page.menuOrder,
    metaTitle: input.metaTitle?.trim() || undefined,
    metaDescription: input.metaDescription?.trim() || undefined,
    updatedAt: nowIso(),
  };
  const op = kv.atomic().set(KvKeys.page(slug), updated);
  if (slug !== page.slug) op.delete(KvKeys.page(page.slug));
  await op.commit();
  return { ok: true, page: updated };
}

export async function deletePage(id: string): Promise<boolean> {
  const page = await getPageById(id);
  if (!page) return false;
  await kv.delete(KvKeys.page(page.slug));
  await removeFromList(KvKeys.pageIds(), id);
  return true;
}
