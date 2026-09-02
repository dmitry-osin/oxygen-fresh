// Side-by-side snapshot comparison (F19): removed lines highlighted on
// the left, added on the right.
// Source: ai/requirements.md 389-391.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getPostById } from "@/lib/posts.ts";
import { getVersion } from "@/lib/versions.ts";
import { diffLines, type DiffRow } from "@/lib/diff.ts";
import { formatDateTime } from "@/utils/date.ts";
import type { PostSnapshot } from "@/types/index.ts";

interface DiffData {
  postId: string;
  left: PostSnapshot;
  right: PostSnapshot;
  rows: DiffRow[];
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
    return {
      data: {
        postId,
        left,
        right,
        rows: diffLines(left.content, right.content),
      },
    };
  },
});

export default define.page<typeof handler>(function VersionDiff({ data }) {
  const { postId, left, right, rows } = data;
  return (
    <div class="px-4 py-8 mx-auto max-w-6xl">
      <Head>
        <title>Version diff - Admin</title>
      </Head>
      <p class="mb-4">
        <a
          href={`/admin/posts/${postId}?tab=history`}
          class="text-sm text-gray-600"
        >
          &larr; History
        </a>
      </p>
      <h1 class="text-2xl font-bold mb-6">Version comparison</h1>
      <div class="flex justify-between text-sm mb-4">
        <span class="text-red-700 dark:text-red-400">
          &minus; {formatDateTime(left.versionId)} — {left.title}
        </span>
        <span class="text-green-700 dark:text-green-400">
          {right.title} — {formatDateTime(right.versionId)} +
        </span>
      </div>
      <table class="w-full table-fixed border-collapse">
        <tbody>
          {rows.map((row, index) => (
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
