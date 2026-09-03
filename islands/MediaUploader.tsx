// Drag-and-drop / file-picker uploader for the media library (F5).
// Shows a local preview + explicit Upload button; POSTs to /admin/api/media
// then dispatches media:changed so MediaGrid refreshes without a full reload.
// Source: ai/requirements.md:287 (drag-and-drop + picker), :477.

import { useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_META,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

// Local copy of the 5MB limit: importing lib/media.ts here would pull its
// top-level Deno.env.get() into the client bundle and break hydration.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

export default function MediaUploader() {
  const dragging = useSignal(false);
  const uploading = useSignal(false);
  const error = useSignal("");
  const fileName = useSignal("");
  const preview = useSignal("");
  const selected = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearPreview() {
    if (preview.value.startsWith("blob:")) URL.revokeObjectURL(preview.value);
    preview.value = "";
    fileName.value = "";
    selected.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }

  function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      error.value = "File is larger than 5MB.";
      return;
    }
    error.value = "";
    if (preview.value.startsWith("blob:")) URL.revokeObjectURL(preview.value);
    selected.current = file;
    fileName.value = file.name;
    preview.value = URL.createObjectURL(file);
  }

  async function upload() {
    const file = selected.current;
    if (!file || uploading.value) return;
    uploading.value = true;
    error.value = "";
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/admin/api/media", { method: "POST", body });
    if (res.ok) {
      clearPreview();
      uploading.value = false;
      document.dispatchEvent(new Event("media:changed"));
      return;
    }
    error.value = (await res.json().catch(() => null))?.error ??
      "Upload failed.";
    uploading.value = false;
  }

  const zoneCls = dragging.value
    ? "border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800"
    : "border-gray-300 dark:border-gray-700";

  return (
    <div>
      <div
        class={`border-2 border-dashed rounded-lg p-6 transition-colors ${zoneCls}`}
        onDragOver={(e) => {
          e.preventDefault();
          dragging.value = true;
        }}
        onDragLeave={() => (dragging.value = false)}
        onDrop={(e) => {
          e.preventDefault();
          dragging.value = false;
          pick(e.dataTransfer?.files[0]);
        }}
      >
        <div class="flex flex-col sm:flex-row gap-4 items-start">
          <div class="flex-1 min-w-0">
            <p class={`${ADMIN_TYPE_BODY} font-medium mb-1`}>
              {uploading.value
                ? "Uploading..."
                : "Drop an image here or choose a file"}
            </p>
            <p class={`${ADMIN_TYPE_MUTED} mb-4`}>
              PNG, JPG, WebP, GIF or SVG, up to 5MB
            </p>
            <div class="flex flex-wrap gap-2 items-center">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                class="sr-only"
                onChange={(e) => pick(e.currentTarget.files?.[0])}
              />
              <button
                type="button"
                class={ADMIN_BTN_PRIMARY}
                disabled={uploading.value}
                onClick={() => inputRef.current?.click()}
              >
                Choose file
              </button>
              <button
                type="button"
                class={ADMIN_BTN_PRIMARY}
                disabled={!fileName.value || uploading.value}
                onClick={upload}
              >
                Upload
              </button>
              {fileName.value && (
                <button
                  type="button"
                  class={`${ADMIN_TYPE_MUTED} hover:text-gray-900 dark:hover:text-gray-100`}
                  disabled={uploading.value}
                  onClick={clearPreview}
                >
                  Clear
                </button>
              )}
            </div>
            {fileName.value && (
              <p class={`${ADMIN_TYPE_MUTED} mt-3 truncate`}>
                Selected: {fileName.value}
              </p>
            )}
          </div>
          <div class="w-full sm:w-40 h-28 shrink-0 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {preview.value
              ? (
                <img
                  src={preview.value}
                  alt="Preview"
                  class="max-h-full max-w-full object-contain"
                />
              )
              : (
                <span class={`${ADMIN_TYPE_META} px-2 text-center`}>
                  Preview
                </span>
              )}
          </div>
        </div>
      </div>
      {error.value && <p class={`${ADMIN_TYPE_ERROR} mt-2`}>{error.value}</p>}
    </div>
  );
}
