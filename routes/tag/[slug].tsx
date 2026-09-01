// Public tag archive: published posts carrying the tag.
// Source: ai/requirements.md F3 (tag page /tag/:slug).
// Minimal markup for now; the public site design lands in stage 6.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getTag, listPostsByTag } from "@/lib/tags.ts";
import { formatDate } from "@/utils/date.ts";

export const handler = define.handlers(async (ctx) => {
  const tag = await getTag(ctx.params.slug);
  if (!tag) throw new HttpError(404);
  const posts = await listPostsByTag(tag.slug);
  return { data: { tag, posts } };
});

export default define.page<typeof handler>(function TagArchive({ data }) {
  const { tag, posts } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-2xl">
      <Head>
        <title>{tag.name} - oxygen-blog</title>
      </Head>
      <h1 class="text-3xl font-bold mb-2">{tag.name}</h1>
      {tag.description && <p class="text-gray-600 mb-6">{tag.description}</p>}
      <ul class="space-y-4">
        {posts.map((post) => (
          <li key={post.id}>
            <a href={`/${post.slug}`} class="text-xl underline">
              {post.title}
            </a>
            <p class="text-sm text-gray-600">
              {post.publishedAt ? formatDate(post.publishedAt) : ""}
              {post.excerpt ? ` - ${post.excerpt}` : ""}
            </p>
          </li>
        ))}
      </ul>
      {posts.length === 0 && (
        <p class="text-gray-600">No published posts with this tag yet.</p>
      )}
    </div>
  );
});
