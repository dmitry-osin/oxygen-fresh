// GET /admin/api/media -> JSON list of uploaded files.
// Used by the MarkdownEditor "insert image" modal.
// Guarded by routes/admin/_middleware.ts like everything under /admin.

import { define } from "@/utils.ts";
import { listMediaFiles } from "@/lib/media.ts";

export const handler = define.handlers({
  async GET() {
    return Response.json({ files: await listMediaFiles() });
  },
});
