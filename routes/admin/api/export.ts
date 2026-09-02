// Export download endpoint (F14): JSON dump as an attachment.
//   GET /admin/api/export -> blog-export-YYYY-MM-DD.json
// Guarded by routes/admin/_middleware.ts like everything under /admin.

import { define } from "@/utils.ts";
import { buildExport } from "@/lib/export.ts";

export const handler = define.handlers(async () => {
  const file = await buildExport();
  const date = file.exportedAt.slice(0, 10);
  return new Response(JSON.stringify(file, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="blog-export-${date}.json"`,
    },
  });
});
