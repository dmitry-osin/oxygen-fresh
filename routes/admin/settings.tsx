// Site settings page (F12): single form over the ["settings"] KV key.
// Logo/favicon go through the media library upload validation.
// Source: ai/requirements.md 339-345, :470.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getSettings, saveSettings } from "@/lib/settings.ts";
import { saveMediaFile } from "@/lib/media.ts";
import { SocialLinksFields } from "@/components/SocialLinksFields.tsx";
import FilePickField from "@/islands/FilePickField.tsx";
import type { Settings } from "@/types/index.ts";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_INPUT,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_SUCCESS,
  AdminPage,
} from "@/components/AdminPage.tsx";

interface SettingsData {
  settings: Settings;
  error: string | null;
  saved: boolean;
}

const INPUT = ADMIN_INPUT;
const LABEL = ADMIN_TYPE_LABEL;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";
const THEMES: Settings["theme"][] = ["light", "dark", "system"];

function parseSocialLinks(
  form: FormData,
): Settings["socialLinks"] | string {
  const platforms = form.getAll("socialPlatform").map(String);
  const urls = form.getAll("socialUrl").map(String);
  const links: Settings["socialLinks"] = [];
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i].trim();
    const url = (urls[i] ?? "").trim();
    if (!platform && !url) continue;
    if (!platform || !/^https?:\/\//.test(url)) {
      return "Each social link needs a platform and an http(s) URL.";
    }
    links.push({ platform, url });
  }
  return links;
}

/** Upload a replacement file if provided; keep the current URL otherwise. */
async function resolveUpload(
  form: FormData,
  field: string,
  current?: string,
): Promise<{ ok: true; url?: string } | { ok: false; error: string }> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, url: current };
  }
  const result = await saveMediaFile(file);
  return result.ok
    ? { ok: true, url: result.file.url }
    : { ok: false, error: result.error };
}

async function resolveUploads(
  form: FormData,
  current: Settings,
): Promise<
  { ok: true; logoUrl?: string; faviconUrl?: string } | {
    ok: false;
    error: string;
  }
> {
  const logo = await resolveUpload(form, "logo", current.logoUrl);
  if (!logo.ok) return logo;
  const favicon = await resolveUpload(form, "favicon", current.faviconUrl);
  return favicon.ok
    ? { ok: true, logoUrl: logo.url, faviconUrl: favicon.url }
    : favicon;
}

function parsePagination(form: FormData): number | string {
  const postsPerPage = Number(form.get("postsPerPage"));
  if (
    !Number.isInteger(postsPerPage) || postsPerPage < 1 ||
    postsPerPage > 100
  ) {
    return "Posts per page must be a whole number between 1 and 100.";
  }
  return postsPerPage;
}

async function parseSettingsForm(
  form: FormData,
  current: Settings,
): Promise<{ ok: true; settings: Settings } | { ok: false; error: string }> {
  const siteName = String(form.get("siteName") ?? "").trim();
  if (!siteName) return { ok: false, error: "Site name is required." };
  const postsPerPage = parsePagination(form);
  if (typeof postsPerPage === "string") {
    return { ok: false, error: postsPerPage };
  }
  const theme = String(form.get("theme") ?? "");
  if (!THEMES.includes(theme as Settings["theme"])) {
    return { ok: false, error: "Invalid theme." };
  }
  const socialLinks = parseSocialLinks(form);
  if (typeof socialLinks === "string") {
    return { ok: false, error: socialLinks };
  }
  const uploads = await resolveUploads(form, current);
  if (!uploads.ok) return { ok: false, error: uploads.error };
  const text = (name: string) =>
    String(form.get(name) ?? "").trim() || undefined;
  return {
    ok: true,
    settings: {
      siteName,
      siteDescription: String(form.get("siteDescription") ?? "").trim(),
      footerDescription: String(form.get("footerDescription") ?? "").trim(),
      logoUrl: uploads.logoUrl,
      faviconUrl: uploads.faviconUrl,
      defaultMetaTitle: text("defaultMetaTitle"),
      defaultMetaDescription: text("defaultMetaDescription"),
      socialLinks,
      theme: theme as Settings["theme"],
      postsPerPage,
    },
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    return {
      data: {
        settings: await getSettings(),
        error: null,
        saved: ctx.url.searchParams.get("saved") === "1",
      },
    };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const current = await getSettings();
    const parsed = await parseSettingsForm(form, current);
    if (!parsed.ok) {
      return { data: { settings: current, error: parsed.error, saved: false } };
    }
    await saveSettings(parsed.settings);
    return ctx.redirect("/admin/settings?saved=1");
  },
});

export default define.page<typeof handler>(function SettingsPage({ data }) {
  const { settings, error, saved } = data;
  return (
    <AdminPage
      title="Settings"
      description="Site identity, footer text, SEO defaults, social links and pagination."
    >
      <Head>
        <title>Settings - Admin</title>
      </Head>
      {saved && <p class={`${ADMIN_TYPE_SUCCESS} mb-4`}>Settings saved.</p>}
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}
      <form
        method="post"
        enctype="multipart/form-data"
        class="space-y-5"
      >
        <label class="block">
          <span class={LABEL}>Site name *</span>
          <input
            name="siteName"
            required
            value={settings.siteName}
            class={INPUT}
          />
        </label>
        <label class="block">
          <span class={LABEL}>Site description</span>
          <textarea
            name="siteDescription"
            rows={2}
            class={INPUT}
          >
            {settings.siteDescription}
          </textarea>
        </label>
        <label class="block">
          <span class={LABEL}>Footer description</span>
          <textarea
            name="footerDescription"
            rows={2}
            class={INPUT}
            placeholder="Short line shown under the copyright in the public footer"
          >
            {settings.footerDescription}
          </textarea>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <span class={LABEL}>Logo</span>
            <FilePickField
              name="logo"
              accept={ACCEPT_IMAGES}
              buttonLabel="Choose logo"
              hint="PNG, JPG, WebP, GIF or SVG"
              imagePreview
              currentImageUrl={settings.logoUrl}
            />
          </div>
          <div>
            <span class={LABEL}>Favicon (PNG recommended)</span>
            <FilePickField
              name="favicon"
              accept={ACCEPT_IMAGES}
              buttonLabel="Choose favicon"
              hint="PNG, JPG, WebP, GIF or SVG"
              imagePreview
              currentImageUrl={settings.faviconUrl}
            />
          </div>
        </div>
        <label class="block">
          <span class={LABEL}>Default meta title</span>
          <input
            name="defaultMetaTitle"
            value={settings.defaultMetaTitle ?? ""}
            class={INPUT}
          />
        </label>
        <label class="block">
          <span class={LABEL}>Default meta description</span>
          <input
            name="defaultMetaDescription"
            value={settings.defaultMetaDescription ?? ""}
            class={INPUT}
          />
        </label>
        <SocialLinksFields links={settings.socialLinks} />
        <div class="grid gap-4 sm:grid-cols-2 max-w-xl">
          <label class="block">
            <span class={LABEL}>Theme</span>
            <select name="theme" class={INPUT}>
              {THEMES.map((theme) => (
                <option value={theme} selected={settings.theme === theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>
          <label class="block">
            <span class={LABEL}>Posts per page</span>
            <input
              name="postsPerPage"
              type="number"
              min={1}
              max={100}
              value={settings.postsPerPage}
              class={INPUT}
            />
          </label>
        </div>
        <button type="submit" class={ADMIN_BTN_PRIMARY}>
          Save settings
        </button>
      </form>
    </AdminPage>
  );
});
