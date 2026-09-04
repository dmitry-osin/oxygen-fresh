// Import: validate an export file and replace all content data (F14).
// Source: ai/requirements.md 360 (upload, validate schema, replace all).
// The file is validated completely BEFORE any write, so a malformed
// import never leaves half-applied data. Writes then replace each KV
// namespace (posts + indexes, pages + indexes, tags + indexes, menu,
// settings, redirects); view counters and version snapshots are kept.

import { kv, KvKeys } from "./kv.ts";
import { saveMenuItems } from "./menu.ts";
import { invalidatePageSummaryCache, toPageSummary } from "./pages.ts";
import { invalidatePostSummaryCache, toPostSummary } from "./posts.ts";
import { DEFAULT_SETTINGS, saveSettings } from "./settings.ts";
import { normalizeSidebarBlocks } from "./sidebar.ts";
import { indexPost } from "./search.ts";
import { invalidateRedirectCache, validateRedirect } from "./redirects.ts";
import { EXPORT_VERSION, type ExportData } from "./export.ts";
import type {
  MenuItem,
  Page,
  Post,
  RedirectEntry,
  Settings,
  Tag,
} from "@/types/index.ts";

export type ImportResult =
  | { ok: true; data: ExportData }
  | { ok: false; error: string };

const POST_STATUSES = new Set(["draft", "published", "scheduled"]);
const POST_TEMPLATES = new Set(["default", "full-width"]);
const PAGE_TEMPLATES = new Set(["default", "full-width", "blank"]);
const ITEM_TYPES = new Set(["page", "post", "external"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(record: Record<string, unknown>, fields: string[]) {
  return fields.every((field) => typeof record[field] === "string");
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "string");
}

function validatePost(item: unknown): Post | null {
  if (!isRecord(item)) return null;
  const ok = hasStrings(item, [
    "id",
    "slug",
    "title",
    "content",
    "createdAt",
    "updatedAt",
    "authorId",
  ]) &&
    POST_STATUSES.has(String(item.status)) &&
    (item.template === undefined || POST_TEMPLATES.has(String(item.template))) &&
    isStringArray(item.tags) &&
    (item.publishedAt === null ||
      item.publishedAt === undefined ||
      typeof item.publishedAt === "string");
  return ok ? item as unknown as Post : null;
}

function validatePage(item: unknown): Page | null {
  if (!isRecord(item)) return null;
  const ok = hasStrings(item, [
    "id",
    "slug",
    "title",
    "content",
    "createdAt",
    "updatedAt",
  ]) &&
    (item.template === undefined || PAGE_TEMPLATES.has(String(item.template))) &&
    typeof item.showInMenu === "boolean" &&
    typeof item.menuOrder === "number";
  return ok ? item as unknown as Page : null;
}

function validateTag(item: unknown): Tag | null {
  if (!isRecord(item)) return null;
  return hasStrings(item, ["slug", "name", "createdAt"])
    ? item as unknown as Tag
    : null;
}

function validateMenuItem(item: unknown): MenuItem | null {
  if (!isRecord(item)) return null;
  const ok = hasStrings(item, ["id", "label", "target"]) &&
    ITEM_TYPES.has(String(item.type)) &&
    typeof item.order === "number";
  return ok ? item as unknown as MenuItem : null;
}

function validateSettings(item: unknown): Settings | null {
  if (!isRecord(item)) return null;
  const theme = item.theme;
  const ok = typeof item.siteName === "string" &&
    (theme === undefined ||
      ["light", "dark", "system"].includes(String(theme))) &&
    (item.postsPerPage === undefined ||
      typeof item.postsPerPage === "number") &&
    (item.socialLinks === undefined || Array.isArray(item.socialLinks));
  return ok
    ? {
      ...DEFAULT_SETTINGS,
      ...(item as unknown as Settings),
      sidebarHome: normalizeSidebarBlocks(
        (item as {
          sidebarHome?: Settings["sidebarHome"];
          sidebarBlocks?: Settings["sidebarHome"];
        }).sidebarHome ??
          (item as { sidebarBlocks?: Settings["sidebarHome"] }).sidebarBlocks,
        DEFAULT_SETTINGS.sidebarHome,
      ),
      sidebarPost: normalizeSidebarBlocks(
        (item as {
          sidebarPost?: Settings["sidebarPost"];
          sidebarBlocks?: Settings["sidebarPost"];
        }).sidebarPost ??
          (item as { sidebarBlocks?: Settings["sidebarPost"] }).sidebarBlocks,
        DEFAULT_SETTINGS.sidebarPost,
      ),
      sidebarPage: normalizeSidebarBlocks(
        (item as {
          sidebarPage?: Settings["sidebarPage"];
          sidebarBlocks?: Settings["sidebarPage"];
        }).sidebarPage ??
          (item as { sidebarBlocks?: Settings["sidebarPage"] }).sidebarBlocks,
        DEFAULT_SETTINGS.sidebarPage,
      ),
    }
    : null;
}

/** Validate a list field, mapping every item through `validate`. */
function validateList<T>(
  value: unknown,
  validate: (item: unknown) => T | null,
  name: string,
): T[] | string {
  if (!Array.isArray(value)) return `${name} must be an array.`;
  const mapped = value.map(validate);
  return mapped.some((item) => item === null)
    ? `${name} contains an invalid item.`
    : mapped as T[];
}

/** Full-schema validation; no writes happen unless this returns ok. */
export function validateImport(raw: unknown): ImportResult {
  if (!isRecord(raw)) return { ok: false, error: "Not a JSON object." };
  if (raw.version !== EXPORT_VERSION) {
    return {
      ok: false,
      error: `Unsupported version, expected ${EXPORT_VERSION}.`,
    };
  }
  if (!isRecord(raw.data)) {
    return { ok: false, error: "Missing data object." };
  }
  const posts = validateList(raw.data.posts, validatePost, "posts");
  if (typeof posts === "string") return { ok: false, error: posts };
  const pages = validateList(raw.data.pages, validatePage, "pages");
  if (typeof pages === "string") return { ok: false, error: pages };
  const tags = validateList(raw.data.tags, validateTag, "tags");
  if (typeof tags === "string") return { ok: false, error: tags };
  const menu = validateList(raw.data.menu, validateMenuItem, "menu");
  if (typeof menu === "string") return { ok: false, error: menu };
  const redirects = validateList(
    raw.data.redirects,
    (item) => {
      if (!isRecord(item) || !hasStrings(item, ["from", "to"])) return null;
      const base = validateRedirect(
        String(item.from),
        String(item.to),
        Number(item.code),
      );
      if (!base) return null;
      const entry: RedirectEntry = { ...base };
      if (item.source === "short") {
        entry.source = "short";
        if (typeof item.postId === "string" && item.postId) {
          entry.postId = item.postId;
        }
      }
      return entry;
    },
    "redirects",
  );
  if (typeof redirects === "string") return { ok: false, error: redirects };
  const settings = validateSettings(raw.data.settings);
  if (!settings) return { ok: false, error: "Invalid settings object." };
  return {
    ok: true,
    data: { posts, pages, tags, settings, menu, redirects },
  };
}

async function wipePrefix(prefix: Deno.KvKey): Promise<void> {
  const iter = kv.list({ prefix });
  for await (const entry of iter) await kv.delete(entry.key);
}

/** Where a post lives, mirroring lib/post-mutations.ts postKey(). */
function postKey(post: Post) {
  return post.status === "published"
    ? KvKeys.publishedPost(post.slug)
    : KvKeys.draftPost(post.id);
}

async function applyPosts(posts: Post[]): Promise<void> {
  await wipePrefix(["posts"]);
  await wipePrefix(["posts_by_tag"]);
  await wipePrefix(["search_index"]);
  await wipePrefix(["search_words"]);
  await wipePrefix(["summaries", "post"]);
  const op = kv.atomic();
  for (const post of posts) {
    op.set(postKey(post), post);
    op.set(KvKeys.postSummary(post.id), toPostSummary(post));
    for (const tag of post.tags) {
      op.set(KvKeys.postsByTag(tag, post.id), post.id);
    }
  }
  await op.commit();
  await kv.set(KvKeys.postIds(), posts.map((post) => post.id));
  invalidatePostSummaryCache();
  for (const post of posts) {
    if (post.status === "published") await indexPost(post);
  }
}

async function applyPages(pages: Page[]): Promise<void> {
  await wipePrefix(["pages"]);
  await wipePrefix(["summaries", "page"]);
  const op = kv.atomic();
  for (const page of pages) {
    op.set(KvKeys.page(page.slug), page);
    op.set(KvKeys.pageSummary(page.id), toPageSummary(page));
  }
  await op.commit();
  await kv.set(KvKeys.pageIds(), pages.map((page) => page.id));
  invalidatePageSummaryCache();
}

async function applyTags(tags: Tag[]): Promise<void> {
  await wipePrefix(["tags"]);
  const op = kv.atomic();
  for (const tag of tags) op.set(KvKeys.tag(tag.slug), tag);
  await op.commit();
  await kv.set(KvKeys.tagIds(), tags.map((tag) => tag.slug));
}

async function applyRedirects(redirects: RedirectEntry[]): Promise<void> {
  await wipePrefix(["redirects"]);
  for (const redirect of redirects) {
    await kv.set(KvKeys.redirect(redirect.from), redirect);
  }
  invalidateRedirectCache();
}

/** Replace all content namespaces with validated export data. */
export async function applyImport(data: ExportData): Promise<void> {
  await applyPosts(data.posts);
  await applyPages(data.pages);
  await applyTags(data.tags);
  await saveMenuItems(data.menu);
  await saveSettings(data.settings);
  await applyRedirects(data.redirects);
}
