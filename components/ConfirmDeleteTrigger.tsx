// Server-rendered delete trigger. Opens the shared ConfirmDeleteHost
// modal (one island in the admin layout) via data-* attributes — avoids
// hydrating a separate island per table row.

import { ADMIN_BTN_DANGER, ADMIN_BTN_ROW_DANGER } from "@/lib/admin-ui.ts";

export function ConfirmDeleteTrigger(props: {
  itemName: string;
  action?: string;
  actionUrl?: string;
  label?: string;
  size?: "sm" | "md";
  buttonClass?: string;
}) {
  const triggerClass = props.buttonClass ??
    (props.size === "sm" ? ADMIN_BTN_ROW_DANGER : ADMIN_BTN_DANGER);
  return (
    <button
      type="button"
      class={triggerClass}
      data-confirm-delete
      data-item-name={props.itemName}
      data-action={props.action ?? "delete"}
      data-action-url={props.actionUrl ?? ""}
    >
      {props.label ?? "Delete"}
    </button>
  );
}
