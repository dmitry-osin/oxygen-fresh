// Shared file-picker control for admin forms: dashed drop-looking box,
// explicit Choose file button, selected file name, optional image preview.
// Kept as an island so the chosen name / preview update without a submit.

import { useSignal } from "@preact/signals";
import { ADMIN_BTN_PRIMARY, ADMIN_TYPE_MUTED } from "@/lib/admin-ui.ts";

interface FilePickFieldProps {
  name: string;
  accept?: string;
  required?: boolean;
  buttonLabel?: string;
  hint?: string;
  /** Show a thumbnail for image picks (and optional current URL). */
  imagePreview?: boolean;
  currentImageUrl?: string;
}

export default function FilePickField(props: FilePickFieldProps) {
  const fileName = useSignal("");
  const preview = useSignal(props.currentImageUrl ?? "");

  function onChange(file: File | undefined) {
    if (preview.value.startsWith("blob:")) URL.revokeObjectURL(preview.value);
    if (!file) {
      fileName.value = "";
      preview.value = props.currentImageUrl ?? "";
      return;
    }
    fileName.value = file.name;
    preview.value = props.imagePreview ? URL.createObjectURL(file) : "";
  }

  return (
    <div class="w-full">
      <label class="flex flex-col gap-3 w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-500 dark:hover:border-gray-500 transition-colors">
        <div class="flex flex-wrap items-center gap-3">
          <span class={ADMIN_BTN_PRIMARY}>
            {props.buttonLabel ?? "Choose file"}
          </span>
          <span class={ADMIN_TYPE_MUTED}>
            {fileName.value || props.hint || "No file selected"}
          </span>
        </div>
        <input
          type="file"
          name={props.name}
          accept={props.accept}
          required={props.required}
          class="sr-only"
          onChange={(e) => onChange(e.currentTarget.files?.[0])}
        />
        {props.imagePreview && preview.value && (
          <img
            src={preview.value}
            alt={fileName.value || "Current image"}
            class="max-h-24 max-w-full object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1"
          />
        )}
      </label>
    </div>
  );
}
