// Admin dashboard: content overview at a glance.
// Source: ai/requirements.md section 9 (routes/admin/index.tsx).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { listAllPosts } from "@/lib/posts.ts";
import { listPages } from "@/lib/pages.ts";
import { listTags } from "@/lib/tags.ts";
import { formatDateTime } from "@/utils/date.ts";

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

export default define.page<typeof handler>(function Dashboard({ data }) {
  const stats = [
    { label: "Published posts", value: data.publishedCount },
    { label: "Drafts", value: data.draftCount },
    { label: "Pages", value: data.pageCount },
    { label: "Tags", value: data.tagCount },
  ];
  return (
    <div class="px-8 py-8 max-w-4xl">
      <Head>
        <title>Dashboard - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
          >
            <p class="text-3xl font-bold">{stat.value}</p>
            <p class="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <h2 class="text-lg font-bold mb-2">Recently updated</h2>
      {data.recent.length === 0
        ? (
          <p class="text-gray-600 dark:text-gray-400">
            No posts yet.{" "}
            <a href="/admin/posts" class="underline">Create the first one</a>.
          </p>
        )
        : (
          <ul class="divide-y divide-gray-100 dark:divide-gray-800">
            {data.recent.map((post) => (
              <li key={post.id} class="py-2 flex justify-between">
                <a href={`/admin/posts/${post.id}`} class="underline">
                  {post.title}
                </a>
                <span class="text-sm text-gray-500">
                  {formatDateTime(post.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
});
