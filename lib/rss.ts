// RSS 2.0 feed generation with full post content.
// Source: ai/requirements.md F11 (section 7.1).

import type { Post } from "@/types/index.ts";
import { absoluteUrl } from "./seo.ts";
import { renderMarkdown } from "./markdown.ts";

/** Channel metadata for the feed. */
export interface FeedMeta {
  title: string;
  description: string;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function itemXml(post: Post): string {
  const url = absoluteUrl(`/${post.slug}`);
  const pubDate = new Date(post.publishedAt ?? post.createdAt).toUTCString();
  const categories = post.tags
    .map((tag) => `    <category>${escapeXml(tag)}</category>`)
    .join("\n");
  return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.excerpt)}</description>
    <content:encoded><![CDATA[${
    renderMarkdown(post.content)
  }]]></content:encoded>
${categories}
  </item>`;
}

/** Build a valid RSS 2.0 document for the given posts. */
export function buildRss(
  posts: Post[],
  meta: FeedMeta,
  selfPath: string,
): string {
  const items = posts.map(itemXml).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(meta.title)}</title>
  <link>${absoluteUrl("/")}</link>
  <description>${escapeXml(meta.description)}</description>
  <language>ru</language>
  <atom:link href="${
    absoluteUrl(selfPath)
  }" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`;
}
