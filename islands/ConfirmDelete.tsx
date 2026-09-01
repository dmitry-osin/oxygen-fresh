// Delete button that opens a confirmation modal naming the item.
// Source: ai/requirements.md 5.1 (destructive actions are explicit:
// red button, confirmation with the item name, no undo).

import { useSignal } from "@preact/signals";

export default function ConfirmDelete(
  props: { itemName: string; action?: string },
) {
  const open = useSignal(false);
  return (
    <>
      <button
        type="button"
        class="bg-red-600 text-white rounded px-3 py-2 text-sm font-medium"
        onClick={() => (open.value = true)}
      >
        Delete
      </button>
      {open.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 class="text-lg font-bold mb-2">Delete “{props.itemName}”?</h2>
            <p class="text-sm text-gray-600 mb-6">
              This action cannot be undone.
            </p>
            <form method="post" class="flex gap-2 justify-end">
              <input
                type="hidden"
                name="action"
                value={props.action ?? "delete"}
              />
              <button
                type="button"
                class="border border-gray-300 rounded px-3 py-2 text-sm"
                onClick={() => (open.value = false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-red-600 text-white rounded px-3 py-2 text-sm font-medium"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
