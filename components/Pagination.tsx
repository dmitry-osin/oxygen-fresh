// Prev/next pagination for the blog index. Server-rendered.

export function Pagination(
  { page, totalPages, basePath }: {
    page: number;
    totalPages: number;
    basePath: string;
  },
) {
  if (totalPages <= 1) return null;
  return (
    <nav class="flex justify-between mt-8 text-sm">
      {page > 1
        ? (
          <a href={`${basePath}?page=${page - 1}`} class="hover:underline">
            &larr; Newer posts
          </a>
        )
        : <span />}
      <span class="text-gray-500">Page {page} of {totalPages}</span>
      {page < totalPages
        ? (
          <a href={`${basePath}?page=${page + 1}`} class="hover:underline">
            Older posts &rarr;
          </a>
        )
        : <span />}
    </nav>
  );
}
