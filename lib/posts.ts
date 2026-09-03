// Post persistence: reads, input types, slug helpers.
// Writes (create/update/publish/delete/snapshots) live in lib/post-mutations.ts.
// Sources: ai/requirements.md F1, schema 6.1.

import { kv, KvKeys } from "./kv.ts";
import { recordCache } from "./perf.ts";
import type { Post } from "@/types/index.ts";

/** Fields accepted from the post editor form. */
export interface PostInput {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  status?: Post["status"];
  tags?: string[];
  template?: Post["template"];
  publishedAt?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export type SaveResult =
  | { ok: true; post: Post }
  | { ok: false; error: string };

export const PUBLISHED_PREFIX = ["posts", "published"];
export const DRAFT_PREFIX = ["posts", "draft"];
const POST_SUMMARY_PREFIX = ["summaries", "post"] as const;
const SUMMARY_WRITE_CHUNK = 100;

/** All published posts, ordered by publishedAt descending. */
export async function listPublishedPosts(): Promise<Post[]> {
  const posts: Post[] = [];
  const iter = kv.list<Post>({ prefix: PUBLISHED_PREFIX });
  for await (const entry of iter) posts.push(entry.value);
  return posts.sort((a, b) =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
  );
}

/** All drafts and scheduled posts, ordered by updatedAt descending. */
export async function listDrafts(): Promise<Post[]> {
  const drafts: Post[] = [];
  const iter = kv.list<Post>({ prefix: DRAFT_PREFIX });
  for await (const entry of iter) drafts.push(entry.value);
  return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Fields needed by the admin post table (no Markdown body). */
export type PostSummary = Omit<Post, "content">;

const SUMMARY_CACHE_TTL_MS = 60_000;
let summaryCache: { at: number; posts: PostSummary[] } | null = null;

/** Drop the admin list cache after create / publish / delete / edit. */
export function invalidatePostSummaryCache(): void {
  summaryCache = null;
}

export function toPostSummary(post: Post): PostSummary {
  const { content: _content, ...summary } = post;
  return summary;
}

async function listPostSummariesFromKv(): Promise<PostSummary[]> {
  const posts: PostSummary[] = [];
  const iter = kv.list<PostSummary>({ prefix: POST_SUMMARY_PREFIX });
  for await (const entry of iter) posts.push(entry.value);
  return posts;
}

export function queuePostSummary(
  op: Deno.AtomicOperation,
  post: Post,
): Deno.AtomicOperation {
  return op.set(KvKeys.postSummary(post.id), toPostSummary(post));
}

/** Backfill summary keys from full posts (legacy DBs / import drift). */
async function rebuildPostSummaries(): Promise<PostSummary[]> {
  const existing = kv.list({ prefix: POST_SUMMARY_PREFIX });
  for await (const entry of existing) await kv.delete(entry.key);
  const posts = (await listAllPosts()).map(toPostSummary);
  for (let i = 0; i < posts.length; i += SUMMARY_WRITE_CHUNK) {
    const chunk = posts.slice(i, i + SUMMARY_WRITE_CHUNK);
    const op = kv.atomic();
    for (const summary of chunk) {
      op.set(KvKeys.postSummary(summary.id), summary);
    }
    await op.commit();
  }
  return posts;
}

async function loadPostSummaries(): Promise<PostSummary[]> {
  const [fromKv, ids] = await Promise.all([
    listPostSummariesFromKv(),
    kv.get<string[]>(KvKeys.postIds()),
  ]);
  const expected = ids.value?.length ?? 0;
  if (expected > 0 && fromKv.length !== expected) {
    return await rebuildPostSummaries();
  }
  if (expected === 0 && fromKv.length > 0) {
    return await rebuildPostSummaries();
  }
  return fromKv;
}

/** Published + drafts for admin lists — reads summary keys only. */
export async function listAllPostSummaries(): Promise<PostSummary[]> {
  if (summaryCache && Date.now() - summaryCache.at < SUMMARY_CACHE_TTL_MS) {
    recordCache("post-summaries", true);
    return summaryCache.posts;
  }
  recordCache("post-summaries", false);
  const posts = (await loadPostSummaries()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  summaryCache = { posts, at: Date.now() };
  return posts;
}

/** Published posts without Markdown bodies (menus, pickers, indexes). */
export async function listPublishedPostSummaries(): Promise<PostSummary[]> {
  return (await listAllPostSummaries())
    .filter((post) => post.status === "published")
    .sort((a, b) =>
      (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
    );
}

export async function getPostSummary(id: string): Promise<PostSummary | null> {
  return (await kv.get<PostSummary>(KvKeys.postSummary(id))).value;
}

/** id/slug/title only — for selects that must not pull Markdown bodies into HTML. */
export type PostPickerItem = Pick<Post, "id" | "slug" | "title">;

export async function listPublishedPostPickers(): Promise<PostPickerItem[]> {
  return (await listPublishedPostSummaries()).map(({ id, slug, title }) => ({
    id,
    slug,
    title,
  }));
}

/** UTC calendar day (YYYY-MM-DD) from a post's publishedAt. */
export function postDayKey(post: Pick<Post, "publishedAt">): string | null {
  return post.publishedAt ? post.publishedAt.slice(0, 10) : null;
}

/** Unique publish days for the sidebar calendar. */
export function collectPostDays(
  posts: Pick<Post, "publishedAt">[],
): string[] {
  const days = new Set<string>();
  for (const post of posts) {
    const day = postDayKey(post);
    if (day) days.add(day);
  }
  return [...days].sort();
}

/** Published posts for a single UTC day (YYYY-MM-DD). */
export async function listPostsOnDay(day: string): Promise<Post[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
  return (await listPublishedPosts()).filter(
    (post) => postDayKey(post) === day,
  );
}

/** Published posts + drafts for the admin list. */
export async function listAllPosts(): Promise<Post[]> {
  const [published, drafts] = await Promise.all([
    listPublishedPosts(),
    listDrafts(),
  ]);
  return [...published, ...drafts].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export async function getPublishedBySlug(slug: string): Promise<Post | null> {
  return (await kv.get<Post>(KvKeys.publishedPost(slug))).value;
}

export async function getPostById(id: string): Promise<Post | null> {
  // Prefer the published copy when both keys somehow exist (stale draft).
  const iter = kv.list<Post>({ prefix: PUBLISHED_PREFIX });
  for await (const entry of iter) {
    if (entry.value.id === id) return entry.value;
  }
  return (await kv.get<Post>(KvKeys.draftPost(id))).value;
}

/** True when another post already uses the slug. */
export async function isSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const published = await getPublishedBySlug(slug);
  if (published && published.id !== excludeId) return true;
  const iter = kv.list<Post>({ prefix: DRAFT_PREFIX });
  for await (const entry of iter) {
    if (entry.value.slug === slug && entry.value.id !== excludeId) return true;
  }
  return false;
}

/** Slug guaranteed to be free: base, base-2, base-3, ... */
export async function uniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const stem = base || "post";
  for (let i = 0;; i++) {
    const candidate = i === 0 ? stem : `${stem}-${i + 1}`;
    if (!(await isSlugTaken(candidate, excludeId))) return candidate;
  }
}

/** Up to `limit` published posts sharing the most tags (F21). */
export async function relatedPosts(
  post: Post,
  limit = 3,
): Promise<Post[]> {
  const scored = (await listPublishedPosts())
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      post: candidate,
      score: candidate.tags.filter((tag) => post.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      (b.post.publishedAt ?? "").localeCompare(a.post.publishedAt ?? "")
    );
  return scored.slice(0, limit).map((entry) => entry.post);
}
