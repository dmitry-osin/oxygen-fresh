// Redirect management (F18): add 301/302 redirects, list them, delete
// with confirmation. Checked in routes/_middleware.ts before routing.
// Source: ai/requirements.md 381-385, :473.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  deleteRedirect,
  getRedirects,
  saveRedirect,
  validateRedirect,
} from "@/lib/redirects.ts";
import ConfirmDelete from "@/islands/ConfirmDelete.tsx";
import type { RedirectEntry } from "@/types/index.ts";

interface RedirectsData {
  entries: RedirectEntry[];
  error: string | null;
}

const INPUT =
  "border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded px-3 py-2";

async function redirectsData(error: string | null): Promise<RedirectsData> {
  return { entries: [...(await getRedirects()).values()], error };
}

export const handler = define.handlers({
  async GET() {
    return { data: await redirectsData(null) };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    if (String(form.get("action")) === "delete") {
      await deleteRedirect(ctx.url.searchParams.get("from") ?? "");
      return ctx.redirect("/admin/redirects");
    }
    const entry = validateRedirect(
      String(form.get("from") ?? "").trim(),
      String(form.get("to") ?? "").trim(),
      Number(form.get("code")),
    );
    if (!entry) {
      return {
        data: await redirectsData(
          'Invalid redirect: "from" and "to" must be different paths starting with "/" (or an http(s) URL), code 301 or 302.',
        ),
      };
    }
    await saveRedirect(entry);
    return ctx.redirect("/admin/redirects");
  },
});

export default define.page<typeof handler>(function RedirectsPage({ data }) {
  const { entries, error } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-3xl">
      <Head>
        <title>Redirects - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-6">Redirects</h1>
      {error && <p class="text-red-600 mb-4">{error}</p>}

      <form method="post" class="flex flex-wrap gap-2 mb-8">
        <input
          name="from"
          type="text"
          required
          placeholder="/old-path"
          class={`${INPUT} flex-1 min-w-40`}
        />
        <input
          name="to"
          type="text"
          required
          placeholder="/new-path or https://..."
          class={`${INPUT} flex-1 min-w-40`}
        />
        <select name="code" class={INPUT}>
          <option value="301">301</option>
          <option value="302">302</option>
        </select>
        <button
          type="submit"
          class="bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium dark:bg-gray-100 dark:text-gray-900"
        >
          Add
        </button>
      </form>

      {entries.length === 0
        ? <p class="text-gray-500">No redirects yet.</p>
        : (
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b dark:border-gray-700">
                <th class="py-2">From</th>
                <th class="py-2">To</th>
                <th class="py-2">Code</th>
                <th class="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.from} class="border-b dark:border-gray-800">
                  <td class="py-2 font-mono">{entry.from}</td>
                  <td class="py-2 font-mono">{entry.to}</td>
                  <td class="py-2">{entry.code}</td>
                  <td class="py-2 text-right">
                    <ConfirmDelete
                      itemName={entry.from}
                      actionUrl={`/admin/redirects?from=${
                        encodeURIComponent(entry.from)
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
});
