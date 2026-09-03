// Post editor: "Edit" tab (grouped form) + "History" tab (F8).
// Source: ai/requirements.md F1, F8, UI rules 5.1.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getPostById, type PostInput } from "@/lib/posts.ts";
import {
  deletePost,
  publishPost,
  unpublishPost,
  updatePost,
} from "@/lib/post-mutations.ts";
import { listVersions } from "@/lib/versions.ts";
import { PostForm } from "@/components/PostForm.tsx";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import { formatDateTime } from "@/utils/date.ts";
import { slugify } from "@/utils/slugify.ts";
import type { Post, PostSnapshot } from "@/types/index.ts";
import {
  ADMIN_BTN_ROW,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD,
  ADMIN_TABLE,
  ADMIN_TABLE_WRAP,
  ADMIN_TD,
  ADMIN_TD_MUTED,
  ADMIN_TH,
  ADMIN_THEAD,
  ADMIN_TITLE_LINK,
  ADMIN_TR,
  ADMIN_TYPE_BACK,
  ADMIN_TYPE_BADGE,
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_PAGE_TITLE,
} from "@/components/AdminPage.tsx";

interface EditorData {
  post: Post;
  tab: "edit" | "history";
  versions: PostSnapshot[];
  error: string | null;
}

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

function parseTags(raw: string): string[] {
  return raw.split(",").map((t) => slugify(t.trim())).filter(Boolean);
}

function parsePostInput(form: FormData): PostInput {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  return {
    title: get("title"),
    slug: get("slug"),
    content: String(form.get("content") ?? ""),
    excerpt: get("excerpt"),
    status: get("status") === "scheduled" ? "scheduled" : "draft",
    tags: parseTags(get("tags")),
    template: get("template") === "full-width" ? "full-width" : "default",
    publishedAt: toIso(get("publishedAt")),
    metaTitle: get("metaTitle"),
    metaDescription: get("metaDescription"),
    canonicalUrl: get("canonicalUrl"),
  };
}

async function handleSimpleAction(
  action: string,
  id: string,
): Promise<Response> {
  if (action === "delete") {
    await deletePost(id);
    return new Response(null, {
      status: 303,
      headers: { location: "/admin/posts" },
    });
  }
  await unpublishPost(id);
  return new Response(null, {
    status: 303,
    headers: { location: `/admin/posts/${id}` },
  });
}

export const handler = define.handlers({
  async GET(ctx) {
    const post = await getPostById(ctx.params.id);
    if (!post) throw new HttpError(404);
    const tab = ctx.url.searchParams.get("tab") === "history"
      ? "history"
      : "edit";
    const versions = tab === "history" ? await listVersions(post.id) : [];
    return { data: { post, tab, versions, error: null } };
  },

  async POST(ctx) {
    const id = ctx.params.id;
    const post = await getPostById(id);
    if (!post) throw new HttpError(404);
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "save");
    if (action === "delete" || action === "unpublish") {
      return await handleSimpleAction(action, id);
    }

    const saved = await updatePost(id, parsePostInput(form));
    if (!saved.ok) {
      return {
        data: { post, tab: "edit" as const, versions: [], error: saved.error },
      };
    }
    if (action === "publish") {
      const published = await publishPost(id);
      if (!published.ok) {
        return {
          data: {
            post: saved.post,
            tab: "edit" as const,
            versions: [],
            error: published.error,
          },
        };
      }
    }
    return ctx.redirect(`/admin/posts/${id}`);
  },
});

function statusTone(status: Post["status"]): string {
  if (status === "published") {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  }
  if (status === "scheduled") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

function HistoryTable(
  { post, versions }: { post: Post; versions: PostSnapshot[] },
) {
  if (versions.length === 0) {
    return (
      <div class={ADMIN_CARD}>
        <p class={ADMIN_TYPE_MUTED}>No published versions yet.</p>
      </div>
    );
  }
  const options = versions.map((v) => (
    <option key={v.versionId} value={v.versionId}>
      {formatDateTime(v.versionId)} - {v.title}
    </option>
  ));
  return (
    <div class="space-y-6">
      <div class={ADMIN_CARD}>
        <form
          method="get"
          action={`/admin/posts/${post.id}/versions/diff`}
          class="flex flex-wrap items-center gap-2"
        >
          <select name="left" class={ADMIN_BTN_ROW}>
            {options}
          </select>
          <span class={ADMIN_TYPE_MUTED}>&harr;</span>
          <select name="right" class={ADMIN_BTN_ROW}>
            {options}
          </select>
          <button type="submit" class={ADMIN_BTN_ROW}>
            Compare
          </button>
        </form>
      </div>
      <div class={ADMIN_TABLE_WRAP}>
        <table class={ADMIN_TABLE}>
          <thead>
            <tr class={ADMIN_THEAD}>
              <th class={ADMIN_TH}>Published at</th>
              <th class={ADMIN_TH}>Title</th>
              <th class={ADMIN_TH}>Tags</th>
              <th class={ADMIN_TH}></th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.versionId} class={ADMIN_TR}>
                <td class={`${ADMIN_TD_MUTED} whitespace-nowrap`}>
                  {formatDateTime(v.versionId)}
                </td>
                <td class={ADMIN_TD}>{v.title}</td>
                <td class={ADMIN_TD_MUTED}>{v.tags.join(", ")}</td>
                <td class={ADMIN_TD}>
                  <a
                    href={`/admin/posts/${post.id}/versions/${v.versionId}`}
                    class={ADMIN_TITLE_LINK}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default define.page<typeof handler>(function PostEditor({ data }) {
  const { post, tab, versions, error } = data;
  const tabCls = (active: boolean) =>
    `px-3 py-2 rounded-md ${ADMIN_TYPE_BODY} ${
      active
        ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-medium"
        : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;
  return (
    <div class="w-full px-6 py-8 lg:px-10">
      <Head>
        <title>Edit: {post.title} - Admin</title>
      </Head>

      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div class="min-w-0">
          <a href="/admin/posts" class={ADMIN_TYPE_BACK}>
            &larr; All posts
          </a>
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <h1 class={`${ADMIN_TYPE_PAGE_TITLE} truncate`}>{post.title}</h1>
            <span class={`${ADMIN_TYPE_BADGE} ${statusTone(post.status)}`}>
              {post.status}
            </span>
          </div>
          <p class={`${ADMIN_TYPE_MUTED} mt-1`}>/{post.slug}</p>
        </div>
        <nav class="flex gap-1 p-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <a href={`/admin/posts/${post.id}`} class={tabCls(tab === "edit")}>
            Edit
          </a>
          <a
            href={`/admin/posts/${post.id}?tab=history`}
            class={tabCls(tab === "history")}
          >
            History
          </a>
        </nav>
      </div>

      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}

      {tab === "edit"
        ? (
          <>
            <PostForm post={post} />
            <div
              class={`${ADMIN_CARD} flex flex-wrap items-center gap-2 mt-6`}
            >
              {post.status === "published" && (
                <form method="post">
                  <input type="hidden" name="action" value="unpublish" />
                  <button type="submit" class={ADMIN_BTN_SECONDARY}>
                    Unpublish
                  </button>
                </form>
              )}
              <ConfirmDeleteTrigger itemName={post.title} />
            </div>
          </>
        )
        : <HistoryTable post={post} versions={versions} />}
    </div>
  );
});
