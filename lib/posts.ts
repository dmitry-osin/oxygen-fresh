// Post persistence: CRUD, status transitions, publish snapshots.
// Stage 3 note: only the read helper needed by RSS/sitemap lives here for
// now; full CRUD lands in stage 4 (see ai/tasks.md).

import { kv } from "./kv.ts";
import type { Post } from "@/types/index.ts";

/** All published posts, ordered by publishedAt descending. */
export async function listPublishedPosts(): Promise<Post[]> {
  const posts: Post[] = [];
  const iter = kv.list<Post>({ prefix: ["posts", "published"] });
  for await (const entry of iter) posts.push(entry.value);
  return posts.sort((a, b) =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
  );
}
