// Static page renderer: /page/:slug. Template switch like posts (F7).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getPageBySlug } from "@/lib/pages.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { trackView } from "@/lib/analytics.ts";
import { renderMarkdown } from "@/lib/markdown.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import { collectPostDays, listPublishedPosts } from "@/lib/posts.ts";
import { listTagsWithCounts } from "@/lib/tags.ts";
import {
  PUBLIC_MAIN_PY,
  PUBLIC_PROSE,
  PUBLIC_READING,
  PUBLIC_SHELL,
  PUBLIC_TYPE_PAGE_TITLE,
} from "@/lib/public-ui.ts";
import { parseCalendarMonth } from "@/utils/date.ts";

export const handler = define.handlers(async (ctx) => {
  const page = await getPageBySlug(ctx.params.slug);
  if (!page) throw new HttpError(404);
  const [settings, navLinks, recentPosts, tags] = await Promise.all([
    getSettings(),
    getNavLinks(),
    listPublishedPosts(),
    listTagsWithCounts(),
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
      postDays: collectPostDays(recentPosts),
      calendarMonth: parseCalendarMonth(ctx.url.searchParams.get("cal")),
      isAdmin: !!ctx.state.user,
    },
  };
});

export default define.page<typeof handler>(function StaticPage({ data }) {
  const {
    page,
    html,
    settings,
    navLinks,
    recentPosts,
    tags,
    postDays,
    calendarMonth,
    isAdmin,
  } = data;
  const article = (
    <article>
      <header class="mb-8">
        <h1 class={PUBLIC_TYPE_PAGE_TITLE}>{page.title}</h1>
      </header>
      <div
        class={PUBLIC_PROSE}
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
      <PublicLayout
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        navLinks={navLinks}
        socialLinks={settings.socialLinks}
        footerDescription={settings.footerDescription}
        isAdmin={isAdmin}
        editHref={`/admin/pages/${page.id}`}
      >
        {page.template === "full-width"
          ? (
            <main class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY}`}>
              <div class={PUBLIC_READING}>{article}</div>
            </main>
          )
          : (
            <main
              class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY} flex flex-col lg:flex-row gap-10 lg:gap-12`}
            >
              <div class="flex-1 min-w-0">{article}</div>
              <Sidebar
                recentPosts={recentPosts}
                tags={tags}
                postDays={postDays}
                calendarMonth={calendarMonth}
                sidebarBlocks={settings.sidebarPage}
              />
            </main>
          )}
      </PublicLayout>
    </>
  );
});
