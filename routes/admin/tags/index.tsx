// Admin tag list with the same row chrome as Posts/Pages
// (name + slug, created, Edit / Delete). Create lives in the page header.
// Source: ai/requirements.md F3 (section 7.1).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { createTag, deleteTag, listTags } from "@/lib/tags.ts";
import { formatDateTime } from "@/utils/date.ts";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_ROW,
  ADMIN_EMPTY,
  ADMIN_INPUT,
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
  ADMIN_TYPE_ERROR,
  AdminPage,
} from "@/components/AdminPage.tsx";

export const handler = define.handlers({
  async GET() {
    return { data: { tags: await listTags(), error: null as string | null } };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "create");
    const slug = ctx.url.searchParams.get("slug") ??
      String(form.get("slug") ?? "");

    if (action === "delete" && slug) {
      await deleteTag(slug);
      return ctx.redirect("/admin/tags");
    }

    const name = String(form.get("name") ?? "");
    const result = await createTag({ name });
    if (!result.ok) {
      return { data: { tags: await listTags(), error: result.error } };
    }
    return ctx.redirect(`/admin/tags/${result.tag.slug}`);
  },
});

export default define.page<typeof handler>(function TagList({ data }) {
  const { tags, error } = data;
  return (
    <AdminPage
      title="Tags"
      description="Organize posts with reusable tags."
      actions={
        <form method="post" class="flex flex-wrap items-center gap-2">
          <input type="hidden" name="action" value="create" />
          <input
            name="name"
            type="text"
            required
            placeholder="New tag name"
            class={`${ADMIN_INPUT} w-48 sm:w-56`}
          />
          <button type="submit" class={ADMIN_BTN_PRIMARY}>Add tag</button>
        </form>
      }
    >
      <Head>
        <title>Tags - Admin</title>
      </Head>
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}
      <div class={ADMIN_TABLE_WRAP}>
        <table class={ADMIN_TABLE}>
          <thead>
            <tr class={ADMIN_THEAD}>
              <th class={ADMIN_TH}>Name</th>
              <th class={ADMIN_TH}>Created</th>
              <th class={ADMIN_TH_ACTIONS}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.slug} class={ADMIN_TR}>
                <td class={ADMIN_TD}>
                  <a
                    href={`/admin/tags/${tag.slug}`}
                    class={ADMIN_TITLE_LINK}
                  >
                    {tag.name}
                  </a>
                  <p class={ADMIN_SLUG_SUB}>/{tag.slug}</p>
                </td>
                <td class={`${ADMIN_TD_MUTED} whitespace-nowrap`}>
                  {formatDateTime(tag.createdAt)}
                </td>
                <td class={ADMIN_TD_ACTIONS}>
                  <div class={ADMIN_ROW_ACTIONS}>
                    <a
                      href={`/admin/tags/${tag.slug}`}
                      class={ADMIN_BTN_ROW}
                    >
                      Edit
                    </a>
                    <ConfirmDeleteTrigger
                      itemName={tag.name}
                      actionUrl={`/admin/tags?slug=${
                        encodeURIComponent(tag.slug)
                      }`}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tags.length === 0 && (
          <p class={ADMIN_EMPTY}>No tags yet. Add the first one.</p>
        )}
      </div>
    </AdminPage>
  );
});
