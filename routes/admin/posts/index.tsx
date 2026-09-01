// Admin post list with click-to-sort columns (no drag-and-drop here).
// Source: ai/requirements.md F1 + UI 5.1 (post list uses click-to-sort).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { listAllPosts } from "@/lib/posts.ts";
import { createPost } from "@/lib/post-mutations.ts";
import type { Post } from "@/types/index.ts";
import { formatDateTime } from "@/utils/date.ts";

type SortKey = "title" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

function sortPosts(posts: Post[], key: SortKey, dir: SortDir): Post[] {
  const sign = dir === "asc" ? 1 : -1;
  return posts.sort((a, b) => sign * a[key].localeCompare(b[key]));
}

function sortHref(key: SortKey, current: SortKey, dir: SortDir): string {
  const nextDir: SortDir = current === key && dir === "asc" ? "desc" : "asc";
  return `/admin/posts?sort=${key}&dir=${nextDir}`;
}

export const handler = define.handlers({
  async GET(ctx) {
    const raw = ctx.url.searchParams.get("sort") ?? "updatedAt";
    const sort: SortKey = ["title", "status", "updatedAt"].includes(raw)
      ? raw as SortKey
      : "updatedAt";
    const dir: SortDir = ctx.url.searchParams.get("dir") === "asc"
      ? "asc"
      : "desc";
    return {
      data: { posts: sortPosts(await listAllPosts(), sort, dir), sort, dir },
    };
  },

  // "New post": create an empty draft and go straight to the editor.
  async POST(ctx) {
    const result = await createPost(
      { title: "Untitled" },
      ctx.state.user?.username ?? "admin",
    );
    if (!result.ok) throw new HttpError(500, result.error);
    return ctx.redirect(`/admin/posts/${result.post.id}`);
  },
});

export default define.page<typeof handler>(function PostList({ data }) {
  const { posts, sort, dir } = data;
  const arrow = (
    key: SortKey,
  ) => (sort === key ? (dir === "asc" ? " ↑" : " ↓") : "");
  return (
    <div class="px-4 py-8 mx-auto max-w-4xl">
      <Head>
        <title>Posts - Admin</title>
      </Head>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Posts</h1>
        <form method="post">
          <button
            type="submit"
            class="bg-gray-900 text-white rounded px-4 py-2 font-medium"
          >
            New post
          </button>
        </form>
      </div>
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b">
            <th class="py-2">
              <a href={sortHref("title", sort, dir)}>Title{arrow("title")}</a>
            </th>
            <th class="py-2">
              <a href={sortHref("status", sort, dir)}>
                Status{arrow("status")}
              </a>
            </th>
            <th class="py-2">
              <a href={sortHref("updatedAt", sort, dir)}>
                Updated{arrow("updatedAt")}
              </a>
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} class="border-b hover:bg-gray-50">
              <td class="py-2">
                <a href={`/admin/posts/${post.id}`} class="underline">
                  {post.title}
                </a>
              </td>
              <td class="py-2">
                <span class="text-xs uppercase tracking-wide bg-gray-200 rounded px-2 py-1">
                  {post.status}
                </span>
              </td>
              <td class="py-2 text-sm text-gray-600">
                {formatDateTime(post.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && (
        <p class="text-gray-600 mt-4">No posts yet. Create the first one.</p>
      )}
    </div>
  );
});
