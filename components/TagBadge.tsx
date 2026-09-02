// Tag badge linking to the tag archive. Server-rendered.

export function TagBadge({ slug, name }: { slug: string; name?: string }) {
  return (
    <a
      href={`/tag/${slug}`}
      class="inline-block text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-1 mr-1 hover:bg-gray-200"
    >
      {name ?? slug}
    </a>
  );
}
