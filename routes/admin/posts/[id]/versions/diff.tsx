// Side-by-side snapshot comparison (F19): removed lines highlighted on
// the left, added on the right.
// Source: ai/requirements.md 389-391.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getPostById } from "@/lib/posts.ts";
import { getVersion } from "@/lib/versions.ts";
import { diffLines, type DiffRow, MAX_DIFF_LINES } from "@/lib/diff.ts";
import { formatDateTime } from "@/utils/date.ts";
import type { PostSnapshot } from "@/types/index.ts";
import {
  ADMIN_TYPE_BACK,
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_PAGE_TITLE,
} from "@/components/AdminPage.tsx";

interface DiffData {
  postId: string;
  left: PostSnapshot;
  right: PostSnapshot;
  rows: DiffRow[] | null;
}

function cellClass(kind: DiffRow["kind"], side: "left" | "right"): string {
  const changed = kind === "removed" && side === "left" ||
    kind === "added" && side === "right";
  return `w-1/2 align-top px-2 py-0.5 font-mono text-xs whitespace-pre-wrap ${
    changed
      ? kind === "added"
        ? "bg-green-100 dark:bg-green-900/40"
        : "bg-red-100 dark:bg-red-900/40"
      : "text-gray-600 dark:text-gray-400"
  }`;
}

export const handler = define.handlers({
  async GET(ctx) {
    const postId = ctx.params.id;
    const leftId = ctx.url.searchParams.get("left") ?? "";
    const rightId = ctx.url.searchParams.get("right") ?? "";
    const post = await getPostById(postId);
    if (!post) throw new HttpError(404);
    const [left, right] = await Promise.all([
      getVersion(postId, leftId),
      getVersion(postId, rightId),
    ]);
    if (!left || !right) throw new HttpError(404);
    const diff = diffLines(left.content, right.content);
    return {
      data: {
        postId,
        left,
        right,
        rows: diff.ok ? diff.rows : null,
      },
    };
  },
});

export default define.page<typeof handler>(function VersionDiff({ data }) {
  const { postId, left, right, rows } = data;
  return (
    <div class="w-full px-6 py-8 lg:px-10">
      <Head>
        <title>Version diff - Admin</title>
      </Head>
      <p class="mb-4">
        <a
          href={`/admin/posts/${postId}?tab=history`}
          class={ADMIN_TYPE_BACK}
        >
          &larr; History
        </a>
      </p>
      <h1 class={`${ADMIN_TYPE_PAGE_TITLE} mb-6`}>Version comparison</h1>
      <div class={`flex justify-between ${ADMIN_TYPE_BODY} mb-4`}>
        <span class="text-red-700 dark:text-red-400">
          &minus; {formatDateTime(left.versionId)} — {left.title}
        </span>
        <span class="text-green-700 dark:text-green-400">
          {right.title} — {formatDateTime(right.versionId)} +
        </span>
      </div>
      <table class="w-full table-fixed border-collapse">
        <tbody>
          {rows === null
            ? (
              <tr>
                <td colSpan={2} class={`${ADMIN_TYPE_BODY} py-4`}>
                  This version pair is too large to diff in the browser (over
                  {" "}
                  {MAX_DIFF_LINES}{" "}
                  lines on one side). Restore one version to a draft and compare
                  the content manually instead.
                </td>
              </tr>
            )
            : rows.map((row, index) => (
              <tr key={index}>
                <td class={cellClass(row.kind, "left")}>
                  {row.left ?? ""}
                </td>
                <td class={cellClass(row.kind, "right")}>
                  {row.right ?? ""}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
});
