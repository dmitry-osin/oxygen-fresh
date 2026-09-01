// Admin page list. Source: ai/requirements.md F2.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { createPage, listPages } from "@/lib/pages.ts";
import { formatDateTime } from "@/utils/date.ts";

export const handler = define.handlers({
  async GET() {
    const pages = (await listPages()).sort(
      (a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title),
    );
    return { data: { pages } };
  },

  // "New page": create an empty page and go straight to the editor.
  async POST(ctx) {
    const result = await createPage({ title: "Untitled page" });
    if (!result.ok) throw new HttpError(500, result.error);
    return ctx.redirect(`/admin/pages/${result.page.id}`);
  },
});

export default define.page<typeof handler>(function PageList({ data }) {
  return (
    <div class="px-4 py-8 mx-auto max-w-4xl">
      <Head>
        <title>Pages - Admin</title>
      </Head>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Pages</h1>
        <form method="post">
          <button
            type="submit"
            class="bg-gray-900 text-white rounded px-4 py-2 font-medium"
          >
            New page
          </button>
        </form>
      </div>
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b">
            <th class="py-2">Title</th>
            <th class="py-2">Slug</th>
            <th class="py-2">In menu</th>
            <th class="py-2">Order</th>
            <th class="py-2">Updated</th>
          </tr>
        </thead>
        <tbody>
          {data.pages.map((page) => (
            <tr key={page.id} class="border-b hover:bg-gray-50">
              <td class="py-2">
                <a href={`/admin/pages/${page.id}`} class="underline">
                  {page.title}
                </a>
              </td>
              <td class="py-2 text-sm text-gray-600">/{page.slug}</td>
              <td class="py-2 text-sm">{page.showInMenu ? "yes" : "no"}</td>
              <td class="py-2 text-sm">{page.menuOrder}</td>
              <td class="py-2 text-sm text-gray-600">
                {formatDateTime(page.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.pages.length === 0 && (
        <p class="text-gray-600 mt-4">No pages yet. Create the first one.</p>
      )}
    </div>
  );
});
