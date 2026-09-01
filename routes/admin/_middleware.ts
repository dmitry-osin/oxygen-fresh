// Auth guard for everything under /admin except the login page itself.
// Source: ai/requirements.md F9 (middleware on /admin/* routes).

import { define } from "@/utils.ts";
import { getSessionUser, readSessionToken } from "@/lib/auth.ts";

export const handler = define.middleware(async (ctx) => {
  if (ctx.url.pathname === "/admin/login") return await ctx.next();
  const token = readSessionToken(ctx.req.headers);
  const user = token ? await getSessionUser(token) : null;
  if (!user) return ctx.redirect("/admin/login");
  ctx.state.user = user;
  return await ctx.next();
});
