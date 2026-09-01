// POST /api/preview: server-side Markdown render for the editor live preview.
// Source: ai/requirements.md F4 (preview rendered server-side).
// Requires an admin session - this must not become an open render endpoint.

import { define } from "@/utils.ts";
import { getSessionUser, readSessionToken } from "@/lib/auth.ts";
import { renderMarkdown } from "@/lib/markdown.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const token = readSessionToken(ctx.req.headers);
    const user = token ? await getSessionUser(token) : null;
    if (!user) return new Response("Unauthorized", { status: 401 });

    const body = await ctx.req.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content : "";
    return Response.json({ html: renderMarkdown(content) });
  },
});
