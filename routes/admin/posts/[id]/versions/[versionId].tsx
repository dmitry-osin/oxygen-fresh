// Read-only view of a published snapshot with a "Version from" badge,
// plus "Restore to draft" (copies into a NEW draft, never overwrites).
// Source: ai/requirements.md F8 (section 7.1).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getVersion, restoreVersionToDraft } from "@/lib/versions.ts";
import { renderMarkdown } from "@/lib/markdown.ts";
import { formatDate } from "@/utils/date.ts";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_TYPE_BACK,
  ADMIN_TYPE_BADGE,
  ADMIN_TYPE_PAGE_TITLE,
} from "@/components/AdminPage.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const snapshot = await getVersion(ctx.params.id, ctx.params.versionId);
    if (!snapshot) throw new HttpError(404);
    return { data: { snapshot, html: renderMarkdown(snapshot.content) } };
  },

  async POST(ctx) {
    const draft = await restoreVersionToDraft(
      ctx.params.id,
      ctx.params.versionId,
      ctx.state.user?.username ?? "admin",
    );
    if (!draft) throw new HttpError(404);
    return ctx.redirect(`/admin/posts/${draft.id}`);
  },
});

export default define.page<typeof handler>(function VersionView({ data }) {
  const { snapshot, html } = data;
  return (
    <div class="w-full px-6 py-8 lg:px-10">
      <Head>
        <title>
          Version {formatDate(snapshot.versionId)} - {snapshot.title}
        </title>
      </Head>
      <p class="mb-2">
        <a
          href={`/admin/posts/${snapshot.id}?tab=history`}
          class={ADMIN_TYPE_BACK}
        >
          &larr; Back to history
        </a>
      </p>
      <span
        class={`${ADMIN_TYPE_BADGE} inline-block bg-gray-200 dark:bg-gray-800 mb-4`}
      >
        Version from {formatDate(snapshot.versionId)}
      </span>
      <h1 class={`${ADMIN_TYPE_PAGE_TITLE} mb-4`}>{snapshot.title}</h1>
      <article
        class="prose"
        // deno-lint-ignore react-no-danger -- sanitized server-side by renderMarkdown()
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <form method="post" class="mt-8">
        <button
          type="submit"
          class={ADMIN_BTN_PRIMARY}
        >
          Restore to draft
        </button>
      </form>
    </div>
  );
});
