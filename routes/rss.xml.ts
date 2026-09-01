// RSS 2.0 feed: all published posts, ordered by publishedAt desc.
// Optional ?tag=slug filter. Source: ai/requirements.md F11.

import { define } from "@/utils.ts";
import { listPublishedPosts } from "@/lib/posts.ts";
import { buildRss } from "@/lib/rss.ts";

export const handler = define.handlers(async (ctx) => {
  const tag = ctx.url.searchParams.get("tag");
  let posts = await listPublishedPosts();
  if (tag) posts = posts.filter((post) => post.tags.includes(tag));

  // Feed channel metadata. Replaced by site settings (F12) in stage 9.
  const xml = buildRss(
    posts,
    { title: "oxygen-blog", description: "oxygen-blog feed" },
    ctx.url.pathname + ctx.url.search,
  );

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
});
