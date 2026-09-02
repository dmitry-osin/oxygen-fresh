// Media JSON API, guarded by routes/admin/_middleware.ts like everything
// under /admin:
//   GET    /admin/api/media         -> { files } (editor "insert image" modal)
//   POST   /admin/api/media         -> multipart upload, field "file"
//   DELETE /admin/api/media?name=.. -> 204 on success

import { define } from "@/utils.ts";
import { deleteMediaFile, listMediaFiles, saveMediaFile } from "@/lib/media.ts";

export const handler = define.handlers({
  async GET() {
    return Response.json({ files: await listMediaFiles() });
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "No file in the request." }, {
        status: 400,
      });
    }
    const result = await saveMediaFile(file);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ file: result.file }, { status: 201 });
  },

  async DELETE(ctx) {
    const name = new URL(ctx.req.url).searchParams.get("name") ?? "";
    if (await deleteMediaFile(name)) return new Response(null, { status: 204 });
    return Response.json({ error: "File not found." }, { status: 404 });
  },
});
