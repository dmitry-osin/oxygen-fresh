// RSS 2.0 feed: all published posts, ordered by publishedAt desc.
// Optional ?tag=slug filter. Source: ai/requirements.md F11.
// Channel metadata comes from the site settings (F12).

import { define } from "@/utils.ts";
import { listPublishedPosts } from "@/lib/posts.ts";
import { getSettings } from "@/lib/settings.ts";
import { buildRss } from "@/lib/rss.ts";

export const handler = define.handlers(async (ctx) => {
  const tag = ctx.url.searchParams.get("tag");
  let posts = await listPublishedPosts();
  if (tag) posts = posts.filter((post) => post.tags.includes(tag));

  const settings = await getSettings();
  const xml = buildRss(
    posts,
    {
      title: settings.siteName,
      description: settings.siteDescription || `${settings.siteName} feed`,
    },
    ctx.url.pathname + ctx.url.search,
  );

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
});
