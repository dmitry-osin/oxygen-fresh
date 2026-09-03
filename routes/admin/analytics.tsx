// Analytics dashboard (F13): totals, top-10 posts/pages by views and a
// server-rendered SVG chart of the last 7 days.
// Source: ai/requirements.md 350-356, :471.
//
// Counts come from id lists; titles for the top-N only from summary keys —
// not a full content catalog.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { kv, KvKeys } from "@/lib/kv.ts";
import { dailyViews, listViews, type ViewCount } from "@/lib/analytics.ts";
import { getPostSummary } from "@/lib/posts.ts";
import { getPageSummary } from "@/lib/pages.ts";
import { listTags } from "@/lib/tags.ts";
import { DailyViewsChart } from "@/components/DailyViewsChart.tsx";
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

/** Resolve titles for the highest-view entities; skip deleted ids. */
async function topTitles(
  views: ViewCount[],
  getTitle: (id: string) => Promise<string | null>,
  limit: number,
): Promise<TopEntry[]> {
  const entries: TopEntry[] = [];
  let offset = 0;
  while (entries.length < limit && offset < views.length) {
    const need = Math.max(limit - entries.length, 4);
    const batch = views.slice(offset, offset + need);
    offset += batch.length;
    const titles = await Promise.all(batch.map((row) => getTitle(row.id)));
    for (let i = 0; i < batch.length; i++) {
      const title = titles[i];
      if (!title) continue;
      entries.push({ title, views: batch[i].views });
      if (entries.length >= limit) break;
    }
  }
  return entries;
}

export const handler = define.handlers({
  async GET() {
    const [postIds, pageIds, tags, postViews, pageViews, daily] = await Promise
      .all([
        kv.get<string[]>(KvKeys.postIds()),
        kv.get<string[]>(KvKeys.pageIds()),
        listTags(),
        listViews("post"),
        listViews("page"),
        dailyViews(7),
      ]);
    const [topPosts, topPages] = await Promise.all([
      topTitles(
        postViews,
        async (id) => (await getPostSummary(id))?.title ?? null,
        10,
      ),
      topTitles(
        pageViews,
        async (id) => (await getPageSummary(id))?.title ?? null,
        10,
      ),
    ]);
    return {
      data: {
        postCount: postIds.value?.length ?? 0,
        pageCount: pageIds.value?.length ?? 0,
        tagCount: tags.length,
        totalViews: [...postViews, ...pageViews].reduce(
          (sum, entry) => sum + entry.views,
          0,
        ),
        topPosts,
        topPages,
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
