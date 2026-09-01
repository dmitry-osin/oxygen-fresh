// Central Deno KV access point.
// Key patterns are named constants: all KV access goes through KvKeys
// instead of inline magic strings (explicit over implicit).
// Schema source: ai/requirements.md section 6.1.

const kvPath = Deno.env.get("KV_PATH") ?? "./data/kv.sqlite3";

/** Shared KV instance backed by a local SQLite file. */
export const kv = await Deno.openKv(kvPath);

/** Builders for every KV key pattern used by the app. */
export const KvKeys = {
  // Posts
  publishedPost: (slug: string) => ["posts", "published", slug] as const,
  draftPost: (id: string) => ["posts", "draft", id] as const,
  postsByTag: (tagSlug: string, postId: string) =>
    ["posts_by_tag", tagSlug, postId] as const,
  postIds: () => ["post_ids"] as const,

  // Pages
  page: (slug: string) => ["pages", slug] as const,
  pageIds: () => ["page_ids"] as const,

  // Tags
  tag: (slug: string) => ["tags", slug] as const,
  tagIds: () => ["tag_ids"] as const,

  // Versions (snapshot on publish)
  postVersion: (postId: string, timestamp: string) =>
    ["post_versions", postId, timestamp] as const,
  postVersionPrefix: (postId: string) => ["post_versions", postId] as const,
  postVersionMeta: (postId: string) => ["post_version_meta", postId] as const,

  // Menu
  menuItems: () => ["menu", "items"] as const,

  // Settings
  settings: () => ["settings"] as const,

  // Analytics
  postViews: (postId: string) => ["views", "post", postId] as const,
  pageViews: (pageId: string) => ["views", "page", pageId] as const,
  analyticsDaily: (date: string) => ["analytics", "daily", date] as const,

  // Redirects
  redirect: (oldSlug: string) => ["redirects", oldSlug] as const,

  // Users / Auth
  user: (username: string) => ["users", username] as const,
  session: (token: string) => ["sessions", token] as const,
};

/** Atomically increment a numeric counter key. Returns the new value. */
export async function incrementCounter(key: Deno.KvKey): Promise<number> {
  let newValue = 0;
  for (;;) {
    const entry = await kv.get<number>(key);
    newValue = (entry.value ?? 0) + 1;
    const res = await kv.atomic().check(entry).set(key, newValue).commit();
    if (res.ok) return newValue;
  }
}
