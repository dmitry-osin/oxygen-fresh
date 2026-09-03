// Admin inbox for contact form submissions.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  deleteContactMessage,
  listContactMessages,
  markContactMessageRead,
} from "@/lib/contact.ts";
import { formatDateTime } from "@/utils/date.ts";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import {
  ADMIN_BTN_ROW,
  ADMIN_CARD,
  ADMIN_EMPTY,
  ADMIN_TYPE_META,
  ADMIN_TYPE_MUTED,
  AdminPage,
} from "@/components/AdminPage.tsx";

export const handler = define.handlers({
  async GET() {
    return { data: { messages: await listContactMessages() } };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");
    const id = ctx.url.searchParams.get("id") ?? String(form.get("id") ?? "");
    if (action === "read" && id) await markContactMessageRead(id);
    if (action === "delete" && id) await deleteContactMessage(id);
    return ctx.redirect("/admin/messages");
  },
});

export default define.page<typeof handler>(function MessagesPage({ data }) {
  const { messages } = data;
  return (
    <AdminPage
      title="Messages"
      description="Submissions from the public contact form."
    >
      <Head>
        <title>Messages - Admin</title>
      </Head>
      {messages.length === 0
        ? <p class={ADMIN_EMPTY}>No messages yet.</p>
        : (
          <ul class="space-y-4">
            {messages.map((msg) => (
              <li
                key={msg.id}
                class={`${ADMIN_CARD} ${
                  msg.read
                    ? "opacity-80"
                    : "ring-1 ring-amber-300/60 dark:ring-amber-700/50"
                }`}
              >
                <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold">
                      {msg.name}
                      {!msg.read && (
                        <span
                          class={`${ADMIN_TYPE_META} ml-2 uppercase tracking-wide text-amber-700 dark:text-amber-400`}
                        >
                          new
                        </span>
                      )}
                    </p>
                    <p class={ADMIN_TYPE_MUTED}>
                      <a href={`mailto:${msg.email}`} class="hover:underline">
                        {msg.email}
                      </a>
                      {" · "}
                      {formatDateTime(msg.createdAt)}
                    </p>
                    {msg.subject && (
                      <p class="text-sm mt-1 font-medium">{msg.subject}</p>
                    )}
                  </div>
                  <div class="flex flex-wrap gap-2 shrink-0">
                    {!msg.read && (
                      <form method="post">
                        <input type="hidden" name="id" value={msg.id} />
                        <input type="hidden" name="action" value="read" />
                        <button type="submit" class={ADMIN_BTN_ROW}>
                          Mark read
                        </button>
                      </form>
                    )}
                    <ConfirmDeleteTrigger
                      itemName={msg.subject || msg.name}
                      actionUrl={`/admin/messages?id=${
                        encodeURIComponent(msg.id)
                      }`}
                      size="sm"
                    />
                  </div>
                </div>
                <p class="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </p>
              </li>
            ))}
          </ul>
        )}
    </AdminPage>
  );
});
