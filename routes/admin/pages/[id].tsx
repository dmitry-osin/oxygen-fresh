// Page editor. Pages are always published once created; no status/tags.
// Source: ai/requirements.md F2, UI rules 5.1.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import {
  deletePage,
  getPageById,
  type PageInput,
  updatePage,
} from "@/lib/pages.ts";
import ConfirmDelete from "@/islands/ConfirmDelete.tsx";
import SlugField from "@/islands/SlugField.tsx";

const inputCls = "w-full border border-gray-300 rounded px-3 py-2";
const labelCls = "block text-sm font-medium mb-1";

function parsePageInput(form: FormData): PageInput {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  return {
    title: get("title"),
    slug: get("slug"),
    content: String(form.get("content") ?? ""),
    template: get("template") === "full-width" ? "full-width" : "default",
    showInMenu: form.get("showInMenu") === "on",
    menuOrder: Number.parseInt(get("menuOrder") || "0", 10) || 0,
    metaTitle: get("metaTitle"),
    metaDescription: get("metaDescription"),
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const page = await getPageById(ctx.params.id);
    if (!page) throw new HttpError(404);
    return { data: { page, error: null as string | null } };
  },

  async POST(ctx) {
    const id = ctx.params.id;
    const page = await getPageById(id);
    if (!page) throw new HttpError(404);
    const form = await ctx.req.formData();
    if (String(form.get("action")) === "delete") {
      await deletePage(id);
      return ctx.redirect("/admin/pages");
    }
    const result = await updatePage(id, parsePageInput(form));
    if (!result.ok) return { data: { page, error: result.error } };
    return ctx.redirect(`/admin/pages/${id}`);
  },
});

export default define.page<typeof handler>(function PageEditor({ data }) {
  const { page, error } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Edit page: {page.title} - Admin</title>
      </Head>
      <p class="mb-4">
        <a href="/admin/pages" class="text-sm text-gray-600">
          &larr; All pages
        </a>
      </p>
      <h1 class="text-2xl font-bold mb-6">{page.title}</h1>
      {error && <p class="text-red-600 mb-4">{error}</p>}
      <form method="post" class="space-y-4">
        <div>
          <label class={labelCls} for="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={page.title}
            class={inputCls}
          />
        </div>
        <div>
          <label class={labelCls}>Slug</label>
          <SlugField
            initialValue={page.slug}
            excludeId={page.id}
            type="page"
          />
          <p class="text-amber-700 text-sm mt-1">
            Warning: changing the slug breaks existing URLs.
          </p>
        </div>
        <div>
          <label class={labelCls} for="content">Content (Markdown)</label>
          <textarea
            id="content"
            name="content"
            rows={18}
            class={`${inputCls} font-mono`}
          >
            {page.content}
          </textarea>
        </div>
        <div>
          <label class={labelCls} for="template">Template</label>
          <select id="template" name="template" class={inputCls}>
            <option value="default" selected={page.template === "default"}>
              default (with sidebar)
            </option>
            <option
              value="full-width"
              selected={page.template === "full-width"}
            >
              full-width
            </option>
          </select>
        </div>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showInMenu"
              checked={page.showInMenu}
            />
            Show in menu
          </label>
          <label class="flex items-center gap-2 text-sm">
            Menu order
            <input
              type="number"
              name="menuOrder"
              value={page.menuOrder}
              class="w-24 border border-gray-300 rounded px-3 py-2"
            />
          </label>
        </div>
        <div>
          <label class={labelCls} for="metaTitle">Meta title (SEO)</label>
          <input
            id="metaTitle"
            name="metaTitle"
            type="text"
            value={page.metaTitle ?? ""}
            class={inputCls}
          />
        </div>
        <div>
          <label class={labelCls} for="metaDescription">
            Meta description (SEO)
          </label>
          <textarea
            id="metaDescription"
            name="metaDescription"
            rows={2}
            class={inputCls}
          >
            {page.metaDescription ?? ""}
          </textarea>
        </div>
        <div class="flex gap-2 pt-2">
          <button
            type="submit"
            name="action"
            value="save"
            class="bg-gray-900 text-white rounded px-4 py-2 font-medium"
          >
            Save
          </button>
        </div>
      </form>
      <div class="mt-6 pt-6 border-t">
        <ConfirmDelete itemName={page.title} />
      </div>
    </div>
  );
});
