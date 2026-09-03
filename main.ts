import { App, csp, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { bootstrap } from "./lib/bootstrap.ts";
import { startScheduler } from "./lib/scheduler.ts";

export const app = new App<State>();

app.use(staticFiles());

// Vite (dev) and the Tailwind pipeline inject <style> tags without a
// Fresh nonce. Fresh's useNonce rewrites style-src to nonce-only, which
// blocks those styles and leaves the UI unstyled. Restore unsafe-inline
// for style-src after the CSP middleware runs (registered first so it
// patches the header on the way out).
app.use(async (ctx) => {
  const res = await ctx.next();
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
