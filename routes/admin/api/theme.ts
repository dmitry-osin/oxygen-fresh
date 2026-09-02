// Theme persistence for the admin ThemeToggle island.
//   POST /admin/api/theme  { "theme": "light" | "dark" | "system" } -> 204
// Guarded by routes/admin/_middleware.ts like everything under /admin.

import { define } from "@/utils.ts";
import { getSettings, saveSettings } from "@/lib/settings.ts";
import type { Settings } from "@/types/index.ts";

const THEMES = new Set(["light", "dark", "system"]);

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json().catch(() => null);
    const theme = body?.theme;
    if (typeof theme !== "string" || !THEMES.has(theme)) {
      return Response.json({ error: "Invalid theme." }, { status: 400 });
    }
    const settings = await getSettings();
    await saveSettings({ ...settings, theme: theme as Settings["theme"] });
    return new Response(null, { status: 204 });
  },
});
