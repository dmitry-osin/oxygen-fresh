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
import FilePickField from "@/islands/FilePickField.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_SUCCESS,
  AdminPage,
} from "@/components/AdminPage.tsx";

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
    <AdminPage title="Export / Import">
      <Head>
        <title>Backup - Admin</title>
      </Head>
      {data.imported && (
        <p class={`${ADMIN_TYPE_SUCCESS} mb-4`}>
          Data imported successfully.
        </p>
      )}
      {data.drafts > 0 && (
        <p class={`${ADMIN_TYPE_SUCCESS} mb-4`}>
          Imported {data.drafts} draft{data.drafts === 1 ? "" : "s"}{" "}
          from the external file.
        </p>
      )}
      {data.error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{data.error}</p>}

      <div class="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
        <section class={ADMIN_CARD}>
          <h2 class={`${ADMIN_TYPE_CARD_TITLE} mb-2`}>Export</h2>
          <p class={`${ADMIN_TYPE_MUTED} mb-4`}>
            Downloads every post, page, tag, menu item, redirect and site
            setting as a single JSON file.
          </p>
          <a href="/admin/api/export" class={ADMIN_BTN_PRIMARY}>
            Download export
          </a>
        </section>

        <section class={ADMIN_CARD}>
          <h2 class={`${ADMIN_TYPE_CARD_TITLE} mb-2`}>
            Import (replace all data)
          </h2>
          <p class={`${ADMIN_TYPE_MUTED} mb-4`}>
            Upload a previously exported JSON file. It is validated first; the
            replace step never runs on a malformed file.
          </p>
          <ConfirmImport />
        </section>

        <section class={ADMIN_CARD}>
          <h2 class={`${ADMIN_TYPE_CARD_TITLE} mb-2`}>
            Import from WordPress / Ghost
          </h2>
          <p class={`${ADMIN_TYPE_MUTED} mb-4`}>
            Upload a WordPress XML (WXR) or Ghost JSON export. Every post
            becomes a draft; nothing is published automatically.
          </p>
          <form method="post" enctype="multipart/form-data" class="space-y-3">
            <input type="hidden" name="action" value="import-external" />
            <FilePickField
              name="file"
              accept=".xml,.json,application/xml,application/json,text/xml"
              required
              buttonLabel="Choose WordPress / Ghost file"
              hint="WordPress XML (WXR) or Ghost JSON export"
            />
            <button type="submit" class={ADMIN_BTN_PRIMARY}>
              Import as drafts
            </button>
          </form>
        </section>
      </div>
    </AdminPage>
  );
});
