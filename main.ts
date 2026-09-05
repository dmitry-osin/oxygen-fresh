import { App, csp, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { bootstrap } from "./lib/bootstrap.ts";
import { BLANK_PAGE_CSP } from "./lib/blank-page.ts";
import { RAW_UPLOAD_CSP, RAW_UPLOAD_HEADER } from "./lib/media.ts";
import { startScheduler } from "./lib/scheduler.ts";

export const app = new App<State>();

app.use(staticFiles());

// Vite (dev) and the Tailwind pipeline inject <style> tags without a
// Fresh nonce. Fresh's useNonce rewrites style-src to nonce-only, which
// blocks those styles and leaves the UI unstyled. Restore unsafe-inline
// for style-src after the CSP middleware runs (registered first so it
// patches the header on the way out).
// Blank HTML pages set X-Oxygen-Blank-Page and need their own CSP so
// inline <style>/<script> in admin-authored HTML can run. Raw upload
// bytes (routes/uploads/[name].ts, routes/admin/api/media/file.ts) set
// X-Oxygen-Raw-Upload and get a script-blocking CSP instead — see
// lib/media.ts for why.
app.use(async (ctx) => {
  const res = await ctx.next();
  if (res.headers.get("X-Oxygen-Blank-Page") === "1") {
    res.headers.set("Content-Security-Policy", BLANK_PAGE_CSP);
    return res;
  }
  if (res.headers.get(RAW_UPLOAD_HEADER) === "1") {
    res.headers.set("Content-Security-Policy", RAW_UPLOAD_CSP);
    return res;
  }
  const header = res.headers.get("Content-Security-Policy");
  if (header?.includes("style-src")) {
    res.headers.set(
      "Content-Security-Policy",
      header.replace(
        /style-src [^;]*/g,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      ),
    );
  }
  return res;
});

// Content-Security-Policy (ai/requirements.md section 10). Fresh renders
// the island bootstrap as an inline <script nonce="...">, so script-src
// must run in nonce mode: useNonce swaps 'unsafe-inline' for the
// per-request nonce. ws: keeps Vite HMR alive in dev.
app.use(csp({
  useNonce: true,
  csp: [
    "script-src 'self' 'unsafe-inline' https://giscus.app",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "frame-src https://giscus.app",
    "connect-src 'self' ws: https://giscus.app",
  ],
}));

// Include file-system based routes here
app.fsRoutes();

// First-run seed from .env (admin user + settings) when KV is empty.
await bootstrap();

// Scheduled posts (F20): publish due posts on start and every hour.
startScheduler();
