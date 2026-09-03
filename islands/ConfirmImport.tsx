// Import form with an explicit confirmation modal (F14 + UI 5.1:
// destructive actions require confirmation). Uses FilePickField for a
// clear upload affordance; the modal submits the form programmatically.

import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import FilePickField from "@/islands/FilePickField.tsx";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_SECONDARY,
  ADMIN_TYPE_MODAL_TITLE,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

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
      class="space-y-3"
    >
      <FilePickField
        name="file"
        accept="application/json,.json"
        required
        buttonLabel="Choose JSON export"
        hint="Previously downloaded blog-export-*.json"
      />
      <button type="submit" class={ADMIN_BTN_DANGER}>
        Upload and replace
      </button>
      {open.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 class={`${ADMIN_TYPE_MODAL_TITLE} mb-2`}>Replace all data?</h2>
            <p class={`${ADMIN_TYPE_MUTED} mb-6`}>
              Every post, page, tag, menu item, redirect and site setting will
              be replaced by the uploaded file. This cannot be undone.
            </p>
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                class={ADMIN_BTN_SECONDARY}
                onClick={() => (open.value = false)}
              >
                Cancel
              </button>
              <button
                type="button"
                class={ADMIN_BTN_DANGER}
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
