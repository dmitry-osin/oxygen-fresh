// Media library page (F5): uploader on top, thumbnail grid below,
// per-file delete with confirmation.
// Source: ai/requirements.md:292 (grid, select/insert, delete with
// confirmation), :468 (library view).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { deleteMediaFile, listMediaFiles } from "@/lib/media.ts";
import MediaUploader from "@/islands/MediaUploader.tsx";
import ConfirmDelete from "@/islands/ConfirmDelete.tsx";

export const handler = define.handlers({
  async GET() {
    return { data: { files: await listMediaFiles() } };
  },

  // Deletion arrives as a form POST from ConfirmDelete; the file name
  // travels in the query string of the form action.
  async POST(ctx) {
    const form = await ctx.req.formData();
    const name = new URL(ctx.req.url).searchParams.get("name") ?? "";
    if (String(form.get("action")) === "delete") await deleteMediaFile(name);
    return ctx.redirect("/admin/media");
  },
});

export default define.page<typeof handler>(function MediaLibrary({ data }) {
  const { files } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-5xl">
      <Head>
        <title>Media library - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Media library</h1>
      <MediaUploader />
      {files.length === 0
        ? <p class="text-gray-500 mt-8">No uploaded files yet.</p>
        : (
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {files.map((file) => (
              <figure
                key={file.name}
                class="border border-gray-200 dark:border-gray-700 rounded p-2"
              >
                <img
                  src={file.url}
                  alt={file.name}
                  class="w-full h-28 object-cover rounded bg-gray-50 dark:bg-gray-800"
                />
                <figcaption
                  class="text-xs text-gray-600 dark:text-gray-400 truncate mt-2"
                  title={file.name}
                >
                  {file.name}
                </figcaption>
                <div class="flex items-center justify-between mt-2">
                  <code class="text-xs text-gray-500 truncate">{file.url}</code>
                  <ConfirmDelete
                    itemName={file.name}
                    actionUrl={`/admin/media?name=${
                      encodeURIComponent(file.name)
                    }`}
                  />
                </div>
              </figure>
            ))}
          </div>
        )}
    </div>
  );
});
