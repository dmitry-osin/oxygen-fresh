// Drag-and-drop / file-picker uploader for the media library (F5).
// Uploads to POST /admin/api/media and reloads so the server-rendered
// grid picks up the new file.
// Source: ai/requirements.md:287 (drag-and-drop + picker), :477.

import { useSignal } from "@preact/signals";

// Local copy of the 5MB limit: importing lib/media.ts here would pull its
// top-level Deno.env.get() into the client bundle and break hydration.
// The server re-validates the size, this is only early feedback.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function MediaUploader() {
  const dragging = useSignal(false);
  const uploading = useSignal(false);
  const error = useSignal("");

  async function upload(file: File | undefined) {
    if (!file || uploading.value) return;
    if (file.size > MAX_FILE_SIZE) {
      error.value = "File is larger than 5MB.";
      return;
    }
    uploading.value = true;
    error.value = "";
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/admin/api/media", { method: "POST", body });
    if (res.ok) {
      location.reload();
      return;
    }
    error.value = (await res.json().catch(() => null))?.error ??
      "Upload failed.";
    uploading.value = false;
  }

  return (
    <div>
      <label
        class={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging.value
            ? "border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800"
            : "border-gray-300 dark:border-gray-700"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          dragging.value = true;
        }}
        onDragLeave={() => (dragging.value = false)}
        onDrop={(e) => {
          e.preventDefault();
          dragging.value = false;
          upload(e.dataTransfer?.files[0]);
        }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          class="hidden"
          onChange={(e) => upload(e.currentTarget.files?.[0])}
        />
        <span class="block font-medium">
          {uploading.value
            ? "Uploading..."
            : "Drop an image here or click to choose"}
        </span>
        <span class="block text-sm text-gray-500 mt-1">
          PNG, JPG, WebP, GIF or SVG, up to 5MB
        </span>
      </label>
      {error.value && <p class="text-red-600 text-sm mt-2">{error.value}</p>}
    </div>
  );
}
