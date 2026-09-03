// Modal grid of uploaded media files used by the MarkdownEditor island.
// Kept separate to stay under the per-file line limit (ai/rules.md).

import type { MediaFile } from "@/lib/media.ts";
import { ADMIN_BTN_ROW, ADMIN_TYPE_MODAL_TITLE } from "@/lib/admin-ui.ts";

interface MediaPickerProps {
  files: MediaFile[];
  onPick: (file: MediaFile) => void;
  onClose: () => void;
}

export default function MediaPicker(props: MediaPickerProps) {
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class={ADMIN_TYPE_MODAL_TITLE}>Media library</h2>
          <button
            type="button"
            class={ADMIN_BTN_ROW}
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
        {props.files.length === 0
          ? <p class="text-gray-500">No uploaded files yet.</p>
          : (
            <div class="grid grid-cols-4 gap-3 max-h-96 overflow-auto">
              {props.files.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  title={file.name}
                  class="border border-gray-200 dark:border-gray-700 rounded p-1 hover:border-gray-500"
                  onClick={() => props.onPick(file)}
                >
                  <img
                    src={file.adminUrl ?? file.url}
                    alt={file.name}
                    class="w-full h-20 object-contain rounded bg-gray-50 dark:bg-gray-800"
                  />
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
