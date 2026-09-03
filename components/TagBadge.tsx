// Tag badge linking to the tag archive. Server-rendered.

import { PUBLIC_BADGE } from "@/lib/public-ui.ts";

export function TagBadge({ slug, name }: { slug: string; name?: string }) {
  return (
    <a href={`/tag/${slug}`} class={PUBLIC_BADGE}>
      {name ?? slug}
    </a>
  );
}
