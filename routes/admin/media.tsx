// Media library page (F5): shell renders immediately; grid loads via
// MediaGrid island (GET /admin/api/media) so navigation is not blocked.
// Source: ai/requirements.md:292, :468.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { deleteMediaFile } from "@/lib/media.ts";
import MediaUploader from "@/islands/MediaUploader.tsx";
import MediaGrid from "@/islands/MediaGrid.tsx";
import { AdminPage } from "@/components/AdminPage.tsx";

export const handler = define.handlers({
  GET() {
    return { data: {} };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const name = new URL(ctx.req.url).searchParams.get("name") ?? "";
    if (String(form.get("action")) === "delete") await deleteMediaFile(name);
    return ctx.redirect("/admin/media");
  },
});

export default define.page<typeof handler>(function MediaLibrary() {
  return (
    <AdminPage
      title="Media library"
      description="Upload images for posts and pages. The gallery loads in the background."
    >
      <Head>
        <title>Media library - Admin</title>
      </Head>
      <MediaUploader />
      <MediaGrid />
    </AdminPage>
  );
});
