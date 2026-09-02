// Post writes: create/update/delete, status transitions, publish snapshots.
// Sources: ai/requirements.md F1 (posts CRUD), F8 (snapshots on publish).

import { addToList, kv, KvKeys, removeFromList } from "./kv.ts";
import type { Post, PostSnapshot } from "@/types/index.ts";
import {
  getPostById,
  isSlugTaken,
  type PostInput,
  type SaveResult,
  uniqueSlug,
} from "./posts.ts";
import { slugify } from "@/utils/slugify.ts";
import { isValidSlug } from "@/utils/validate.ts";
import { nowIso } from "@/utils/date.ts";
import { plainText } from "./markdown.ts";
import { indexPost, unindexPost } from "./search.ts";

/** Where a post lives: public space only when published. */
function postKey(post: Post) {
  return post.status === "published"
    ? KvKeys.publishedPost(post.slug)
    : KvKeys.draftPost(post.id);
}

function syncTagIndex(
  op: Deno.AtomicOperation,
  post: Post,
  previous?: Post,
): void {
  for (const tag of previous?.tags ?? []) {
    op.delete(KvKeys.postsByTag(tag, post.id));
  }
  for (const tag of post.tags) {
    op.set(KvKeys.postsByTag(tag, post.id), post.id);
  }
}

/** Atomically write the post and its secondary indexes. */
async function commitPost(post: Post, previous?: Post): Promise<void> {
  const op = kv.atomic();
  if (
    previous?.status === "published" &&
    (post.status !== "published" || previous.slug !== post.slug)
  ) {
    op.delete(KvKeys.publishedPost(previous.slug));
  }
  if (
    previous && previous.status !== "published" && post.status === "published"
  ) {
    op.delete(KvKeys.draftPost(post.id));
  }
  op.set(postKey(post), post);
  syncTagIndex(op, post, previous);
  await op.commit();
}

/** Insert a brand-new post object and register its id. */
export async function insertPost(post: Post): Promise<void> {
  await commitPost(post);
  await addToList(KvKeys.postIds(), post.id);
}

/** Create a draft post; the slug is auto-generated and made unique. */
export async function createPost(
  input: PostInput,
  authorId: string,
): Promise<SaveResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };
  const now = nowIso();
  const post: Post = {
    id: crypto.randomUUID(),
    slug: await uniqueSlug(input.slug?.trim() || slugify(title)),
    title,
    content: input.content ?? "",
    excerpt: input.excerpt ?? "",
    status: "draft",
    tags: input.tags ?? [],
    template: input.template ?? "default",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    authorId,
  };
  await insertPost(post);
  return { ok: true, post };
}

function nextStatus(post: Post, input: PostInput): Post["status"] {
  if (post.status === "published") return "published";
  return input.status === "scheduled" ? "scheduled" : "draft";
}

function applyInput(post: Post, input: PostInput): Post {
  const content = input.content ?? post.content;
  const status = nextStatus(post, input);
  return {
    ...post,
    title: input.title.trim(),
    slug: input.slug?.trim() || post.slug,
    content,
    excerpt: input.excerpt?.trim() || plainText(content).slice(0, 200),
    status,
    tags: input.tags ?? post.tags,
    template: input.template ?? post.template,
    publishedAt: status === "scheduled"
      ? input.publishedAt ?? post.publishedAt
      : post.publishedAt,
    metaTitle: input.metaTitle?.trim() || undefined,
    metaDescription: input.metaDescription?.trim() || undefined,
    canonicalUrl: input.canonicalUrl?.trim() || undefined,
    updatedAt: nowIso(),
  };
}

/** Update post fields. Slug uniqueness is enforced here (before write). */
export async function updatePost(
  id: string,
  input: PostInput,
): Promise<SaveResult> {
  const post = await getPostById(id);
  if (!post) return { ok: false, error: "Post not found." };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  const slug = input.slug?.trim() || post.slug;
  if (!isValidSlug(slug)) return { ok: false, error: "Invalid slug." };
  if (await isSlugTaken(slug, id)) {
    return { ok: false, error: "Slug is already in use." };
  }
  const updated = applyInput(post, input);
  await commitPost(updated, post);
  if (updated.status === "published") await indexPost(updated);
  return { ok: true, post: updated };
}

/**
 * Publish: move to the public space, set publishedAt, save a snapshot.
 * An explicit publishedAt keeps the scheduled time when the scheduler
 * auto-publishes a due post (F20).
 */
export async function publishPost(
  id: string,
  publishedAt?: string,
): Promise<SaveResult> {
  const post = await getPostById(id);
  if (!post) return { ok: false, error: "Post not found." };
  if (await isSlugTaken(post.slug, id)) {
    return { ok: false, error: "Slug is already in use." };
  }
  const now = nowIso();
  const published: Post = {
    ...post,
    status: "published",
    publishedAt: publishedAt ?? now,
    updatedAt: now,
  };
  await commitPost(published, post);
  await createSnapshot(published);
  await indexPost(published);
  return { ok: true, post: published };
}

/** Unpublish: move back to drafts; the post disappears from the public site. */
export async function unpublishPost(id: string): Promise<SaveResult> {
  const post = await getPostById(id);
  if (!post) return { ok: false, error: "Post not found." };
  const draft: Post = { ...post, status: "draft", updatedAt: nowIso() };
  await commitPost(draft, post);
  await unindexPost(draft.id);
  return { ok: true, post: draft };
}

/** Delete the post, its indexes, search entries and version history. */
export async function deletePost(id: string): Promise<boolean> {
  const post = await getPostById(id);
  if (!post) return false;
  const op = kv.atomic().delete(postKey(post));
  syncTagIndex(op, { ...post, tags: [] }, post);
  op.delete(KvKeys.postVersionMeta(post.id));
  await op.commit();
  await removeFromList(KvKeys.postIds(), id);
  await unindexPost(id);
  const iter = kv.list({ prefix: KvKeys.postVersionPrefix(id) });
  for await (const entry of iter) await kv.delete(entry.key);
  return true;
}

/** Immutable snapshot written on every (re-)publish. Never on draft edits. */
async function createSnapshot(post: Post): Promise<void> {
  const ts = nowIso();
  const snapshot: PostSnapshot = {
    id: post.id,
    versionId: ts,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    tags: post.tags,
    publishedAt: ts,
    createdAt: ts,
  };
  const metaKey = KvKeys.postVersionMeta(post.id);
  const meta =
    (await kv.get<{ count: number; latestTimestamp: string }>(metaKey)).value;
  await kv.atomic()
    .set(KvKeys.postVersion(post.id, ts), snapshot)
    .set(metaKey, { count: (meta?.count ?? 0) + 1, latestTimestamp: ts })
    .commit();
}
