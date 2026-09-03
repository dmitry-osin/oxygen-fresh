// Site settings: single KV key ["settings"], read with defaults.
// Writes come from the admin settings page (F12) and the theme toggle.
// Source: ai/requirements.md F12 (schema 6.1).

import { kv, KvKeys } from "./kv.ts";
import { recordCache } from "./perf.ts";
import type { Settings } from "@/types/index.ts";
import {
  DEFAULT_SIDEBAR_BLOCKS,
  normalizeSidebarBlocks,
} from "./sidebar.ts";

export const DEFAULT_SETTINGS: Settings = {
  siteName: "oxygen-blog",
  siteDescription: "",
  footerDescription: "",
  socialLinks: [],
  theme: "system",
  postsPerPage: 10,
  giscusEnabled: false,
  giscusMapping: "pathname",
  giscusLang: "ru",
  contactFormEnabled: false,
  contactFormLabel: "Contact",
  contactFormMenuOrder: 99,
  contactCaptchaEnabled: true,
  sidebarBlocks: DEFAULT_SIDEBAR_BLOCKS,
};

/** True when Giscus is on and all required IDs from giscus.app are set. */
export function isGiscusConfigured(settings: Settings): boolean {
  return !!(
    settings.giscusEnabled &&
    settings.giscusRepo?.includes("/") &&
    settings.giscusRepoId &&
    settings.giscusCategory &&
    settings.giscusCategoryId
  );
}

// Public routes read settings on every render; cache like the menu (F6).
const CACHE_TTL_MS = 60_000;
let cached: { settings: Settings; at: number } | null = null;

/** Current settings merged over the defaults, cached in memory for 60s. */
export async function getSettings(): Promise<Settings> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    recordCache("settings", true);
    return cached.settings;
  }
  const stored = (await kv.get<Settings>(KvKeys.settings())).value;
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  settings.sidebarBlocks = normalizeSidebarBlocks(settings.sidebarBlocks);
  cached = { settings, at: Date.now() };
  recordCache("settings", false);
  return settings;
}

/** Persist settings and refresh the in-memory cache immediately. */
export async function saveSettings(settings: Settings): Promise<void> {
  await kv.set(KvKeys.settings(), settings);
  cached = { settings, at: Date.now() };
}
