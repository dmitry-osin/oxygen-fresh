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
import { listVersions, restoreVersionToPost } from "@/lib/versions.ts";
import { PostForm } from "@/components/PostForm.tsx";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import { formatDateTime } from "@/utils/date.ts";
import { slugify } from "@/utils/slugify.ts";
import type { Post, PostSnapshot, RedirectEntry } from "@/types/index.ts";
import {
  createPostShortLink,
  deletePostShortLink,
  findShortLinkForPost,
} from "@/lib/redirects.ts";
import {
  ADMIN_BTN_ROW,
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
  ADMIN_TYPE_SUCCESS,
} from "@/components/AdminPage.tsx";

interface EditorData {
  post: Post;
  tab: "edit" | "history";
  versions: PostSnapshot[];
  shortLink: RedirectEntry | null;
  error: string | null;
  notice: string | null;
}

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

function parseTags(raw: string): string[] {
  return raw.split(",").map((t) => slugify(t.trim())).filter(Boolean);
}

function parsePostInput(form: FormData): PostInput {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const statusRaw = get("status");
  const status: PostInput["status"] = statusRaw === "scheduled"
    ? "scheduled"
    : statusRaw === "published"
    ? "published"
    : "draft";
  const input: PostInput = {
    title: get("title"),
    slug: get("slug"),
    excerpt: get("excerpt"),
    status,
    tags: parseTags(get("tags")),
    template: get("template") === "full-width" ? "full-width" : "default",
    publishedAt: toIso(get("publishedAt")),
    metaTitle: get("metaTitle"),
    metaDescription: get("metaDescription"),
    canonicalUrl: get("canonicalUrl"),
  };
  // Only overwrite body when the editor field was actually posted.
  // A missing field used to become "" and wipe published content.
  if (form.has("content")) {
    input.content = String(form.get("content") ?? "");
  }
  return input;
}

async function handleSimpleAction(
  action: string,
  id: string,
  post: Post,
  form: FormData,
): Promise<Response | { data: EditorData } | null> {
  if (action === "delete") {
    await deletePost(id);
    return new Response(null, {
      status: 303,
      headers: { location: "/admin/posts" },
    });
  }
  if (action === "unpublish") {
    await unpublishPost(id);
    return new Response(null, {
      status: 303,
      headers: { location: `/admin/posts/${id}` },
    });
  }
  if (action === "create-short") {
    if (post.status === "published") {
      await createPostShortLink(post.id, post.slug);
    }
    return new Response(null, {
      status: 303,
      headers: { location: `/admin/posts/${id}` },
    });
  }
  if (action === "delete-short") {
    await deletePostShortLink(id);
    return new Response(null, {
      status: 303,
      headers: { location: `/admin/posts/${id}` },
    });
  }
  if (action === "restore-version") {
    const versionId = String(form.get("versionId") ?? "");
    const restored = await restoreVersionToPost(id, versionId);
    if (!restored.ok) {
      return {
        data: {
          post,
          tab: "history",
          versions: await listVersions(id),
          shortLink: await findShortLinkForPost(id),
          error: restored.error,
          notice: null,
        },
      };
    }
    return new Response(null, {
      status: 303,
      headers: { location: `/admin/posts/${id}?restored=1` },
    });
  }
  return null;
}

export const handler = define.handlers({
  async GET(ctx) {
    const post = await getPostById(ctx.params.id);
    if (!post) throw new HttpError(404);
    const tab = ctx.url.searchParams.get("tab") === "history"
      ? "history"
      : "edit";
    const [versions, shortLink] = await Promise.all([
      tab === "history" ? listVersions(post.id) : Promise.resolve([]),
      findShortLinkForPost(post.id),
    ]);
    const restored = ctx.url.searchParams.get("restored") === "1";
    return {
      data: {
        post,
        tab,
        versions,
        shortLink,
        error: null,
        notice: restored
          ? "Version restored into this post. Review and save/publish as needed."
          : null,
      },
    };
  },

  async POST(ctx) {
    const id = ctx.params.id;
    const post = await getPostById(id);
    if (!post) throw new HttpError(404);
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "save");
    const simple = await handleSimpleAction(action, id, post, form);
    if (simple) return simple;

    const saved = await updatePost(id, parsePostInput(form));
    if (!saved.ok) {
      return {
        data: {
          post,
          tab: "edit" as const,
          versions: [],
          shortLink: await findShortLinkForPost(id),
          error: saved.error,
          notice: null,
        },
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
            shortLink: await findShortLinkForPost(id),
            error: published.error,
            notice: null,
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
                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <a
                      href={`/admin/posts/${post.id}/versions/${v.versionId}`}
                      class={ADMIN_TITLE_LINK}
                    >
                      View
                    </a>
                    <ConfirmDeleteTrigger
                      itemName={`${formatDateTime(v.versionId)} — ${v.title}`}
                      action="restore-version"
                      versionId={v.versionId}
                      label="Restore"
                      size="sm"
                      confirmTone="primary"
                      confirmLabel="Restore"
                      confirmMessage="This replaces the current title, body, intro and tags with this version. The URL slug and publish status stay the same."
                    />
                  </div>
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
  const { post, tab, versions, shortLink, error, notice } = data;
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

      {notice && <p class={`${ADMIN_TYPE_SUCCESS} mb-4`}>{notice}</p>}
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}

      {tab === "edit"
        ? <PostForm post={post} shortLink={shortLink} />
        : <HistoryTable post={post} versions={versions} />}
    </div>
  );
});
