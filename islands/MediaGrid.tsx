// Media grid loaded client-side so /admin/media navigates without waiting
// on readdir + thumbnail HTML. Refreshes after upload/delete events.

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import { ADMIN_TYPE_META, ADMIN_TYPE_MUTED } from "@/lib/admin-ui.ts";

interface MediaFile {
  name: string;
  url: string;
  adminUrl: string;
}

export default function MediaGrid() {
  const files = useSignal<MediaFile[]>([]);
  const loading = useSignal(true);
  const error = useSignal("");

  async function refresh() {
    loading.value = true;
    error.value = "";
    try {
      const res = await fetch("/admin/api/media");
      if (!res.ok) throw new Error("Could not load media.");
      const data = await res.json();
      files.value = Array.isArray(data.files) ? data.files : [];
    } catch {
      error.value = "Could not load media library.";
      files.value = [];
    } finally {
      loading.value = false;
    }
  }

  useEffect(() => {
    refresh();
    function onChanged() {
      refresh();
    }
    document.addEventListener("media:changed", onChanged);
    return () => document.removeEventListener("media:changed", onChanged);
  }, []);

  if (loading.value && files.value.length === 0) {
    return <p class={`${ADMIN_TYPE_MUTED} mt-8`}>Loading media…</p>;
  }

  if (error.value) {
    return <p class={`${ADMIN_TYPE_MUTED} mt-8`}>{error.value}</p>;
  }

  if (files.value.length === 0) {
    return <p class={`${ADMIN_TYPE_MUTED} mt-8`}>No uploaded files yet.</p>;
  }

  return (
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
      {files.value.map((file) => (
        <figure
          key={file.name}
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900"
        >
          <div class="w-full h-36 flex items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800 overflow-hidden">
            <img
              src={file.adminUrl}
              alt={file.name}
              loading="lazy"
              decoding="async"
              class="max-h-full max-w-full object-contain"
            />
          </div>
          <figcaption
            class={`${ADMIN_TYPE_META} truncate mt-2`}
            title={file.name}
          >
            {file.name}
          </figcaption>
          <div class="flex items-center justify-between gap-2 mt-2">
            <code class={`${ADMIN_TYPE_META} truncate`}>{file.url}</code>
            <ConfirmDeleteTrigger
              itemName={file.name}
              actionUrl={`/admin/media?name=${encodeURIComponent(file.name)}`}
              size="sm"
            />
          </div>
        </figure>
      ))}
    </div>
  );
}
