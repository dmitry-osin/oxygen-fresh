// Menu builder page (F6): drag-and-drop list (MenuBuilder island) plus
// server-rendered forms to add items (page / post / external) and a
// POST handler for add / delete / reorder actions.
// Source: ai/requirements.md 5.1 (drag handles), F6, :469.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  addMenuItem,
  deleteMenuItem,
  getMenuItems,
  reorderMenuItems,
} from "@/lib/menu.ts";
import { getPageBySlug, listPages } from "@/lib/pages.ts";
import { getPublishedBySlug, listPublishedPosts } from "@/lib/posts.ts";
import MenuBuilder from "@/islands/MenuBuilder.tsx";
import type { MenuItem, Page, Post } from "@/types/index.ts";

interface MenuData {
  items: MenuItem[];
  pages: Page[];
  posts: Post[];
  error: string | null;
}

const INPUT =
  "border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded px-3 py-2";

async function menuData(error: string | null): Promise<MenuData> {
  const [items, pages, posts] = await Promise.all([
    getMenuItems(),
    listPages(),
    listPublishedPosts(),
  ]);
  return { items, pages, posts, error };
}

/** Resolve "page:slug" / "post:slug" to a title for the default label. */
async function internalTitle(value: string): Promise<string | null> {
  const separator = value.indexOf(":");
  if (separator === -1) return null;
  const kind = value.slice(0, separator);
  const slug = value.slice(separator + 1);
  if (kind === "page") return (await getPageBySlug(slug))?.title ?? null;
  if (kind === "post") return (await getPublishedBySlug(slug))?.title ?? null;
  return null;
}

export const handler = define.handlers({
  async GET() {
    return { data: await menuData(null) };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");
    const error = await applyAction(action, form, ctx.url);
    if (error) return { data: await menuData(error) };
    return ctx.redirect("/admin/menu");
  },
});

async function applyAction(
  action: string,
  form: FormData,
  url: URL,
): Promise<string | null> {
  switch (action) {
    case "add-internal":
      return await addInternal(form);
    case "add-external":
      return await addExternal(form);
    case "delete":
      await deleteMenuItem(url.searchParams.get("id") ?? "");
      return null;
    case "reorder":
      return await reorder(form);
    default:
      return "Unknown action.";
  }
}

async function addInternal(form: FormData): Promise<string | null> {
  const value = String(form.get("target") ?? "");
  const title = await internalTitle(value);
  if (!title) return "Selected page or post no longer exists.";
  const label = String(form.get("label") ?? "").trim() || title;
  const separator = value.indexOf(":");
  await addMenuItem({
    type: value.slice(0, separator) as MenuItem["type"],
    label,
    target: value.slice(separator + 1),
  });
  return null;
}

async function addExternal(form: FormData): Promise<string | null> {
  const target = String(form.get("url") ?? "").trim();
  const label = String(form.get("label") ?? "").trim();
  if (!/^https?:\/\//.test(target)) {
    return "External link must start with http:// or https://.";
  }
  if (!label) return "Label is required.";
  await addMenuItem({ type: "external", label, target });
  return null;
}

async function reorder(form: FormData): Promise<string | null> {
  let ids: unknown;
  try {
    ids = JSON.parse(String(form.get("order") ?? "[]"));
  } catch {
    return "Malformed order payload.";
  }
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return "Malformed order payload.";
  }
  await reorderMenuItems(ids);
  return null;
}

export default define.page<typeof handler>(function MenuPage({ data }) {
  const { items, pages, posts, error } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Menu - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Menu</h1>
      {error && <p class="text-red-600 mb-4">{error}</p>}
      <MenuBuilder items={items} />

      <h2 class="text-lg font-bold mt-10 mb-3">Add menu item</h2>
      <form method="post" class="flex flex-wrap gap-2 mb-4">
        <input type="hidden" name="action" value="add-internal" />
        <select name="target" required class={`${INPUT} flex-1 min-w-48`}>
          <optgroup label="Pages">
            {pages.map((page) => (
              <option key={page.id} value={`page:${page.slug}`}>
                {page.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Posts">
            {posts.map((post) => (
              <option key={post.id} value={`post:${post.slug}`}>
                {post.title}
              </option>
            ))}
          </optgroup>
        </select>
        <input
          name="label"
          type="text"
          placeholder="Label (defaults to title)"
          class={`${INPUT} flex-1 min-w-48`}
        />
        <button
          type="submit"
          class="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium dark:bg-gray-100 dark:text-gray-900"
        >
          Add
        </button>
      </form>
      <form method="post" class="flex flex-wrap gap-2">
        <input type="hidden" name="action" value="add-external" />
        <input
          name="url"
          type="text"
          required
          placeholder="https://example.com"
          class={`${INPUT} flex-1 min-w-48`}
        />
        <input
          name="label"
          type="text"
          required
          placeholder="Label"
          class={`${INPUT} flex-1 min-w-32`}
        />
        <button
          type="submit"
          class="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium dark:bg-gray-100 dark:text-gray-900"
        >
          Add link
        </button>
      </form>
      {pages.length === 0 && posts.length === 0 && (
        <p class="text-sm text-gray-500 mt-3">
          No pages or posts yet - create content first, or add an external link.
        </p>
      )}
    </div>
  );
});
