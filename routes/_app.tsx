// Root HTML wrapper for every page. Source: ai/requirements.md section 9.
// Per-page SEO tags are injected through <Head> in routes/components.
// Public pages ship zero client JS; only admin pages use islands.
// Title/favicon defaults and the admin dark class come from settings (F12).

import { define } from "../utils.ts";
import { getSettings } from "@/lib/settings.ts";

export default define.page(async function App({ Component, url }) {
  const settings = await getSettings();
  const adminDark = url.pathname.startsWith("/admin") &&
    settings.theme === "dark";
  return (
    <html lang="ru" class={adminDark ? "dark" : undefined}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Synchronous pre-paint theme init (F17); skips /admin. */}
        <script src="/theme.js" />
        <link rel="icon" href={settings.faviconUrl ?? "/favicon.ico"} />
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <title>{settings.siteName}</title>
      </head>
      <body class="min-h-dvh font-sans bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <Component />
      </body>
    </html>
  );
});
