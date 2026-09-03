// Archive of posts published on a single UTC day (YYYY-MM-DD).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import {
  collectPostDays,
  listPostsOnDay,
  listPublishedPosts,
} from "@/lib/posts.ts";
import { listTagsWithCounts } from "@/lib/tags.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { getAuthorsMap } from "@/lib/users.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { formatDateLong, parseCalendarMonth } from "@/utils/date.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import { PostCard } from "@/components/PostCard.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import {
  PUBLIC_MAIN_PY,
  PUBLIC_SHELL,
  PUBLIC_TYPE_MUTED,
  PUBLIC_TYPE_PAGE_TITLE,
} from "@/lib/public-ui.ts";

export const handler = define.handlers(async (ctx) => {
  const day = ctx.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new HttpError(404);
  const [settings, posts, allPosts, tags, navLinks] = await Promise.all([
    getSettings(),
    listPostsOnDay(day),
    listPublishedPosts(),
    listTagsWithCounts(),
    getNavLinks(),
  ]);
  const authors = await getAuthorsMap(posts.map((p) => p.authorId));
  return {
    data: {
      day,
      posts,
      settings,
      navLinks,
      authors,
      recentPosts: allPosts.slice(0, 5),
      tags,
      postDays: collectPostDays(allPosts),
      calendarMonth: parseCalendarMonth(
        ctx.url.searchParams.get("cal"),
        day,
      ),
      isAdmin: !!ctx.state.user,
    },
  };
});

export default define.page<typeof handler>(function DayArchive({ data }) {
  const {
    day,
    posts,
    settings,
    navLinks,
    authors,
    recentPosts,
    tags,
    postDays,
    calendarMonth,
    isAdmin,
  } = data;
  const title = formatDateLong(`${day}T12:00:00.000Z`);
  return (
    <>
      <Head>
        <SeoMeta
          meta={{
            title: `${title} - ${settings.siteName}`,
            description: `Posts published on ${day}`,
            canonicalUrl: canonicalUrl(`/day/${day}`),
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
            <header class="mb-10">
              <h1 class={PUBLIC_TYPE_PAGE_TITLE}>{title}</h1>
              <p class={`${PUBLIC_TYPE_MUTED} mt-3`}>
                {posts.length === 0
                  ? "No posts on this day."
                  : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
              </p>
            </header>
            {posts.length > 0 && (
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
          </div>
          <Sidebar
            recentPosts={recentPosts}
            tags={tags}
            postDays={postDays}
            calendarMonth={calendarMonth}
            selectedDay={day}
            sidebarBlocks={settings.sidebarBlocks}
          />
        </main>
      </PublicLayout>
    </>
  );
});
