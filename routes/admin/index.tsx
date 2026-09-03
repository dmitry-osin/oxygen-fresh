// Admin dashboard: content overview at a glance.
// Source: ai/requirements.md section 9 (routes/admin/index.tsx).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { listAllPosts } from "@/lib/posts.ts";
import { listPages } from "@/lib/pages.ts";
import { listTags } from "@/lib/tags.ts";
import { formatDateTime } from "@/utils/date.ts";
import type { Post } from "@/types/index.ts";
import {
  ADMIN_BTN_ROW,
  ADMIN_CARD,
  ADMIN_EMPTY,
  ADMIN_ROW_ACTIONS,
  ADMIN_SLUG_SUB,
  ADMIN_TABLE,
  ADMIN_TABLE_WRAP,
  ADMIN_TD,
  ADMIN_TD_ACTIONS,
  ADMIN_TD_MUTED,
  ADMIN_TH,
  ADMIN_TH_ACTIONS,
  ADMIN_THEAD,
  ADMIN_TITLE_LINK,
  ADMIN_TR,
  ADMIN_TYPE_BADGE,
  ADMIN_TYPE_SECTION,
  ADMIN_TYPE_STAT,
  ADMIN_TYPE_STAT_LABEL,
  AdminPage,
} from "@/components/AdminPage.tsx";

export const handler = define.handlers(async () => {
  const [posts, pages, tags] = await Promise.all([
    listAllPosts(),
    listPages(),
    listTags(),
  ]);
  return {
    data: {
      publishedCount: posts.filter((p) => p.status === "published").length,
      draftCount: posts.filter((p) => p.status !== "published").length,
      pageCount: pages.length,
      tagCount: tags.length,
      recent: posts.slice(0, 5),
    },
  };
});

function statusBadge(status: Post["status"]) {
  const tone = status === "published"
    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
    : status === "scheduled"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return <span class={`${ADMIN_TYPE_BADGE} ${tone}`}>{status}</span>;
}

export default define.page<typeof handler>(function Dashboard({ data }) {
  const stats = [
    { label: "Published posts", value: data.publishedCount },
    { label: "Drafts", value: data.draftCount },
    { label: "Pages", value: data.pageCount },
    { label: "Tags", value: data.tagCount },
  ];
  return (
    <AdminPage title="Dashboard">
      <Head>
        <title>Dashboard - Admin</title>
      </Head>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} class={ADMIN_CARD}>
            <p class={ADMIN_TYPE_STAT}>{stat.value}</p>
            <p class={`${ADMIN_TYPE_STAT_LABEL} mt-1`}>{stat.label}</p>
          </div>
        ))}
      </div>
      <h2 class={`${ADMIN_TYPE_SECTION} mb-3`}>Recently updated</h2>
      {data.recent.length === 0
        ? (
          <p class={ADMIN_EMPTY}>
            No posts yet.{" "}
            <a href="/admin/posts" class="underline">Create the first one</a>.
          </p>
        )
        : (
          <div class={ADMIN_TABLE_WRAP}>
            <table class={ADMIN_TABLE}>
              <thead>
                <tr class={ADMIN_THEAD}>
                  <th class={ADMIN_TH}>Title</th>
                  <th class={ADMIN_TH}>Status</th>
                  <th class={ADMIN_TH}>Updated</th>
                  <th class={ADMIN_TH_ACTIONS}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((post) => (
                  <tr key={post.id} class={ADMIN_TR}>
                    <td class={ADMIN_TD}>
                      <a
                        href={`/admin/posts/${post.id}`}
                        class={ADMIN_TITLE_LINK}
                      >
                        {post.title}
                      </a>
                      <p class={ADMIN_SLUG_SUB}>/{post.slug}</p>
                    </td>
                    <td class={ADMIN_TD}>{statusBadge(post.status)}</td>
                    <td class={`${ADMIN_TD_MUTED} whitespace-nowrap`}>
                      {formatDateTime(post.updatedAt)}
                    </td>
                    <td class={ADMIN_TD_ACTIONS}>
                      <div class={ADMIN_ROW_ACTIONS}>
                        <a
                          href={`/admin/posts/${post.id}`}
                          class={ADMIN_BTN_ROW}
                        >
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </AdminPage>
  );
});
