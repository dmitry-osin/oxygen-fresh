// Admin dashboard placeholder. Replaced by the real dashboard in stage 7.
// Exists now so the auth flow (login -> /admin) can be verified end to end.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";

export default define.page(function AdminHome(ctx) {
  return (
    <div class="px-4 py-8 mx-auto max-w-screen-md">
      <Head>
        <title>Admin - oxygen-blog</title>
      </Head>
      <h1 class="text-3xl font-bold">Admin</h1>
      <p class="my-4">Signed in as {ctx.state.user?.username}.</p>
      <form method="post" action="/admin/logout">
        <button
          type="submit"
          class="bg-gray-900 text-white rounded px-3 py-2 font-medium"
        >
          Sign out
        </button>
      </form>
    </div>
  );
});
