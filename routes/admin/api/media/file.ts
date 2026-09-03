// Authenticated binary serve for admin media previews.
// Public pages still use /uploads/... via staticFiles; the admin grid uses
// this route so thumbnails work even when Vite does not expose new uploads.

import { define } from "@/utils.ts";
import { readMediaFile } from "@/lib/media.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const name = ctx.url.searchParams.get("name") ?? "";
    const file = await readMediaFile(name);
    if (!file) {
      return Response.json({ error: "File not found." }, { status: 404 });
    }
    return new Response(Uint8Array.from(file.bytes), {
      headers: {
        "content-type": file.mime,
        "cache-control": "private, max-age=60",
      },
    });
  },
});
