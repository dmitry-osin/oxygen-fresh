// Export: JSON dump of all content data (F14).
// Format: { version, exportedAt, data: { posts, pages, tags, settings,
// menu, redirects } }. View counters, version snapshots and sessions are
// runtime state and are not part of the export.
// Source: ai/requirements.md 358-362.

import { kv } from "./kv.ts";
import { listAllPosts } from "./posts.ts";
import { listPages } from "./pages.ts";
import { listTags } from "./tags.ts";
import { getSettings } from "./settings.ts";
import { getMenuItems } from "./menu.ts";
import { nowIso } from "@/utils/date.ts";
import type {
  MenuItem,
  Page,
  Post,
  RedirectEntry,
  Settings,
  Tag,
} from "@/types/index.ts";

export const EXPORT_VERSION = "1.0";

export interface ExportData {
  posts: Post[];
  pages: Page[];
  tags: Tag[];
  settings: Settings;
  menu: MenuItem[];
  redirects: RedirectEntry[];
}

export interface ExportFile {
  version: string;
  exportedAt: string;
  data: ExportData;
}

async function listRedirects(): Promise<RedirectEntry[]> {
  const redirects: RedirectEntry[] = [];
  const iter = kv.list<RedirectEntry>({ prefix: ["redirects"] });
  for await (const entry of iter) {
    redirects.push({ ...entry.value, from: String(entry.key[1]) });
  }
  return redirects;
}

/** Full export document for download and backup. */
export async function buildExport(): Promise<ExportFile> {
  const [posts, pages, tags, settings, menu, redirects] = await Promise.all([
    listAllPosts(),
    listPages(),
    listTags(),
    getSettings(),
    getMenuItems(),
    listRedirects(),
  ]);
  return {
    version: EXPORT_VERSION,
    exportedAt: nowIso(),
    data: { posts, pages, tags, settings, menu, redirects },
  };
}
