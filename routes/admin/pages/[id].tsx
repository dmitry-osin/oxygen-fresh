// Page editor chrome matching the Post editor (header + grouped form).
// Pages are always live once created; no draft/history tabs.
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
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import { PageForm } from "@/components/PageForm.tsx";
import {
  ADMIN_BTN_ROW,
  ADMIN_CARD,
  ADMIN_TYPE_BACK,
  ADMIN_TYPE_BADGE,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_PAGE_TITLE,
} from "@/components/AdminPage.tsx";

function parsePageInput(form: FormData): PageInput {
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const input: PageInput = {
    title: get("title"),
    slug: get("slug"),
    template: get("template") === "full-width" ? "full-width" : "default",
    showInMenu: form.get("showInMenu") === "on",
    menuOrder: Number.parseInt(get("menuOrder") || "0", 10) || 0,
    metaTitle: get("metaTitle"),
    metaDescription: get("metaDescription"),
  };
  if (form.has("content")) {
    input.content = String(form.get("content") ?? "");
  }
  return input;
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
  const menuTone = page.showInMenu
    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div class="w-full px-6 py-8 lg:px-10">
      <Head>
        <title>Edit page: {page.title} - Admin</title>
      </Head>

      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div class="min-w-0">
          <a href="/admin/pages" class={ADMIN_TYPE_BACK}>
            &larr; All pages
          </a>
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <h1 class={`${ADMIN_TYPE_PAGE_TITLE} truncate`}>{page.title}</h1>
            <span class={`${ADMIN_TYPE_BADGE} ${menuTone}`}>
              {page.showInMenu ? "in menu" : "hidden"}
            </span>
          </div>
          <p class={`${ADMIN_TYPE_MUTED} mt-1`}>/page/{page.slug}</p>
        </div>
        <a
          href={`/page/${page.slug}`}
          target="_blank"
          rel="noopener"
          class={ADMIN_BTN_ROW}
        >
          View
        </a>
      </div>

      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}

      <PageForm page={page} />

      <div class={`${ADMIN_CARD} flex flex-wrap items-center gap-2 mt-6`}>
        <ConfirmDeleteTrigger itemName={page.title} />
      </div>
    </div>
  );
});
