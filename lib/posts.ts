// Post persistence: reads, input types, slug helpers.
// Writes (create/update/publish/delete/snapshots) live in lib/post-mutations.ts.
// Sources: ai/requirements.md F1, schema 6.1.

import { kv, KvKeys } from "./kv.ts";
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
  const draft = await kv.get<Post>(KvKeys.draftPost(id));
  if (draft.value) return draft.value;
  const iter = kv.list<Post>({ prefix: PUBLISHED_PREFIX });
  for await (const entry of iter) {
    if (entry.value.id === id) return entry.value;
  }
  return null;
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
