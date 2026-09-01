// Admin tag list with inline create form.
// Source: ai/requirements.md F3 (section 7.1).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { createTag, listTags } from "@/lib/tags.ts";
import ConfirmDelete from "@/islands/ConfirmDelete.tsx";

export const handler = define.handlers({
  async GET() {
    return { data: { tags: await listTags(), error: null as string | null } };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
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
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Tags - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Tags</h1>
      <form method="post" class="flex gap-2 mb-6">
        <input
          name="name"
          type="text"
          required
          placeholder="New tag name"
          class="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          class="bg-gray-900 text-white rounded px-4 py-2 font-medium"
        >
          Add tag
        </button>
      </form>
      {error && <p class="text-red-600 mb-4">{error}</p>}
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b">
            <th class="py-2">Name</th>
            <th class="py-2">Slug</th>
            <th class="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.slug} class="border-b hover:bg-gray-50">
              <td class="py-2">
                <a href={`/admin/tags/${tag.slug}`} class="underline">
                  {tag.name}
                </a>
              </td>
              <td class="py-2 text-sm text-gray-600">{tag.slug}</td>
              <td class="py-2 text-right">
                <ConfirmDelete
                  itemName={tag.name}
                  actionUrl={`/admin/tags/${tag.slug}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tags.length === 0 && (
        <p class="text-gray-600 mt-4">No tags yet. Add the first one.</p>
      )}
    </div>
  );
});
