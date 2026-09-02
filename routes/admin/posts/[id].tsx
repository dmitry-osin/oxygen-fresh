// Post editor: "Edit" tab (all fields visible) + "History" tab (F8).
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
import ConfirmDelete from "@/islands/ConfirmDelete.tsx";
import { formatDateTime } from "@/utils/date.ts";
import { slugify } from "@/utils/slugify.ts";
import type { Post, PostSnapshot } from "@/types/index.ts";

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

function HistoryTable(
  { post, versions }: { post: Post; versions: PostSnapshot[] },
) {
  if (versions.length === 0) {
    return <p class="text-gray-600">No published versions yet.</p>;
  }
  const options = versions.map((v) => (
    <option key={v.versionId} value={v.versionId}>
      {formatDateTime(v.versionId)} - {v.title}
    </option>
  ));
  return (
    <div>
      <form
        method="get"
        action={`/admin/posts/${post.id}/versions/diff`}
        class="flex flex-wrap items-center gap-2 mb-6"
      >
        <select
          name="left"
          class="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {options}
        </select>
        <span class="text-sm text-gray-500">&harr;</span>
        <select
          name="right"
          class="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {options}
        </select>
        <button
          type="submit"
          class="border border-gray-300 rounded px-3 py-1 text-sm font-medium"
        >
          Compare
        </button>
      </form>
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b">
            <th class="py-2">Published at</th>
            <th class="py-2">Title</th>
            <th class="py-2">Tags</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.versionId} class="border-b">
              <td class="py-2 text-sm text-gray-600">
                {formatDateTime(v.versionId)}
              </td>
              <td class="py-2">{v.title}</td>
              <td class="py-2 text-sm text-gray-600">{v.tags.join(", ")}</td>
              <td class="py-2">
                <a
                  href={`/admin/posts/${post.id}/versions/${v.versionId}`}
                  class="underline text-sm"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default define.page<typeof handler>(function PostEditor({ data }) {
  const { post, tab, versions, error } = data;
  const tabCls = (active: boolean) =>
    `pb-2 ${
      active ? "border-b-2 border-gray-900 font-medium" : "text-gray-600"
    }`;
  return (
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Edit: {post.title} - Admin</title>
      </Head>
      <p class="mb-4">
        <a href="/admin/posts" class="text-sm text-gray-600">
          &larr; All posts
        </a>
      </p>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">{post.title}</h1>
        <span class="text-xs uppercase tracking-wide bg-gray-200 rounded px-2 py-1">
          {post.status}
        </span>
      </div>
      {error && <p class="text-red-600 mb-4">{error}</p>}
      <nav class="flex gap-4 border-b mb-6">
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
      {tab === "edit"
        ? (
          <>
            <PostForm post={post} />
            <div class="flex gap-2 mt-6 pt-6 border-t">
              {post.status === "published" && (
                <form method="post">
                  <input type="hidden" name="action" value="unpublish" />
                  <button
                    type="submit"
                    class="border border-gray-300 rounded px-4 py-2"
                  >
                    Unpublish
                  </button>
                </form>
              )}
              <ConfirmDelete itemName={post.title} />
            </div>
          </>
        )
        : <HistoryTable post={post} versions={versions} />}
    </div>
  );
});
