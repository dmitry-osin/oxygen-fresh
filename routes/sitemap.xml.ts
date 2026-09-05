// XML sitemap: blog index, all published posts and all pages.
// Source: ai/requirements.md F10 (section 7.1).

import { define } from "@/utils.ts";
import { listPublishedPosts } from "@/lib/posts.ts";
import { listPages } from "@/lib/pages.ts";
import { absoluteUrl } from "@/lib/seo.ts";
import { escapeXml } from "@/lib/rss.ts";

function urlEntry(loc: string, lastmod?: string): string {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
}

// Bots hit this unauthenticated endpoint often; cache like menu/settings
// so a busy blog doesn't rebuild the full post+page listing per crawl.
const CACHE_TTL_MS = 60_000;
let cached: { at: number; xml: string } | null = null;

async function buildSitemap(): Promise<string> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.xml;
  const [posts, pages] = await Promise.all([
    listPublishedPosts(),
    listPages(),
  ]);

  const entries = [
    urlEntry(absoluteUrl("/")),
    ...posts.map((post) =>
      urlEntry(absoluteUrl(`/${post.slug}`), post.updatedAt.slice(0, 10))
    ),
    ...pages.map((page) =>
      urlEntry(absoluteUrl(`/page/${page.slug}`), page.updatedAt.slice(0, 10))
    ),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
  cached = { at: Date.now(), xml };
  return xml;
}

export const handler = define.handlers(async () => {
  return new Response(await buildSitemap(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
});
