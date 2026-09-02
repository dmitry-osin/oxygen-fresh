// Auth guard for everything under /admin except the login page itself.
// Source: ai/requirements.md F9 (middleware on /admin/* routes).
// Settings (site name, theme) are stashed for the layout: one KV-backed
// read per admin request, cached 60s in lib/settings.ts.

import { define } from "@/utils.ts";
import { getSessionUser, readSessionToken } from "@/lib/auth.ts";
import { getSettings } from "@/lib/settings.ts";

export const handler = define.middleware(async (ctx) => {
  if (ctx.url.pathname === "/admin/login") return await ctx.next();
  const token = readSessionToken(ctx.req.headers);
  const user = token ? await getSessionUser(token) : null;
  if (!user) return ctx.redirect("/admin/login");
  ctx.state.user = user;
  const settings = await getSettings();
  ctx.state.siteName = settings.siteName;
  ctx.state.theme = settings.theme;
  return await ctx.next();
});
