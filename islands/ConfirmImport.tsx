// Import form with an explicit confirmation modal (F14 + UI 5.1:
// destructive actions require confirmation). The modal submits the form
// programmatically; Cancel just closes it.

import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";

export default function ConfirmImport() {
  const open = useSignal(false);
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      method="post"
      enctype="multipart/form-data"
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        open.value = true;
      }}
    >
      <input
        type="file"
        name="file"
        accept="application/json,.json"
        required
        class="block w-full text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded px-3 py-2 mb-3"
      />
      <button
        type="submit"
        class="bg-red-600 text-white rounded px-4 py-2 text-sm font-medium"
      >
        Upload and replace
      </button>
      {open.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 class="text-lg font-bold mb-2">Replace all data?</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Every post, page, tag, menu item, redirect and site setting will
              be replaced by the uploaded file. This cannot be undone.
            </p>
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                class="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm"
                onClick={() => (open.value = false)}
              >
                Cancel
              </button>
              <button
                type="button"
                class="bg-red-600 text-white rounded px-3 py-2 text-sm font-medium"
                onClick={() => form.current?.submit()}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
