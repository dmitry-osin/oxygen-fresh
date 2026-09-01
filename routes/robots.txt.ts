// robots.txt: allow everything except the admin panel.
// Source: ai/requirements.md F10 (section 7.1).

import { define } from "@/utils.ts";
import { absoluteUrl } from "@/lib/seo.ts";

export const handler = define.handlers(() => {
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
});
