// First-run bootstrap from environment variables.
// Seeds the admin user and site settings into KV only when missing —
// never overwrites values already saved in the admin UI.
// Source: ai/requirements.md 3.5 (env config), F9 / F12.

import { ensureAdminUser } from "./auth.ts";
import { kv, KvKeys } from "./kv.ts";
import { DEFAULT_SETTINGS, saveSettings } from "./settings.ts";
import type { Settings } from "@/types/index.ts";

function env(name: string): string | undefined {
  const value = Deno.env.get(name)?.trim();
  return value || undefined;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = env(name)?.toLowerCase();
  if (raw === undefined) return fallback;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function envInt(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = env(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

const THEMES: Settings["theme"][] = ["light", "dark", "system"];
const GISCUS_MAPPINGS: NonNullable<Settings["giscusMapping"]>[] = [
  "pathname",
  "url",
  "title",
];

/** Build initial Settings from env, falling back to DEFAULT_SETTINGS. */
export function settingsFromEnv(): Settings {
  const themeRaw = env("THEME") ?? DEFAULT_SETTINGS.theme;
  const theme = THEMES.includes(themeRaw as Settings["theme"])
    ? themeRaw as Settings["theme"]
    : DEFAULT_SETTINGS.theme;

  const mappingRaw = env("GISCUS_MAPPING") ?? DEFAULT_SETTINGS.giscusMapping!;
  const giscusMapping = GISCUS_MAPPINGS.includes(
      mappingRaw as Settings["giscusMapping"] & string,
    )
    ? mappingRaw as Settings["giscusMapping"]
    : DEFAULT_SETTINGS.giscusMapping;

  return {
    ...DEFAULT_SETTINGS,
    siteName: env("SITE_NAME") ?? DEFAULT_SETTINGS.siteName,
    siteDescription: env("SITE_DESCRIPTION") ??
      DEFAULT_SETTINGS.siteDescription,
    footerDescription: env("FOOTER_DESCRIPTION") ??
      DEFAULT_SETTINGS.footerDescription,
    defaultMetaTitle: env("DEFAULT_META_TITLE"),
    defaultMetaDescription: env("DEFAULT_META_DESCRIPTION"),
    theme,
    postsPerPage: envInt(
      "POSTS_PER_PAGE",
      DEFAULT_SETTINGS.postsPerPage,
      1,
      100,
    ),
    giscusEnabled: envBool("GISCUS_ENABLED", DEFAULT_SETTINGS.giscusEnabled),
    giscusRepo: env("GISCUS_REPO"),
    giscusRepoId: env("GISCUS_REPO_ID"),
    giscusCategory: env("GISCUS_CATEGORY"),
    giscusCategoryId: env("GISCUS_CATEGORY_ID"),
    giscusMapping,
    giscusLang: env("GISCUS_LANG") ?? DEFAULT_SETTINGS.giscusLang,
    contactFormEnabled: envBool(
      "CONTACT_FORM_ENABLED",
      DEFAULT_SETTINGS.contactFormEnabled,
    ),
    contactFormLabel: env("CONTACT_FORM_LABEL") ??
      DEFAULT_SETTINGS.contactFormLabel,
    contactFormMenuOrder: envInt(
      "CONTACT_FORM_MENU_ORDER",
      DEFAULT_SETTINGS.contactFormMenuOrder,
      0,
      100,
    ),
    contactFormIntro: env("CONTACT_FORM_INTRO"),
    contactCaptchaEnabled: envBool(
      "CONTACT_CAPTCHA_ENABLED",
      DEFAULT_SETTINGS.contactCaptchaEnabled,
    ),
  };
}

/** Write settings once when the KV key is empty. */
async function ensureSettingsSeed(): Promise<void> {
  const existing = await kv.get(KvKeys.settings());
  if (existing.value) return;
  await saveSettings(settingsFromEnv());
}

/**
 * Create admin + seed settings from env when the store is empty.
 * Safe to call on every start.
 */
export async function bootstrap(): Promise<void> {
  await Promise.all([
    ensureAdminUser(),
    ensureSettingsSeed(),
  ]);
}
