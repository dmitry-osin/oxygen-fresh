// Sidebar for the "default" template (F7): table of contents (F22),
// recent posts + tag cloud. Server-rendered, no client JS.

import type { Post } from "@/types/index.ts";
import type { TocEntry } from "@/lib/markdown.ts";
import { TagBadge } from "./TagBadge.tsx";

export function Sidebar(
  { recentPosts, tags, toc = [] }: {
    recentPosts: Post[];
    tags: { slug: string; name: string }[];
    toc?: TocEntry[];
  },
) {
  return (
    <aside class="lg:w-64 shrink-0 space-y-8">
      {toc.length > 0 && (
        <section>
          <h3 class="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            On this page
          </h3>
          <ul class="space-y-1 text-sm">
            {toc.map((entry) => (
              <li
                key={entry.id}
                class={entry.level === 3 ? "pl-3" : ""}
              >
                <a
                  href={`#${entry.id}`}
                  class="text-gray-700 dark:text-gray-300 hover:underline"
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {recentPosts.length > 0 && (
        <section>
          <h3 class="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Recent posts
          </h3>
          <ul class="space-y-1">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <a
                  href={`/${post.slug}`}
                  class="text-gray-700 dark:text-gray-300 hover:underline"
                >
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tags.length > 0 && (
        <section>
          <h3 class="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
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
