// Blog index: paginated list of published posts + sidebar.
// Source: ai/requirements.md F1/F12 (postsPerPage), UI 5.2 (zero JS).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { listPublishedPosts } from "@/lib/posts.ts";
import { listTagsWithCounts } from "@/lib/tags.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { getAuthorsMap } from "@/lib/users.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import { PostCard } from "@/components/PostCard.tsx";
import { Pagination } from "@/components/Pagination.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import {
  PUBLIC_MAIN_PY,
  PUBLIC_SHELL,
  PUBLIC_TYPE_MUTED,
  PUBLIC_TYPE_PAGE_TITLE,
} from "@/lib/public-ui.ts";

export const handler = define.handlers(async (ctx) => {
  const [settings, allPosts, tags, navLinks] = await Promise.all([
    getSettings(),
    listPublishedPosts(),
    listTagsWithCounts(),
    getNavLinks(),
  ]);
  const page = Math.max(1, Number(ctx.url.searchParams.get("page")) || 1);
  const perPage = settings.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(allPosts.length / perPage));
  const pagePosts = allPosts.slice((page - 1) * perPage, page * perPage);
  const authors = await getAuthorsMap(pagePosts.map((p) => p.authorId));
  return {
    data: {
      settings,
      posts: pagePosts,
      page,
      totalPages,
      navLinks,
      recentPosts: allPosts.slice(0, 5),
      tags,
      authors,
      isAdmin: !!ctx.state.user,
    },
  };
});

export default define.page<typeof handler>(function Home({ data }) {
  const {
    settings,
    posts,
    page,
    totalPages,
    navLinks,
    recentPosts,
    tags,
    authors,
    isAdmin,
  } = data;
  return (
    <>
      <Head>
        <SeoMeta
          meta={{
            title: settings.defaultMetaTitle ?? settings.siteName,
            description: settings.defaultMetaDescription ??
              settings.siteDescription,
            canonicalUrl: canonicalUrl("/"),
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
      >
        <main
          class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY} flex flex-col lg:flex-row gap-10 lg:gap-12`}
        >
          <div class="flex-1 min-w-0">
            {page === 1 && (
              <header class="mb-10">
                <h1 class={PUBLIC_TYPE_PAGE_TITLE}>{settings.siteName}</h1>
                {settings.siteDescription && (
                  <p class={`${PUBLIC_TYPE_MUTED} mt-3`}>
                    {settings.siteDescription}
                  </p>
                )}
              </header>
            )}
            {posts.length === 0
              ? <p class={PUBLIC_TYPE_MUTED}>No posts yet.</p>
              : (
                <div class="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      author={authors[post.authorId]}
                    />
                  ))}
                </div>
              )}
            <Pagination page={page} totalPages={totalPages} basePath="/" />
          </div>
          <Sidebar recentPosts={recentPosts} tags={tags} />
        </main>
      </PublicLayout>
    </>
  );
});
