// Logout: delete the session from KV and clear the cookie.
// Source: ai/requirements.md F9 (logout clears cookie and deletes session).
// POST only to avoid CSRF-by-link; the admin UI submits a small form.

import { define } from "@/utils.ts";
import {
  clearSessionCookie,
  deleteSession,
  readSessionToken,
} from "@/lib/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const token = readSessionToken(ctx.req.headers);
    if (token) await deleteSession(token);
    const headers = new Headers({ location: "/admin/login" });
    clearSessionCookie(headers);
    return new Response(null, { status: 303, headers });
  },
});
