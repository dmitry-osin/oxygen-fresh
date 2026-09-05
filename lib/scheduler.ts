// Scheduled posts auto-publish (F20): check on server start and every
// hour. Posts with status "scheduled" and publishedAt <= now are
// published with their scheduled time preserved.
// Source: ai/requirements.md 393-395.

import { listDrafts } from "./posts.ts";
import { publishPost } from "./post-mutations.ts";
import { nowIso } from "@/utils/date.ts";

const HOUR_MS = 60 * 60 * 1000;

/** Publish every scheduled post whose time has come. Returns the count. */
export async function publishDueScheduledPosts(): Promise<number> {
  const due = (await listDrafts()).filter((post) =>
    post.status === "scheduled" &&
    post.publishedAt !== null &&
    post.publishedAt <= nowIso()
  );
  let published = 0;
  for (const post of due) {
    const result = await publishPost(post.id, post.publishedAt ?? undefined);
    if (result.ok) {
      published++;
    } else {
      // Left as "scheduled": the next hourly tick retries. Logged so a
      // stuck post (e.g. a slug conflict) doesn't fail silently forever.
      console.error(
        `scheduler: failed to publish post ${post.id}: ${result.error}`,
      );
    }
  }
  return published;
}

/**
 * Start the periodic check. Guarded against double registration when
 * the dev server hot-reloads main.ts.
 */
export function startScheduler(): void {
  const globals = globalThis as { __blogSchedulerStarted?: boolean };
  if (globals.__blogSchedulerStarted) return;
  globals.__blogSchedulerStarted = true;
  publishDueScheduledPosts().catch((error) =>
    console.error("scheduler run failed:", error)
  );
  setInterval(
    () =>
      publishDueScheduledPosts().catch((error) =>
        console.error("scheduler run failed:", error)
      ),
    HOUR_MS,
  );
}
