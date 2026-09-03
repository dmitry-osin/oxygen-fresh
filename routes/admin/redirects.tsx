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
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import type { RedirectEntry } from "@/types/index.ts";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_TABLE,
  ADMIN_TABLE_WRAP,
  ADMIN_TD,
  ADMIN_TD_ACTIONS,
  ADMIN_TH,
  ADMIN_TH_ACTIONS,
  ADMIN_THEAD,
  ADMIN_TR,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_MUTED,
  AdminPage,
} from "@/components/AdminPage.tsx";

interface RedirectsData {
  entries: RedirectEntry[];
  error: string | null;
}

const INPUT = ADMIN_INPUT;

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
    <AdminPage
      title="Redirects"
      description="Send visitors from old paths to new ones (301 permanent, 302 temporary)."
    >
      <Head>
        <title>Redirects - Admin</title>
      </Head>
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}

      <form
        method="post"
        class={`${ADMIN_CARD} grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] mb-8`}
      >
        <input
          name="from"
          type="text"
          required
          placeholder="/old-path"
          class={INPUT}
        />
        <input
          name="to"
          type="text"
          required
          placeholder="/new-path or https://..."
          class={INPUT}
        />
        <select name="code" class={INPUT}>
          <option value="301">301</option>
          <option value="302">302</option>
        </select>
        <button type="submit" class={ADMIN_BTN_PRIMARY}>Add</button>
      </form>

      {entries.length === 0
        ? <p class={ADMIN_TYPE_MUTED}>No redirects yet.</p>
        : (
          <div class={ADMIN_TABLE_WRAP}>
            <table class={ADMIN_TABLE}>
              <thead>
                <tr class={ADMIN_THEAD}>
                  <th class={ADMIN_TH}>From</th>
                  <th class={ADMIN_TH}>To</th>
                  <th class={ADMIN_TH}>Code</th>
                  <th class={ADMIN_TH_ACTIONS}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.from} class={ADMIN_TR}>
                    <td class={`${ADMIN_TD} font-mono`}>{entry.from}</td>
                    <td class={`${ADMIN_TD} font-mono`}>{entry.to}</td>
                    <td class={ADMIN_TD}>{entry.code}</td>
                    <td class={ADMIN_TD_ACTIONS}>
                      <div class="flex justify-end">
                        <ConfirmDeleteTrigger
                          itemName={entry.from}
                          actionUrl={`/admin/redirects?from=${
                            encodeURIComponent(entry.from)
                          }`}
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </AdminPage>
  );
});
