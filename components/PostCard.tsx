// Post card for index, tag archive and search. Server-rendered.

import { Clock, MapPin, User } from "lucide-preact";
import type { AuthorProfile, Post } from "@/types/index.ts";
import { formatDateLong } from "@/utils/date.ts";
import { readingTimeMinutes } from "@/utils/reading-time.ts";
import {
  PUBLIC_CARD,
  PUBLIC_LINK_UNDERLINE,
  PUBLIC_TYPE_ARTICLE_TITLE,
  PUBLIC_TYPE_BODY,
  PUBLIC_TYPE_META,
} from "@/lib/public-ui.ts";
import { TagBadge } from "./TagBadge.tsx";

export function PostCard(
  { post, author }: { post: Post; author?: AuthorProfile },
) {
  const minutes = readingTimeMinutes(post.content);
  const href = `/${post.slug}`;
  const name = author?.displayName ?? post.authorId;

  return (
    <article class={`${PUBLIC_CARD} flex flex-col gap-3`}>
      <div class="flex items-start gap-3">
        {author?.avatarUrl
          ? (
            <img
              src={author.avatarUrl}
              alt=""
              class="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
            />
          )
          : (
            <span class="inline-flex w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center shrink-0">
              <User size={16} class="opacity-60" aria-hidden="true" />
            </span>
          )}
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {name}
          </p>
          <div
            class={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 ${PUBLIC_TYPE_META}`}
          >
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {formatDateLong(post.publishedAt)}
              </time>
            )}
            <span class="inline-flex items-center gap-1.5">
              <Clock size={12} class="shrink-0 opacity-70" aria-hidden="true" />
              {minutes} min read
            </span>
            {author?.location && (
              <span class="inline-flex items-center gap-1.5">
                <MapPin
                  size={12}
                  class="shrink-0 opacity-70"
                  aria-hidden="true"
                />
                {author.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <h2 class={PUBLIC_TYPE_ARTICLE_TITLE}>
        <a href={href} class="hover:underline underline-offset-2">
          {post.title}
        </a>
      </h2>

      {post.excerpt && (
        <p class={`${PUBLIC_TYPE_BODY} line-clamp-3`}>{post.excerpt}</p>
      )}

      <div class="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        {post.tags.length > 0
          ? (
            <div class="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => <TagBadge key={tag} slug={tag} />)}
            </div>
          )
          : <span />}
        <a
          href={href}
          class={`${PUBLIC_LINK_UNDERLINE} text-sm font-medium shrink-0`}
        >
          Read more →
        </a>
      </div>
    </article>
  );
}
