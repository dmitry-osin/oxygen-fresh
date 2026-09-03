// Admin page list — same chrome as Posts, with In-menu status badges.
// Source: ai/requirements.md F2.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { createPage, deletePage, listPageSummaries } from "@/lib/pages.ts";
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

export const handler = define.handlers({
  async GET() {
    const pages = (await listPageSummaries()).sort(
      (a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title),
    );
    return { data: { pages } };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "create");
    const id = ctx.url.searchParams.get("id") ?? String(form.get("id") ?? "");

    if (action === "create") {
      const result = await createPage({ title: "Untitled page" });
      if (!result.ok) throw new HttpError(500, result.error);
      return ctx.redirect(`/admin/pages/${result.page.id}?new=1`);
    }

    if (action === "delete" && id) await deletePage(id);
    return ctx.redirect("/admin/pages");
  },
});

function menuBadge(showInMenu: boolean) {
  const tone = showInMenu
    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span class={`${ADMIN_TYPE_BADGE} ${tone}`}>
      {showInMenu ? "in menu" : "hidden"}
    </span>
  );
}

export default define.page<typeof handler>(function PageList({ data }) {
  return (
    <AdminPage
      title="Pages"
      actions={
        <form method="post">
          <input type="hidden" name="action" value="create" />
          <button type="submit" class={ADMIN_BTN_PRIMARY}>New page</button>
        </form>
      }
    >
      <Head>
        <title>Pages - Admin</title>
      </Head>
      <div class={ADMIN_TABLE_WRAP}>
        <table class={ADMIN_TABLE}>
          <thead>
            <tr class={ADMIN_THEAD}>
              <th class={ADMIN_TH}>Title</th>
              <th class={ADMIN_TH}>In menu</th>
              <th class={ADMIN_TH}>Order</th>
              <th class={ADMIN_TH}>Updated</th>
              <th class={ADMIN_TH_ACTIONS}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.pages.map((page) => (
              <tr key={page.id} class={ADMIN_TR}>
                <td class={ADMIN_TD}>
                  <a
                    href={`/admin/pages/${page.id}`}
                    class={ADMIN_TITLE_LINK}
                  >
                    {page.title}
                  </a>
                  <p class={ADMIN_SLUG_SUB}>/{page.slug}</p>
                </td>
                <td class={ADMIN_TD}>{menuBadge(page.showInMenu)}</td>
                <td class={ADMIN_TD}>{page.menuOrder}</td>
                <td class={`${ADMIN_TD_MUTED} whitespace-nowrap`}>
                  {formatDateTime(page.updatedAt)}
                </td>
                <td class={ADMIN_TD_ACTIONS}>
                  <div class={ADMIN_ROW_ACTIONS}>
                    <a
                      href={`/admin/pages/${page.id}`}
                      class={ADMIN_BTN_ROW}
                    >
                      Edit
                    </a>
                    <a
                      href={`/page/${page.slug}`}
                      target="_blank"
                      rel="noopener"
                      class={ADMIN_BTN_ROW}
                    >
                      View
                    </a>
                    <ConfirmDeleteTrigger
                      itemName={page.title}
                      actionUrl={`/admin/pages?id=${
                        encodeURIComponent(page.id)
                      }`}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.pages.length === 0 && (
          <p class={ADMIN_EMPTY}>No pages yet. Create the first one.</p>
        )}
      </div>
    </AdminPage>
  );
});
