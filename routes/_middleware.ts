// Global middleware: managed redirects (F18) checked before routing,
// remaining security headers, and response-time / HTML size sampling
// for the performance dashboard (F15).
// The Content-Security-Policy lives in main.ts (fresh csp middleware,
// nonce mode - required for island hydration).
// Static assets are served by staticFiles()/Nginx and bypass this
// middleware, so sampling covers application routes only.

import { define } from "@/utils.ts";
import { getSessionUser, readSessionToken } from "@/lib/auth.ts";
import { recordRequest } from "@/lib/perf.ts";
import { findRedirect } from "@/lib/redirects.ts";

function applySecurityHeaders(response: Response): Response {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

/** Count HTML bytes as the body streams to the client (no TTFB delay). */
function withHtmlSizeProbe(
  response: Response,
  onBytes: (bytes: number | null) => void,
): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") || !response.body) {
    onBytes(null);
    return response;
  }
  let bytes = 0;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      bytes += chunk.byteLength;
      controller.enqueue(chunk);
    },
    flush() {
      onBytes(bytes);
    },
  });
  return new Response(response.body.pipeThrough(transform), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
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

  // Soft session for public pages: powers the admin quick bar.
  // Admin routes still enforce auth in routes/admin/_middleware.ts.
  if (!ctx.url.pathname.startsWith("/admin") && !ctx.state.user) {
    const token = readSessionToken(ctx.req.headers);
    if (token) {
      const user = await getSessionUser(token);
      if (user) ctx.state.user = user;
    }
  }

  const started = performance.now();
  const response = await ctx.next();
  const durationMs = performance.now() - started;
  // Probe size while streaming; never await the body before returning
  // (cloning + full read delayed every response and could stall under load).
  return applySecurityHeaders(
    withHtmlSizeProbe(response, (htmlBytes) => {
      recordRequest({ durationMs, htmlBytes });
    }),
  );
});
