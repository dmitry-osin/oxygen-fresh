// Serve user uploads from UPLOAD_DIR.
// Vite's static middleware only knows files present at startup, so newly
// saved logos/avatars under static/uploads/ 404 until a restart. This
// route always reads from disk (same SAFE_NAME checks as lib/media.ts).

import { define } from "@/utils.ts";
import { readMediaFile } from "@/lib/media.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const file = await readMediaFile(ctx.params.name);
    if (!file) return new Response(null, { status: 404 });
    return new Response(Uint8Array.from(file.bytes), {
      headers: {
        "content-type": file.mime,
        "cache-control": "public, max-age=3600",
      },
    });
  },
});
