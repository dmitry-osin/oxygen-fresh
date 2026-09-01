// Tag editor: display name + description (slug is the primary key,
// it stays immutable). Also lists the posts carrying this tag.
// Source: ai/requirements.md F3 (section 7.1).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { deleteTag, getTag, listPostsByTag, updateTag } from "@/lib/tags.ts";
import ConfirmDelete from "@/islands/ConfirmDelete.tsx";

const inputCls = "w-full border border-gray-300 rounded px-3 py-2";
const labelCls = "block text-sm font-medium mb-1";

export const handler = define.handlers({
  async GET(ctx) {
    const tag = await getTag(ctx.params.slug);
    if (!tag) throw new HttpError(404);
    const posts = await listPostsByTag(tag.slug);
    return { data: { tag, posts, error: null as string | null } };
  },

  async POST(ctx) {
    const slug = ctx.params.slug;
    const tag = await getTag(slug);
    if (!tag) throw new HttpError(404);
    const form = await ctx.req.formData();
    if (String(form.get("action")) === "delete") {
      await deleteTag(slug);
      return ctx.redirect("/admin/tags");
    }
    const result = await updateTag(slug, {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
    });
    if (!result.ok) {
      return {
        data: { tag, posts: await listPostsByTag(slug), error: result.error },
      };
    }
    return ctx.redirect(`/admin/tags/${slug}`);
  },
});

export default define.page<typeof handler>(function TagEditor({ data }) {
  const { tag, posts, error } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Tag: {tag.name} - Admin</title>
      </Head>
      <p class="mb-4">
        <a href="/admin/tags" class="text-sm text-gray-600">&larr; All tags</a>
      </p>
      <h1 class="text-2xl font-bold mb-1">{tag.name}</h1>
      <p class="text-sm text-gray-600 mb-6">slug: {tag.slug}</p>
      {error && <p class="text-red-600 mb-4">{error}</p>}
      <form method="post" class="space-y-4">
        <div>
          <label class={labelCls} for="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={tag.name}
            class={inputCls}
          />
        </div>
        <div>
          <label class={labelCls} for="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={2}
            class={inputCls}
          >
            {tag.description ?? ""}
          </textarea>
        </div>
        <button
          type="submit"
          name="action"
          value="save"
          class="bg-gray-900 text-white rounded px-4 py-2 font-medium"
        >
          Save
        </button>
      </form>

      <h2 class="text-lg font-bold mt-8 mb-2">Published posts with this tag</h2>
      {posts.length === 0
        ? <p class="text-gray-600">No published posts with this tag.</p>
        : (
          <ul class="list-disc pl-5">
            {posts.map((post) => (
              <li key={post.id}>
                <a href={`/admin/posts/${post.id}`} class="underline">
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        )}

      <div class="mt-6 pt-6 border-t">
        <ConfirmDelete itemName={tag.name} />
        <p class="text-sm text-gray-600 mt-2">
          Deleting a tag removes it from all posts.
        </p>
      </div>
    </div>
  );
});
