// Tag editor: display name + description (slug is the primary key,
// it stays immutable). Also lists the posts carrying this tag.
// Source: ai/requirements.md F3 (section 7.1).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { deleteTag, getTag, listPostsByTag, updateTag } from "@/lib/tags.ts";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_INPUT,
  ADMIN_TYPE_BACK,
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_PAGE_TITLE,
  ADMIN_TYPE_SECTION,
} from "@/components/AdminPage.tsx";

const inputCls = ADMIN_INPUT;
const labelCls = ADMIN_TYPE_LABEL;

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
      try {
        await deleteTag(slug);
      } catch (error) {
        console.error(`Failed to delete tag "${slug}":`, error);
        return {
          data: {
            tag,
            posts: await listPostsByTag(slug),
            error: "Could not delete this tag — please try again.",
          },
        };
      }
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
    <div class="w-full px-6 py-8 lg:px-10">
      <Head>
        <title>Tag: {tag.name} - Admin</title>
      </Head>
      <p class="mb-4">
        <a href="/admin/tags" class={ADMIN_TYPE_BACK}>&larr; All tags</a>
      </p>
      <h1 class={`${ADMIN_TYPE_PAGE_TITLE} mb-1`}>{tag.name}</h1>
      <p class={`${ADMIN_TYPE_MUTED} mb-6`}>slug: {tag.slug}</p>
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}
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
          class={ADMIN_BTN_PRIMARY}
        >
          Save
        </button>
      </form>

      <h2 class={`${ADMIN_TYPE_SECTION} mt-8 mb-2`}>
        Published posts with this tag
      </h2>
      {posts.length === 0
        ? <p class={ADMIN_TYPE_MUTED}>No published posts with this tag.</p>
        : (
          <ul class={`${ADMIN_TYPE_BODY} list-disc pl-5`}>
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
        <ConfirmDeleteTrigger itemName={tag.name} />
        <p class={`${ADMIN_TYPE_MUTED} mt-2`}>
          Deleting a tag removes it from all posts.
        </p>
      </div>
    </div>
  );
});
