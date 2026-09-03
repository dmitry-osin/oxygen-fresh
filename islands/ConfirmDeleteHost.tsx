// Confirmation modal host for admin destructive/irreversible actions.
// Triggered by [data-confirm-delete] buttons (see ConfirmDeleteTrigger).

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_TYPE_MODAL_TITLE,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

interface Pending {
  itemName: string;
  action: string;
  actionUrl: string;
  message: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  versionId: string;
}

export default function ConfirmDeleteHost() {
  const pending = useSignal<Pending | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest("[data-confirm-delete]");
      if (!(btn instanceof HTMLElement)) return;
      event.preventDefault();
      const tone = btn.dataset.confirmTone === "primary" ? "primary" : "danger";
      pending.value = {
        itemName: btn.dataset.itemName ?? "item",
        action: btn.dataset.action || "delete",
        actionUrl: btn.dataset.actionUrl ?? "",
        message: btn.dataset.confirmMessage ||
          "This action cannot be undone.",
        confirmLabel: btn.dataset.confirmLabel ||
          (tone === "primary" ? "Confirm" : "Delete"),
        tone,
        versionId: btn.dataset.versionId ?? "",
      };
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const current = pending.value;
  if (!current) return null;

  const confirmClass = current.tone === "primary"
    ? ADMIN_BTN_PRIMARY
    : ADMIN_BTN_DANGER;
  const title = current.action === "restore-version"
    ? `Restore "${current.itemName}"?`
    : `Delete "${current.itemName}"?`;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 class={`${ADMIN_TYPE_MODAL_TITLE} mb-2`}>
          {title}
        </h2>
        <p class={`${ADMIN_TYPE_MUTED} mb-6`}>
          {current.message}
        </p>
        <form
          method="post"
          action={current.actionUrl || undefined}
          class="flex gap-2 justify-end"
        >
          <input type="hidden" name="action" value={current.action} />
          {current.versionId && (
            <input
              type="hidden"
              name="versionId"
              value={current.versionId}
            />
          )}
          <button
            type="button"
            class={ADMIN_BTN_SECONDARY}
            onClick={() => (pending.value = null)}
          >
            Cancel
          </button>
          <button type="submit" class={confirmClass}>
            {current.confirmLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
