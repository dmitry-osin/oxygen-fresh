// Tag persistence: CRUD. The tag slug is the primary key.
// Source: ai/requirements.md F3 (section 7.1), schema 6.1.

import { addToList, kv, KvKeys, removeFromList } from "./kv.ts";
import type { Post, Tag } from "@/types/index.ts";
import {
  getPostById,
  invalidatePostSummaryCache,
  listPublishedPosts,
  toPostSummary,
} from "./posts.ts";
import { slugify } from "@/utils/slugify.ts";
import { isValidSlug } from "@/utils/validate.ts";
import { nowIso } from "@/utils/date.ts";

/** Fields accepted from the tag editor form. */
export interface TagInput {
  name: string;
  description?: string;
}

export type TagResult =
  | { ok: true; tag: Tag }
  | { ok: false; error: string };

const TAGS_PREFIX = ["tags"];

/** All tags, ordered by slug. */
export async function listTags(): Promise<Tag[]> {
  const tags: Tag[] = [];
  const iter = kv.list<Tag>({ prefix: TAGS_PREFIX });
  for await (const entry of iter) tags.push(entry.value);
  return tags.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Tag with how many published posts use it (for public tag clouds). */
export interface TagWithCount {
  slug: string;
  name: string;
  count: number;
}

/**
 * Tags that appear on at least one published post, sorted by popularity.
 * Counts come from published posts only (drafts ignored).
 */
export async function listTagsWithCounts(): Promise<TagWithCount[]> {
  const [tags, posts] = await Promise.all([
    listTags(),
    listPublishedPosts(),
  ]);
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const slug of post.tags) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return tags
    .map((tag) => ({
      slug: tag.slug,
      name: tag.name,
      count: counts.get(tag.slug) ?? 0,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getTag(slug: string): Promise<Tag | null> {
  return (await kv.get<Tag>(KvKeys.tag(slug))).value;
}

/** Create a tag; the slug comes from the name and must be free. */
export async function createTag(
  input: TagInput & { slug?: string },
): Promise<TagResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required." };
  const slug = input.slug?.trim() || slugify(name);
  if (!isValidSlug(slug)) return { ok: false, error: "Invalid slug." };
  const current = await kv.get<Tag>(KvKeys.tag(slug));
  if (current.value) return { ok: false, error: "Tag already exists." };
  const tag: Tag = {
    slug,
    name,
    description: input.description?.trim() || undefined,
    createdAt: nowIso(),
  };
  // Tie the write to the exact (empty) row read above: two concurrent
  // creates for the same slug can no longer both report success.
  const res = await kv.atomic().check(current).set(KvKeys.tag(slug), tag)
    .commit();
  if (!res.ok) return { ok: false, error: "Tag already exists." };
  await addToList(KvKeys.tagIds(), slug);
  return { ok: true, tag };
}

/** Update display fields. The slug is the primary key and stays immutable. */
export async function updateTag(
  slug: string,
  input: TagInput,
): Promise<TagResult> {
  const tag = await getTag(slug);
  if (!tag) return { ok: false, error: "Tag not found." };
  if (!input.name.trim()) return { ok: false, error: "Name is required." };
  const updated: Tag = {
    ...tag,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
  };
  await kv.set(KvKeys.tag(slug), updated);
  return { ok: true, tag: updated };
}

/** Posts carrying the tag, published only, newest first. */
export async function listPostsByTag(tagSlug: string): Promise<Post[]> {
  const ids: string[] = [];
  const iter = kv.list<string>({ prefix: ["posts_by_tag", tagSlug] });
  for await (const entry of iter) ids.push(entry.value);
  const posts = await Promise.all(ids.map((id) => getPostById(id)));
  return posts
    .filter((post): post is Post => post?.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

// Deno KV caps an atomic() transaction at 1000 mutations. Each affected
// post costs 3 (post row + summary + posts_by_tag delete), so batches
// stay well under that ceiling regardless of how many posts share a tag.
const DELETE_TAG_CHUNK = 200;

/**
 * Delete the tag and remove it from every post (published + drafts),
 * batched so a popular tag (hundreds of posts) can't blow the atomic
 * mutation limit. Each post is re-read right before its batch commits,
 * keeping the lost-update window to the batch itself instead of however
 * long it takes to enumerate every post in the blog.
 * Source: F3.
 */
export async function deleteTag(slug: string): Promise<boolean> {
  const tag = await getTag(slug);
  if (!tag) return false;

  const postIds: string[] = [];
  const iter = kv.list<string>({ prefix: ["posts_by_tag", slug] });
  for await (const entry of iter) postIds.push(entry.value);

  await kv.atomic().delete(KvKeys.tag(slug)).commit();
  for (let i = 0; i < postIds.length; i += DELETE_TAG_CHUNK) {
    const chunk = postIds.slice(i, i + DELETE_TAG_CHUNK);
    const posts = await Promise.all(chunk.map((id) => getPostById(id)));
    const op = kv.atomic();
    for (const post of posts) {
      if (!post || !post.tags.includes(slug)) continue;
      const updated = {
        ...post,
        tags: post.tags.filter((t) => t !== slug),
        updatedAt: nowIso(),
      };
      op.set(
        updated.status === "published"
          ? KvKeys.publishedPost(updated.slug)
          : KvKeys.draftPost(updated.id),
        updated,
      );
      op.set(KvKeys.postSummary(updated.id), toPostSummary(updated));
      op.delete(KvKeys.postsByTag(slug, updated.id));
    }
    await op.commit();
  }
  invalidatePostSummaryCache();
  await removeFromList(KvKeys.tagIds(), slug);
  return true;
}
