// Single admin-wide delete confirmation modal. Triggered by any
// [data-confirm-delete] button (see ConfirmDeleteTrigger) so list pages
// do not mount one island per row.

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_SECONDARY,
  ADMIN_TYPE_MODAL_TITLE,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

interface Pending {
  itemName: string;
  action: string;
  actionUrl: string;
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
      pending.value = {
        itemName: btn.dataset.itemName ?? "item",
        action: btn.dataset.action || "delete",
        actionUrl: btn.dataset.actionUrl ?? "",
      };
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const current = pending.value;
  if (!current) return null;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 class={`${ADMIN_TYPE_MODAL_TITLE} mb-2`}>
          Delete “{current.itemName}”?
        </h2>
        <p class={`${ADMIN_TYPE_MUTED} mb-6`}>
          This action cannot be undone.
        </p>
        <form
          method="post"
          action={current.actionUrl || undefined}
          class="flex gap-2 justify-end"
        >
          <input type="hidden" name="action" value={current.action} />
          <button
            type="button"
            class={ADMIN_BTN_SECONDARY}
            onClick={() => (pending.value = null)}
          >
            Cancel
          </button>
          <button type="submit" class={ADMIN_BTN_DANGER}>
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
