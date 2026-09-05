// Admin quick actions on the public site (only when logged in).

import { ExternalLink, File, FileText, Pencil, Settings } from "lucide-preact";
import { PUBLIC_SHELL } from "@/lib/public-ui.ts";

const LINK =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";
const BTN =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border-0 bg-transparent";
const EDIT =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium bg-amber-200/80 text-amber-950 hover:bg-amber-300/80 dark:bg-amber-800/60 dark:text-amber-50 dark:hover:bg-amber-700/70 transition-colors";

export function AdminQuickBar(props: { editHref?: string }) {
  return (
    <div class="border-b border-amber-200/80 dark:border-amber-900/50 bg-amber-50/95 dark:bg-amber-950/80">
      <div class={`${PUBLIC_SHELL} py-1.5 flex flex-wrap items-center gap-1`}>
        <span class="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400 mr-1">
          Admin
        </span>
        {props.editHref && (
          <a href={props.editHref} class={EDIT}>
            <Pencil size={14} aria-hidden="true" />
            Edit current
          </a>
        )}
        <a href="/admin" class={LINK}>
          <ExternalLink size={14} aria-hidden="true" />
          Go to admin
        </a>
        <form method="post" action="/admin/pages">
          <input type="hidden" name="action" value="create" />
          <button type="submit" class={BTN}>
            <File size={14} aria-hidden="true" />
            New page
          </button>
        </form>
        <form method="post" action="/admin/posts">
          <input type="hidden" name="action" value="create" />
          <button type="submit" class={BTN}>
            <FileText size={14} aria-hidden="true" />
            New post
          </button>
        </form>
        <a href="/admin/settings" class={LINK}>
          <Settings size={14} aria-hidden="true" />
          Settings
        </a>
      </div>
    </div>
  );
}
