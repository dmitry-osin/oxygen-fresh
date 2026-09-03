// Version history: read snapshots and restore them into the current post
// (or into a new draft). Snapshots are written on every publish.
// Source: ai/requirements.md F8 (section 7.1).

import { kv, KvKeys } from "./kv.ts";
import type { Post, PostSnapshot } from "@/types/index.ts";
import { insertPost, updatePost } from "./post-mutations.ts";
import { getPostById, type SaveResult, uniqueSlug } from "./posts.ts";
import { nowIso } from "@/utils/date.ts";

/** All snapshots of a post, newest first. */
export async function listVersions(postId: string): Promise<PostSnapshot[]> {
  const versions: PostSnapshot[] = [];
  const iter = kv.list<PostSnapshot>({
    prefix: KvKeys.postVersionPrefix(postId),
  });
  for await (const entry of iter) versions.push(entry.value);
  return versions.sort((a, b) => b.versionId.localeCompare(a.versionId));
}

export async function getVersion(
  postId: string,
  versionId: string,
): Promise<PostSnapshot | null> {
  return (await kv.get<PostSnapshot>(KvKeys.postVersion(postId, versionId)))
    .value;
}

/**
 * Apply a snapshot onto the existing post (title/body/intro/tags).
 * Keeps id, slug, status and template. Source: History restore.
 */
export async function restoreVersionToPost(
  postId: string,
  versionId: string,
): Promise<SaveResult> {
  const [snapshot, post] = await Promise.all([
    getVersion(postId, versionId),
    getPostById(postId),
  ]);
  if (!snapshot || !post) {
    return { ok: false, error: "Version or post not found." };
  }
  return await updatePost(postId, {
    title: snapshot.title,
    content: snapshot.content,
    excerpt: snapshot.excerpt,
    tags: [...snapshot.tags],
    status: post.status === "scheduled" ? "scheduled" : "draft",
    template: post.template,
  });
}

/**
 * Copy a version into a NEW draft post. The user must publish it explicitly;
 * the current post is never overwritten. Source: F8 "Restore to draft".
 */
export async function restoreVersionToDraft(
  postId: string,
  versionId: string,
  authorId: string,
): Promise<Post | null> {
  const snapshot = await getVersion(postId, versionId);
  if (!snapshot) return null;
  const now = nowIso();
  const draft: Post = {
    id: crypto.randomUUID(),
    slug: await uniqueSlug(snapshot.slug),
    title: snapshot.title,
    content: snapshot.content,
    excerpt: snapshot.excerpt,
    status: "draft",
    tags: [...snapshot.tags],
    template: "default",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    authorId,
  };
  await insertPost(draft);
  return draft;
}
