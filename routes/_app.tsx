// Root HTML wrapper for every page. Source: ai/requirements.md section 9.
// Per-page SEO tags are injected through <Head> in routes/components.
// Public pages ship zero client JS; only admin pages use islands.

import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <title>oxygen-blog</title>
      </head>
      <body class="bg-white text-gray-900 antialiased">
        <Component />
      </body>
    </html>
  );
});
