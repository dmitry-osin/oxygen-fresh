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

export const handler = define.handlers(async () => {
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

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
});
