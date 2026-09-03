// Server-rendered confirm trigger. Opens ConfirmDeleteHost via data-*.

import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_ROW_DANGER,
  ADMIN_BTN_ROW_PRIMARY,
} from "@/lib/admin-ui.ts";
export function ConfirmDeleteTrigger(props: {
  itemName: string;
  action?: string;
  actionUrl?: string;
  label?: string;
  size?: "sm" | "md";
  buttonClass?: string;
  /** Modal body copy. */
  confirmMessage?: string;
  /** Confirm button label in the modal. */
  confirmLabel?: string;
  /** Visual tone of the confirm button. */
  confirmTone?: "danger" | "primary";
  /** Optional extra field posted with the confirm form. */
  versionId?: string;
}) {
  const tone = props.confirmTone ?? "danger";
  const triggerClass = props.buttonClass ??
    (props.size === "sm"
      ? (tone === "primary" ? ADMIN_BTN_ROW_PRIMARY : ADMIN_BTN_ROW_DANGER)
      : ADMIN_BTN_DANGER);
  return (
    <button
      type="button"
      class={triggerClass}
      data-confirm-delete
      data-item-name={props.itemName}
      data-action={props.action ?? "delete"}
      data-action-url={props.actionUrl ?? ""}
      data-confirm-message={props.confirmMessage ?? ""}
      data-confirm-label={props.confirmLabel ?? ""}
      data-confirm-tone={tone}
      data-version-id={props.versionId ?? ""}
    >
      {props.label ?? "Delete"}
    </button>
  );
}
