// Export / import page (F14): download a JSON dump of all data, upload
// a previously exported file to replace everything (after validation),
// and import posts from a WordPress XML / Ghost JSON export as drafts
// (F23). Source: ai/requirements.md 358-362, 405-407, :474.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { applyImport, validateImport } from "@/lib/import.ts";
import {
  type ExternalPost,
  importExternalPosts,
  parseGhostJson,
  parseWordPressXml,
} from "@/lib/import-external.ts";
import ConfirmImport from "@/islands/ConfirmImport.tsx";

interface BackupData {
  imported: boolean;
  drafts: number;
  error: string | null;
}

function backupData(url: URL, error: string | null = null): BackupData {
  return {
    imported: url.searchParams.get("imported") === "1",
    drafts: Number(url.searchParams.get("drafts")) || 0,
    error,
  };
}

/** WordPress XML starts with "<", Ghost exports are JSON. */
function parseExternal(text: string): ExternalPost[] {
  return text.trimStart().startsWith("<")
    ? parseWordPressXml(text)
    : parseGhostJson(text);
}

export const handler = define.handlers({
  GET(ctx) {
    return { data: backupData(ctx.url) };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const file = form.get("file");

    // WordPress / Ghost import (F23): adds drafts, never replaces data.
    if (String(form.get("action")) === "import-external") {
      if (!(file instanceof File)) {
        return { data: backupData(ctx.url, "No file uploaded.") };
      }
      try {
        const posts = parseExternal(await file.text());
        if (posts.length === 0) {
          return { data: backupData(ctx.url, "No posts found in the file.") };
        }
        const created = await importExternalPosts(
          posts,
          ctx.state.user?.username ?? "admin",
        );
        return ctx.redirect(`/admin/export-import?drafts=${created}`);
      } catch (error) {
        return {
          data: backupData(
            ctx.url,
            error instanceof Error
              ? error.message
              : "Could not parse the file.",
          ),
        };
      }
    }

    if (!(file instanceof File)) {
      return { data: backupData(ctx.url, "No file uploaded.") };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return { data: backupData(ctx.url, "File is not valid JSON.") };
    }
    const result = validateImport(parsed);
    if (!result.ok) return { data: backupData(ctx.url, result.error) };
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
      {data.drafts > 0 && (
        <p class="text-green-700 dark:text-green-400 mb-4">
          Imported {data.drafts} draft{data.drafts === 1 ? "" : "s"}{" "}
          from the external file.
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

      <section class="mb-10">
        <h2 class="text-lg font-bold mb-2">Import (replace all data)</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Upload a previously exported JSON file. It is validated first; the
          replace step never runs on a malformed file. View counters and version
          snapshots are kept.
        </p>
        <ConfirmImport />
      </section>

      <section>
        <h2 class="text-lg font-bold mb-2">Import from WordPress / Ghost</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Upload a WordPress XML (WXR) or Ghost JSON export. Every post becomes
          a draft; HTML content is converted to Markdown, tags are kept. Nothing
          is published automatically.
        </p>
        <form method="post" enctype="multipart/form-data">
          <input type="hidden" name="action" value="import-external" />
          <input
            type="file"
            name="file"
            accept=".xml,.json,application/xml,application/json"
            required
            class="block w-full text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded px-3 py-2 mb-3"
          />
          <button
            type="submit"
            class="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium dark:bg-gray-100 dark:text-gray-900"
          >
            Import as drafts
          </button>
        </form>
      </section>
    </div>
  );
});
