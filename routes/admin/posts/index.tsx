// Admin post list with click-to-sort columns and per-row actions
// (edit, publish/unpublish, view, delete with confirmation).
// Source: ai/requirements.md F1 + UI 5.1 (post list uses click-to-sort).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { listAllPostSummaries } from "@/lib/posts.ts";
import {
  createPost,
  deletePost,
  publishPost,
  unpublishPost,
} from "@/lib/post-mutations.ts";
import type { Post } from "@/types/index.ts";
import { formatDateTime } from "@/utils/date.ts";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_ROW,
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
  AdminPage,
} from "@/components/AdminPage.tsx";

type SortKey = "title" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

function sortPosts(
  posts: Omit<Post, "content">[],
  key: SortKey,
  dir: SortDir,
): Omit<Post, "content">[] {
  const sign = dir === "asc" ? 1 : -1;
  return posts.sort((a, b) => sign * a[key].localeCompare(b[key]));
}

function sortHref(key: SortKey, current: SortKey, dir: SortDir): string {
  const nextDir: SortDir = current === key && dir === "asc" ? "desc" : "asc";
  return `/admin/posts?sort=${key}&dir=${nextDir}`;
}

function listRedirect(url: URL): Response {
  const next = new URLSearchParams();
  const sort = url.searchParams.get("sort");
  const dir = url.searchParams.get("dir");
  if (sort) next.set("sort", sort);
  if (dir) next.set("dir", dir);
  const qs = next.toString();
  return new Response(null, {
    status: 303,
    headers: { location: qs ? `/admin/posts?${qs}` : "/admin/posts" },
  });
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
      data: {
        posts: sortPosts(await listAllPostSummaries(), sort, dir),
        sort,
        dir,
      },
    };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "create");
    const id = ctx.url.searchParams.get("id") ?? String(form.get("id") ?? "");

    if (action === "create") {
      const result = await createPost(
        { title: "Untitled" },
        ctx.state.user?.username ?? "admin",
      );
      if (!result.ok) throw new HttpError(500, result.error);
      return ctx.redirect(`/admin/posts/${result.post.id}?new=1`);
    }

    if (!id) return listRedirect(ctx.url);
    if (action === "publish") await publishPost(id);
    else if (action === "unpublish") await unpublishPost(id);
    else if (action === "delete") await deletePost(id);
    return listRedirect(ctx.url);
  },
});

function statusBadge(status: Post["status"]) {
  const tone = status === "published"
    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
    : status === "scheduled"
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return <span class={`${ADMIN_TYPE_BADGE} ${tone}`}>{status}</span>;
}

export default define.page<typeof handler>(function PostList({ data }) {
  const { posts, sort, dir } = data;
  const arrow = (
    key: SortKey,
  ) => (sort === key ? (dir === "asc" ? " ↑" : " ↓") : "");
  return (
    <AdminPage
      title="Posts"
      actions={
        <form method="post">
          <input type="hidden" name="action" value="create" />
          <button type="submit" class={ADMIN_BTN_PRIMARY}>New post</button>
        </form>
      }
    >
      <Head>
        <title>Posts - Admin</title>
      </Head>
      <div class={ADMIN_TABLE_WRAP}>
        <table class={ADMIN_TABLE}>
          <thead>
            <tr class={ADMIN_THEAD}>
              <th class={ADMIN_TH}>
                <a href={sortHref("title", sort, dir)}>Title{arrow("title")}</a>
              </th>
              <th class={ADMIN_TH}>
                <a href={sortHref("status", sort, dir)}>
                  Status{arrow("status")}
                </a>
              </th>
              <th class={ADMIN_TH}>
                <a href={sortHref("updatedAt", sort, dir)}>
                  Updated{arrow("updatedAt")}
                </a>
              </th>
              <th class={ADMIN_TH_ACTIONS}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
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
                    {post.status === "published"
                      ? (
                        <>
                          <a
                            href={`/${post.slug}`}
                            target="_blank"
                            rel="noopener"
                            class={ADMIN_BTN_ROW}
                          >
                            View
                          </a>
                          <form method="post">
                            <input type="hidden" name="id" value={post.id} />
                            <input
                              type="hidden"
                              name="action"
                              value="unpublish"
                            />
                            <button type="submit" class={ADMIN_BTN_ROW}>
                              Unpublish
                            </button>
                          </form>
                        </>
                      )
                      : (
                        <form method="post">
                          <input type="hidden" name="id" value={post.id} />
                          <input type="hidden" name="action" value="publish" />
                          <button type="submit" class={ADMIN_BTN_ROW}>
                            Publish
                          </button>
                        </form>
                      )}
                    <ConfirmDeleteTrigger
                      itemName={post.title}
                      actionUrl={`/admin/posts?id=${
                        encodeURIComponent(post.id)
                      }`}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p class={ADMIN_EMPTY}>No posts yet. Create the first one.</p>
        )}
      </div>
    </AdminPage>
  );
});
