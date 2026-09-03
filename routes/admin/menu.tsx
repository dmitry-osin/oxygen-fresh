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
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_MUTED,
  AdminPage,
} from "@/components/AdminPage.tsx";

interface MenuData {
  items: MenuItem[];
  pages: Page[];
  posts: Post[];
  error: string | null;
}

const INPUT = ADMIN_INPUT;

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
    <AdminPage
      title="Menu"
      description="Drag items to reorder. Changes to order need Save order."
    >
      <Head>
        <title>Menu - Admin</title>
      </Head>
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}
      <div class={`${ADMIN_CARD} mb-8`}>
        <MenuBuilder items={items} />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class={ADMIN_CARD}>
          <h2 class={`${ADMIN_TYPE_CARD_TITLE} mb-3`}>Add page or post</h2>
          <form method="post" class="flex flex-col gap-3">
            <input type="hidden" name="action" value="add-internal" />
            <select name="target" required class={INPUT}>
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
              class={INPUT}
            />
            <button type="submit" class={`${ADMIN_BTN_PRIMARY} self-start`}>
              Add
            </button>
          </form>
        </section>
        <section class={ADMIN_CARD}>
          <h2 class={`${ADMIN_TYPE_CARD_TITLE} mb-3`}>Add external link</h2>
          <form method="post" class="flex flex-col gap-3">
            <input type="hidden" name="action" value="add-external" />
            <input
              name="url"
              type="text"
              required
              placeholder="https://example.com"
              class={INPUT}
            />
            <input
              name="label"
              type="text"
              required
              placeholder="Label"
              class={INPUT}
            />
            <button type="submit" class={`${ADMIN_BTN_PRIMARY} self-start`}>
              Add link
            </button>
          </form>
        </section>
      </div>
      {pages.length === 0 && posts.length === 0 && (
        <p class={`${ADMIN_TYPE_MUTED} mt-4`}>
          No pages or posts yet - create content first, or add an external link.
        </p>
      )}
    </AdminPage>
  );
});
