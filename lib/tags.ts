// Tag persistence: CRUD. The tag slug is the primary key.
// Source: ai/requirements.md F3 (section 7.1), schema 6.1.

import { addToList, kv, KvKeys, removeFromList } from "./kv.ts";
import type { Post, Tag } from "@/types/index.ts";
import { DRAFT_PREFIX, getPostById, PUBLISHED_PREFIX } from "./posts.ts";
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
  if (await getTag(slug)) return { ok: false, error: "Tag already exists." };
  const tag: Tag = {
    slug,
    name,
    description: input.description?.trim() || undefined,
    createdAt: nowIso(),
  };
  await kv.set(KvKeys.tag(slug), tag);
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
  const posts: Post[] = [];
  const iter = kv.list<string>({ prefix: ["posts_by_tag", tagSlug] });
  for await (const entry of iter) {
    const post = await getPostById(entry.value);
    if (post?.status === "published") posts.push(post);
  }
  return posts.sort((a, b) =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
  );
}

/**
 * Delete the tag and remove it from every post (published + drafts)
 * in one atomic batch. Source: F3.
 */
export async function deleteTag(slug: string): Promise<boolean> {
  const tag = await getTag(slug);
  if (!tag) return false;

  const affected: { post: Post; key: Deno.KvKey }[] = [];
  for (const prefix of [PUBLISHED_PREFIX, DRAFT_PREFIX]) {
    const iter = kv.list<Post>({ prefix });
    for await (const entry of iter) {
      if (entry.value.tags.includes(slug)) {
        affected.push({ post: entry.value, key: entry.key });
      }
    }
  }

  const op = kv.atomic().delete(KvKeys.tag(slug));
  for (const { post, key } of affected) {
    op.set(key, {
      ...post,
      tags: post.tags.filter((t) => t !== slug),
      updatedAt: nowIso(),
    });
    op.delete(KvKeys.postsByTag(slug, post.id));
  }
  await op.commit();
  await removeFromList(KvKeys.tagIds(), slug);
  return true;
}
