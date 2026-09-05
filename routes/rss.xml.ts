// RSS 2.0 feed: all published posts, ordered by publishedAt desc.
// Optional ?tag=slug filter. Source: ai/requirements.md F11.
// Channel metadata comes from the site settings (F12).

import { define } from "@/utils.ts";
import { listPublishedPosts } from "@/lib/posts.ts";
import { getSettings } from "@/lib/settings.ts";
import { buildRss } from "@/lib/rss.ts";

// Bots (feed readers, search engines) hit this unauthenticated endpoint
// often; cache the built XML like menu/settings so a busy blog doesn't
// re-list every published post (with full Markdown bodies) per crawl.
const CACHE_TTL_MS = 60_000;
let cached: { at: number; byTag: Map<string, string> } | null = null;

async function buildFeed(tag: string | null): Promise<string> {
  const cacheKey = tag ?? "";
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    const hit = cached.byTag.get(cacheKey);
    if (hit) return hit;
  } else {
    cached = { at: Date.now(), byTag: new Map() };
  }
  let posts = await listPublishedPosts();
  if (tag) posts = posts.filter((post) => post.tags.includes(tag));
  const settings = await getSettings();
  const xml = buildRss(
    posts,
    {
      title: settings.siteName,
      description: settings.siteDescription || `${settings.siteName} feed`,
    },
    tag ? `/rss.xml?tag=${tag}` : "/rss.xml",
  );
  cached.byTag.set(cacheKey, xml);
  return xml;
}

export const handler = define.handlers(async (ctx) => {
  const tag = ctx.url.searchParams.get("tag");
  const xml = await buildFeed(tag);
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
});
