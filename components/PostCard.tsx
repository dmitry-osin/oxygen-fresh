// Post card for the blog index and tag archives. Server-rendered.

import type { Post } from "@/types/index.ts";
import { formatDate } from "@/utils/date.ts";
import { TagBadge } from "./TagBadge.tsx";

export function PostCard({ post }: { post: Post }) {
  return (
    <article class="py-6 border-b border-gray-100 last:border-b-0">
      <h2 class="text-2xl font-bold mb-1">
        <a href={`/${post.slug}`} class="hover:underline">{post.title}</a>
      </h2>
      {post.publishedAt && (
        <p class="text-sm text-gray-500 mb-2">{formatDate(post.publishedAt)}</p>
      )}
      {post.excerpt && <p class="text-gray-700 mb-2">{post.excerpt}</p>}
      {post.tags.length > 0 && (
        <p>
          {post.tags.map((tag) => <TagBadge key={tag} slug={tag} />)}
        </p>
      )}
    </article>
  );
}
