// Sidebar for the "default" template (F7): recent posts + tag cloud.
// Server-rendered, no client JS.

import type { Post } from "@/types/index.ts";
import { TagBadge } from "./TagBadge.tsx";

export function Sidebar(
  { recentPosts, tags }: {
    recentPosts: Post[];
    tags: { slug: string; name: string }[];
  },
) {
  return (
    <aside class="lg:w-64 shrink-0 space-y-8">
      {recentPosts.length > 0 && (
        <section>
          <h3 class="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            Recent posts
          </h3>
          <ul class="space-y-1">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <a href={`/${post.slug}`} class="text-gray-700 hover:underline">
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tags.length > 0 && (
        <section>
          <h3 class="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            Tags
          </h3>
          <p>
            {tags.map((tag) => (
              <TagBadge key={tag.slug} slug={tag.slug} name={tag.name} />
            ))}
          </p>
        </section>
      )}
    </aside>
  );
}
