// Standalone HTML pages (template "blank"): no blog chrome.
// Styles and scripts live in the page body as normal <style>/<script>.
// CSP is relaxed for these responses only (admin-authored content).

import type { Page } from "@/types/index.ts";

/** Marker so main.ts can replace the default Fresh CSP. */
export const BLANK_PAGE_HEADER = "X-Oxygen-Blank-Page";

/**
 * Permissive CSP for blank pages: inline CSS/JS and common CDNs.
 * Only admin can write this HTML, so the risk is intentional.
 */
export const BLANK_PAGE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss: ws:",
  "media-src 'self' data: blob: https:",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function looksLikeFullDocument(html: string): boolean {
  const head = html.trimStart().slice(0, 200).toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html");
}

/**
 * Build the response body for a blank page.
 * Full HTML documents are returned as-is; fragments are wrapped with a
 * minimal shell and SEO title/description from the page record.
 */
export function renderBlankPageHtml(page: Page): string {
  const content = page.content ?? "";
  if (looksLikeFullDocument(content)) return content;

  const title = escapeAttr(page.metaTitle?.trim() || page.title);
  const description = page.metaDescription?.trim();
  const descTag = description
    ? `\n<meta name="description" content="${escapeAttr(description)}"/>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>${descTag}
</head>
<body>
${content}
</body>
</html>
`;
}
