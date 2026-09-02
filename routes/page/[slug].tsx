// Static page renderer: /page/:slug. Template switch like posts (F7).
// Source: ai/requirements.md F2, F7, F10. Zero client JavaScript (UI 5.2).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getPageBySlug } from "@/lib/pages.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { trackView } from "@/lib/analytics.ts";
import { renderMarkdown } from "@/lib/markdown.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { Header } from "@/components/Header.tsx";
import { Footer } from "@/components/Footer.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import { listPublishedPosts } from "@/lib/posts.ts";
import { listTags } from "@/lib/tags.ts";

export const handler = define.handlers(async (ctx) => {
  const page = await getPageBySlug(ctx.params.slug);
  if (!page) throw new HttpError(404);
  const [settings, navLinks, recentPosts, tags] = await Promise.all([
    getSettings(),
    getNavLinks(),
    listPublishedPosts(),
    listTags(),
    trackView("page", page.id),
  ]);
  return {
    data: {
      page,
      html: renderMarkdown(page.content),
      settings,
      navLinks,
      recentPosts: recentPosts.slice(0, 5),
      tags,
    },
  };
});

export default define.page<typeof handler>(function StaticPage({ data }) {
  const { page, html, settings, navLinks, recentPosts, tags } = data;
  const article = (
    <article>
      <h1 class="text-3xl font-bold mb-6">{page.title}</h1>
      <div
        class="prose max-w-none"
        // deno-lint-ignore react-no-danger -- sanitized server-side by renderMarkdown()
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
  return (
    <>
      <Head>
        <SeoMeta
          meta={{
            title: page.metaTitle ?? page.title,
            description: page.metaDescription ?? settings.siteDescription,
            canonicalUrl: canonicalUrl(`/page/${page.slug}`),
            ogType: "website",
          }}
        />
      </Head>
      <Header navLinks={navLinks} siteName={settings.siteName} />
      {page.template === "full-width"
        ? <main class="max-w-3xl mx-auto px-4 py-8">{article}</main>
        : (
          <main class="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-12">
            <div class="flex-1 min-w-0">{article}</div>
            <Sidebar recentPosts={recentPosts} tags={tags} />
          </main>
        )}
      <Footer siteName={settings.siteName} socialLinks={settings.socialLinks} />
    </>
  );
});
