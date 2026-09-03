// Prev/next pagination for the blog index. Server-rendered.

import { PUBLIC_BTN, PUBLIC_TYPE_MUTED } from "@/lib/public-ui.ts";

export function Pagination(
  { page, totalPages, basePath }: {
    page: number;
    totalPages: number;
    basePath: string;
  },
) {
  if (totalPages <= 1) return null;
  return (
    <nav class="flex items-center justify-between gap-4 mt-10 pt-6">
      {page > 1
        ? (
          <a href={`${basePath}?page=${page - 1}`} class={PUBLIC_BTN}>
            &larr; Newer posts
          </a>
        )
        : <span />}
      <span class={PUBLIC_TYPE_MUTED}>
        Page {page} of {totalPages}
      </span>
      {page < totalPages
        ? (
          <a href={`${basePath}?page=${page + 1}`} class={PUBLIC_BTN}>
            Older posts &rarr;
          </a>
        )
        : <span />}
    </nav>
  );
}
