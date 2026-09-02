// Import posts from a WordPress XML (WXR) or Ghost JSON export as
// drafts (F23). HTML content is converted to Markdown with turndown;
// tag references become internal tag slugs (missing tags are created).
// Source: ai/requirements.md 405-407.

import { createRequire } from "node:module";
import type TurndownService from "turndown";
import { XMLParser } from "fast-xml-parser";
import { createPost } from "./post-mutations.ts";
import { createTag } from "./tags.ts";
import { slugify } from "@/utils/slugify.ts";

export interface ExternalTag {
  name: string;
  slug: string;
}

export interface ExternalPost {
  title: string;
  contentHtml: string;
  slug?: string;
  tags: ExternalTag[];
}

// turndown's ESM build falls back to require() for its DOM parser,
// which crashes inside the bundled server output. Loading the CommonJS
// build at runtime keeps it out of the bundler entirely.
const nodeRequire = createRequire(import.meta.url);
const turndownModule = nodeRequire("turndown") as
  | typeof TurndownService
  | { default: typeof TurndownService };
const Turndown = typeof turndownModule === "function"
  ? turndownModule
  : turndownModule.default;
const turndown = new Turndown({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

function toArray<T>(value: T[] | T | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

type XmlRecord = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

/** WXR items that are real posts (skip pages, attachments, revisions). */
function isWxrPost(item: XmlRecord): boolean {
  return str(item.post_type) === "post" && str(item.status) !== "trash";
}

function wxrTags(item: XmlRecord): ExternalTag[] {
  return toArray(item.category as XmlRecord | XmlRecord[] | undefined)
    .filter((cat) => ["post_tag", "category"].includes(str(cat["@_domain"])))
    .map((cat) => ({
      name: str(cat["#text"]) || str(cat["@_nicename"]),
      slug: slugify(str(cat["@_nicename"]) || str(cat["#text"])),
    }))
    .filter((tag) => tag.slug);
}

/** Parse a WordPress eXtended RSS export. */
export function parseWordPressXml(xml: string): ExternalPost[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
  });
  const doc = parser.parse(xml) as XmlRecord;
  const channel = (doc.rss as XmlRecord | undefined)?.channel as XmlRecord ??
    (doc.channel as XmlRecord | undefined) ?? {};
  return toArray(channel.item as XmlRecord | XmlRecord[] | undefined)
    .filter(isWxrPost)
    .map((item) => ({
      title: str(item.title).trim() || "Untitled import",
      contentHtml: str(item.encoded ?? item["content:encoded"]),
      slug: str(item.post_name) || undefined,
      tags: wxrTags(item),
    }));
}

/** Parse a Ghost JSON export (db[0].data with posts/tags/posts_tags). */
export function parseGhostJson(raw: string): ExternalPost[] {
  const doc = JSON.parse(raw) as {
    db?: {
      data?: { posts?: unknown[]; tags?: unknown[]; posts_tags?: unknown[] };
    }[];
  };
  const data = doc.db?.[0]?.data;
  if (!data?.posts) {
    throw new Error("Not a Ghost export (db[0].data.posts missing).");
  }
  const tagSlugs = new Map<string, ExternalTag>();
  for (const tag of toArray(data.tags as XmlRecord[])) {
    const name = str(tag.name);
    tagSlugs.set(str(tag.id), { name, slug: slugify(name) || "tag" });
  }
  const byPost = new Map<string, ExternalTag[]>();
  for (const link of toArray(data.posts_tags as XmlRecord[])) {
    const tag = tagSlugs.get(str(link.tag_id));
    const postId = str(link.post_id);
    if (tag) byPost.set(postId, [...(byPost.get(postId) ?? []), tag]);
  }
  return toArray(data.posts as XmlRecord[]).map((post) => ({
    title: str(post.title).trim() || "Untitled import",
    contentHtml: str(post.html),
    slug: str(post.slug) || undefined,
    tags: byPost.get(str(post.id)) ?? [],
  }));
}

/** Convert and insert external posts as drafts; returns the count. */
export async function importExternalPosts(
  posts: ExternalPost[],
  authorId: string,
): Promise<number> {
  let created = 0;
  for (const post of posts) {
    for (const tag of post.tags) {
      await createTag({ name: tag.name || tag.slug, slug: tag.slug });
    }
    const result = await createPost({
      title: post.title,
      slug: post.slug,
      content: turndown.turndown(post.contentHtml),
      tags: post.tags.map((tag) => tag.slug),
    }, authorId);
    if (result.ok) created++;
  }
  return created;
}
