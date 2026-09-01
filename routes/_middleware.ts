// Global middleware: security headers on every dynamic response.
// Source: ai/requirements.md section 10.
// Static assets are served by staticFiles()/Nginx and bypass this middleware.

import { define } from "@/utils.ts";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self' ws:", // ws: is needed for Vite HMR in dev
  "font-src 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const handler = define.middleware(async (ctx) => {
  const response = await ctx.next();
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
});
