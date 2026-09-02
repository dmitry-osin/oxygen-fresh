// Global middleware: managed redirects (F18) checked before routing,
// security headers on every dynamic response, and response-time / HTML
// size sampling for the performance dashboard (F15).
// Source: ai/requirements.md F15, F18, section 10.
// Static assets are served by staticFiles()/Nginx and bypass this
// middleware, so sampling covers application routes only.

import { define } from "@/utils.ts";
import { recordRequest } from "@/lib/perf.ts";
import { findRedirect } from "@/lib/redirects.ts";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' ws:", // ws: is needed for Vite HMR in dev
  "font-src 'self'",
  "frame-ancestors 'none'",
].join("; ");

function applySecurityHeaders(response: Response): Response {
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

async function htmlBytes(response: Response): Promise<number | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return null;
  return new TextEncoder().encode(await response.clone().text()).length;
}

export const handler = define.middleware(async (ctx) => {
  // Managed redirects (F18) win over routing.
  const redirect = await findRedirect(ctx.url.pathname);
  if (redirect) {
    return applySecurityHeaders(
      new Response(null, {
        status: redirect.code,
        headers: { location: redirect.to },
      }),
    );
  }

  const started = performance.now();
  const response = await ctx.next();
  const durationMs = performance.now() - started;
  recordRequest({
    durationMs,
    htmlBytes: await htmlBytes(response),
  });
  return applySecurityHeaders(response);
});
