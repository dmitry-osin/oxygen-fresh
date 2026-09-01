// GET /admin/api/slug-check?slug=&excludeId= -> { available: boolean }
// Used by the SlugField island for on-blur inline validation (UI 5.1).
// Guarded by routes/admin/_middleware.ts like everything under /admin.

import { define } from "@/utils.ts";
import { isSlugTaken } from "@/lib/posts.ts";
import { isValidSlug } from "@/utils/validate.ts";

export const handler = define.handlers(async (ctx) => {
  const slug = ctx.url.searchParams.get("slug") ?? "";
  const excludeId = ctx.url.searchParams.get("excludeId") ?? undefined;
  const available = isValidSlug(slug) && !(await isSlugTaken(slug, excludeId));
  return Response.json({ available });
});
