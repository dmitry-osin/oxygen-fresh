// Export / import page (F14): download a JSON dump of all data, upload
// a previously exported file to replace everything (after validation).
// Source: ai/requirements.md 358-362, :474.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { applyImport, validateImport } from "@/lib/import.ts";
import ConfirmImport from "@/islands/ConfirmImport.tsx";

interface BackupData {
  imported: boolean;
  error: string | null;
}

export const handler = define.handlers({
  GET(ctx) {
    return {
      data: {
        imported: ctx.url.searchParams.get("imported") === "1",
        error: null,
      },
    };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return { data: { imported: false, error: "No file uploaded." } };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return { data: { imported: false, error: "File is not valid JSON." } };
    }
    const result = validateImport(parsed);
    if (!result.ok) {
      return { data: { imported: false, error: result.error } };
    }
    await applyImport(result.data);
    return ctx.redirect("/admin/export-import?imported=1");
  },
});

export default define.page<typeof handler>(function BackupPage({ data }) {
  return (
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Backup - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Export / Import</h1>
      {data.imported && (
        <p class="text-green-700 dark:text-green-400 mb-4">
          Data imported successfully.
        </p>
      )}
      {data.error && <p class="text-red-600 mb-4">{data.error}</p>}

      <section class="mb-10">
        <h2 class="text-lg font-bold mb-2">Export</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Downloads every post, page, tag, menu item, redirect and site setting
          as a single JSON file.
        </p>
        <a
          href="/admin/api/export"
          class="inline-block bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium dark:bg-gray-100 dark:text-gray-900"
        >
          Download export
        </a>
      </section>

      <section>
        <h2 class="text-lg font-bold mb-2">Import</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Upload a previously exported JSON file. It is validated first; the
          replace step never runs on a malformed file. View counters and version
          snapshots are kept.
        </p>
        <ConfirmImport />
      </section>
    </div>
  );
});
