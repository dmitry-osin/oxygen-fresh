// Analytics dashboard (F13): totals, top-10 posts/pages by views and a
// server-rendered SVG chart of the last 7 days.
// Source: ai/requirements.md 350-356, :471.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { dailyViews, listViews, type ViewCount } from "@/lib/analytics.ts";
import { listAllPosts } from "@/lib/posts.ts";
import { listPages } from "@/lib/pages.ts";
import { listTags } from "@/lib/tags.ts";
import { DailyViewsChart } from "@/components/DailyViewsChart.tsx";
import type { Page, Post } from "@/types/index.ts";
import {
  ADMIN_CARD,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_SECTION,
  ADMIN_TYPE_STAT,
  ADMIN_TYPE_STAT_LABEL,
  AdminPage,
} from "@/components/AdminPage.tsx";

export interface TopEntry {
  title: string;
  views: number;
}

/** Join view counters with entity titles; deleted entities are skipped. */
function topTitles(
  views: ViewCount[],
  entities: (Post | Page)[],
  limit: number,
): TopEntry[] {
  return views
    .flatMap((count) => {
      const entity = entities.find((e) => e.id === count.id);
      return entity ? [{ title: entity.title, views: count.views }] : [];
    })
    .slice(0, limit);
}

export const handler = define.handlers({
  async GET() {
    const [posts, pages, tags, postViews, pageViews, daily] = await Promise
      .all([
        listAllPosts(),
        listPages(),
        listTags(),
        listViews("post"),
        listViews("page"),
        dailyViews(7),
      ]);
    return {
      data: {
        postCount: posts.length,
        pageCount: pages.length,
        tagCount: tags.length,
        totalViews: [...postViews, ...pageViews].reduce(
          (sum, entry) => sum + entry.views,
          0,
        ),
        topPosts: topTitles(postViews, posts, 10),
        topPages: topTitles(pageViews, pages, 10),
        daily,
      },
    };
  },
});

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div class={ADMIN_CARD}>
      <p class={ADMIN_TYPE_STAT_LABEL}>{label}</p>
      <p class={`${ADMIN_TYPE_STAT} mt-1`}>{value}</p>
    </div>
  );
}

function TopList({ title, entries }: { title: string; entries: TopEntry[] }) {
  return (
    <div class={`${ADMIN_CARD} flex-1 min-w-64`}>
      <h2 class={`${ADMIN_TYPE_CARD_TITLE} mb-3`}>{title}</h2>
      {entries.length === 0
        ? <p class={ADMIN_TYPE_MUTED}>No views yet.</p>
        : (
          <ol class="space-y-1">
            {entries.map((entry, index) => (
              <li
                key={entry.title + index}
                class="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 py-1"
              >
                <span class="truncate mr-4">
                  {index + 1}. {entry.title}
                </span>
                <span class="text-gray-500 shrink-0">{entry.views}</span>
              </li>
            ))}
          </ol>
        )}
    </div>
  );
}

export default define.page<typeof handler>(function AnalyticsPage({ data }) {
  return (
    <AdminPage title="Analytics">
      <Head>
        <title>Analytics - Admin</title>
      </Head>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Posts" value={data.postCount} />
        <StatCard label="Pages" value={data.pageCount} />
        <StatCard label="Tags" value={data.tagCount} />
        <StatCard label="Total views" value={data.totalViews} />
      </div>
      <h2 class={`${ADMIN_TYPE_SECTION} mb-3`}>Views, last 7 days</h2>
      <div class={`${ADMIN_CARD} mb-10`}>
        <DailyViewsChart days={data.daily} />
      </div>
      <div class="flex flex-wrap gap-6">
        <TopList title="Top posts" entries={data.topPosts} />
        <TopList title="Top pages" entries={data.topPages} />
      </div>
    </AdminPage>
  );
});
