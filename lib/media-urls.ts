// Pure URL helpers for media paths — safe for islands (no Deno APIs).

/** Admin preview for a public /uploads/... URL (works when Vite misses new files). */
export function mediaAdminPreviewUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const match = /^\/uploads\/([^/?#]+)/.exec(url);
  if (!match) return url;
  return `/admin/api/media/file?name=${encodeURIComponent(match[1])}`;
}
