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
    <div class="border border-gray-200 dark:border-gray-700 rounded p-4">
      <p class="text-sm text-gray-500">{label}</p>
      <p class="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TopList({ title, entries }: { title: string; entries: TopEntry[] }) {
  return (
    <div class="flex-1 min-w-64">
      <h2 class="text-lg font-bold mb-3">{title}</h2>
      {entries.length === 0
        ? <p class="text-gray-500 text-sm">No views yet.</p>
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
    <div class="px-4 py-8 mx-auto max-w-5xl">
      <Head>
        <title>Analytics - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Analytics</h1>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Posts" value={data.postCount} />
        <StatCard label="Pages" value={data.pageCount} />
        <StatCard label="Tags" value={data.tagCount} />
        <StatCard label="Total views" value={data.totalViews} />
      </div>
      <h2 class="text-lg font-bold mb-3">Views, last 7 days</h2>
      <DailyViewsChart days={data.daily} />
      <div class="flex flex-wrap gap-10 mt-10">
        <TopList title="Top posts" entries={data.topPosts} />
        <TopList title="Top pages" entries={data.topPages} />
      </div>
    </div>
  );
});
