// Site settings: single KV key ["settings"], read with defaults.
// Source: ai/requirements.md F12 (schema 6.1).
// The admin settings page (write side) lands in stage 9.

import { kv, KvKeys } from "./kv.ts";
import type { Settings } from "@/types/index.ts";

export const DEFAULT_SETTINGS: Settings = {
  siteName: "oxygen-blog",
  siteDescription: "",
  socialLinks: [],
  theme: "system",
  postsPerPage: 10,
};

export async function getSettings(): Promise<Settings> {
  const stored = (await kv.get<Settings>(KvKeys.settings())).value;
  return { ...DEFAULT_SETTINGS, ...stored };
}
