// Shared admin page chrome: consistent padding and full main-column width.
// Typography / button / table tokens live in lib/admin-ui.ts so islands
// can share them without importing this JSX module.

import type { ComponentChildren } from "preact";
import { ADMIN_TYPE_MUTED, ADMIN_TYPE_PAGE_TITLE } from "@/lib/admin-ui.ts";

export {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_ROW,
  ADMIN_BTN_ROW_DANGER,
  ADMIN_BTN_ROW_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_BTN_SUCCESS,
  ADMIN_CARD,
  ADMIN_EMPTY,
  ADMIN_INPUT,
  ADMIN_ROW_ACTIONS,
  ADMIN_SLUG_SUB,
  ADMIN_TABLE,
  ADMIN_TABLE_WRAP,
  ADMIN_TD,
  ADMIN_TD_ACTIONS,
  ADMIN_TD_MUTED,
  ADMIN_TH,
  ADMIN_TH_ACTIONS,
  ADMIN_THEAD,
  ADMIN_TITLE_LINK,
  ADMIN_TR,
  ADMIN_TYPE_BACK,
  ADMIN_TYPE_BADGE,
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_INLINE_LABEL,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_META,
  ADMIN_TYPE_MODAL_TITLE,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_PAGE_TITLE,
  ADMIN_TYPE_SECTION,
  ADMIN_TYPE_STAT,
  ADMIN_TYPE_STAT_LABEL,
  ADMIN_TYPE_SUCCESS,
  ADMIN_TYPE_WARN,
} from "@/lib/admin-ui.ts";

interface AdminPageProps {
  title: string;
  description?: string;
  actions?: ComponentChildren;
  children: ComponentChildren;
}

export function AdminPage(props: AdminPageProps) {
  return (
    <div class="w-full px-6 py-8 lg:px-10">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div class="min-w-0">
          <h1 class={ADMIN_TYPE_PAGE_TITLE}>{props.title}</h1>
          {props.description && (
            <p class={`${ADMIN_TYPE_MUTED} mt-1`}>{props.description}</p>
          )}
        </div>
        {props.actions && (
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            {props.actions}
          </div>
        )}
      </div>
      {props.children}
    </div>
  );
}
