// Login page and handler.
// Source: ai/requirements.md F9 + section 10 (httpOnly/Secure/SameSite=Strict
// cookie, in-memory sliding window rate limiting on login).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  ADMIN_USERNAME,
  createSession,
  ensureAdminUser,
  getUser,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth.ts";
import { SlidingWindowRateLimiter } from "@/lib/rate-limit.ts";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_INPUT,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_PAGE_TITLE,
} from "@/lib/admin-ui.ts";

// 5 attempts per 5 minutes per client key.
const limiter = new SlidingWindowRateLimiter(5, 5 * 60 * 1000);

function clientKey(headers: Headers): string {
  return headers.get("x-forwarded-for") ?? "unknown";
}

function redirectWithSession(location: string, token: string): Response {
  const headers = new Headers({ location });
  setSessionCookie(headers, token);
  return new Response(null, { status: 303, headers });
}

export const handler = define.handlers({
  GET(ctx) {
    if (ctx.state.user) return ctx.redirect("/admin");
    return { data: { error: null as string | null } };
  },

  async POST(ctx) {
    const key = clientKey(ctx.req.headers);
    if (!limiter.allow(key)) {
      return { data: { error: "Too many attempts. Try again later." } };
    }

    const form = await ctx.req.formData();
    const username = String(form.get("username") ?? "");
    const password = String(form.get("password") ?? "");

    // First setup: the admin user is created from ADMIN_PASSWORD_HASH.
    const user = username === ADMIN_USERNAME
      ? await ensureAdminUser()
      : await getUser(username);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { data: { error: "Invalid username or password." } };
    }

    limiter.reset(key);
    const session = await createSession(user.username);
    return redirectWithSession("/admin", session.token);
  },
});

export default define.page<typeof handler>(function Login({ data }) {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Sign in - oxygen-blog</title>
      </Head>
      <form
        method="post"
        class="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border border-gray-200"
      >
        <h1 class={`${ADMIN_TYPE_PAGE_TITLE} mb-6`}>Sign in</h1>
        <label class="block mb-4">
          <span class={ADMIN_TYPE_LABEL}>Username</span>
          <input
            name="username"
            type="text"
            required
            autocomplete="username"
            class={ADMIN_INPUT}
          />
        </label>
        <label class="block mb-6">
          <span class={ADMIN_TYPE_LABEL}>Password</span>
          <input
            name="password"
            type="password"
            required
            autocomplete="current-password"
            class={ADMIN_INPUT}
          />
        </label>
        {data.error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{data.error}</p>}
        <button
          type="submit"
          class={`w-full ${ADMIN_BTN_PRIMARY}`}
        >
          Sign in
        </button>
      </form>
    </div>
  );
});
