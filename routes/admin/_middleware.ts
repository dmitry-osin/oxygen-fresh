// Auth guard for everything under /admin except the login page itself.
// Source: ai/requirements.md F9 (middleware on /admin/* routes).
// Settings (site name, theme) are stashed for the layout: one KV-backed
// read per admin request, cached 60s in lib/settings.ts.
//
// Role check: User.role also allows "editor", but there is no UI yet to
// create editor accounts and no per-section permission model — gating on
// "admin" keeps the two in sync instead of silently granting editors full
// admin access the day someone adds that account type.

import { define } from "@/utils.ts";
import { getSessionUser, readSessionToken } from "@/lib/auth.ts";
import { getSettings } from "@/lib/settings.ts";

export const handler = define.middleware(async (ctx) => {
  const token = readSessionToken(ctx.req.headers);
  const user = token ? await getSessionUser(token) : null;
  if (ctx.url.pathname === "/admin/login") {
    // Resolve (but don't require) the session so an already-logged-in
    // admin gets redirected away from the login form instead of seeing it.
    if (user) ctx.state.user = user;
    return await ctx.next();
  }
  if (!user || user.role !== "admin") return ctx.redirect("/admin/login");
  ctx.state.user = user;
  const settings = await getSettings();
  ctx.state.siteName = settings.siteName;
  ctx.state.theme = settings.theme;
  return await ctx.next();
});
