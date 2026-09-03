// Drag-reorder + enable toggles for public sidebar widgets.
// Writes JSON into a hidden input that the settings POST parses.

import { useSignal } from "@preact/signals";
import type { SidebarBlockConfig } from "@/types/index.ts";
import { SIDEBAR_BLOCK_LABELS } from "@/lib/sidebar.ts";
import {
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_INLINE_LABEL,
  ADMIN_TYPE_META,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

export default function SidebarBlocksEditor(
  {
    blocks,
    name,
    description,
  }: {
    blocks: SidebarBlockConfig[];
    /** Form field name for the JSON payload. */
    name: string;
    description?: string;
  },
) {
  const ordered = useSignal(blocks);
  const dragging = useSignal(-1);

  function moveTo(index: number) {
    const from = dragging.value;
    if (from === -1 || from === index) return;
    const next = [...ordered.value];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    ordered.value = next;
    dragging.value = index;
  }

  function toggle(index: number, enabled: boolean) {
    const next = ordered.value.map((block, i) =>
      i === index ? { ...block, enabled } : block
    );
    ordered.value = next;
  }

  return (
    <div class="space-y-3">
      {description && <p class={ADMIN_TYPE_MUTED}>{description}</p>}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(ordered.value)}
      />
      <ul class="space-y-2">
        {ordered.value.map((block, index) => (
          <li
            key={block.id}
            draggable
            class={`flex items-center gap-3 border rounded px-3 py-2 bg-white dark:bg-gray-900 ${
              dragging.value === index
                ? "border-gray-500 opacity-60"
                : "border-gray-200 dark:border-gray-700"
            }`}
            onDragStart={() => (dragging.value = index)}
            onDragEnter={() => moveTo(index)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => (dragging.value = -1)}
          >
            <span
              class="cursor-grab select-none text-gray-400"
              title="Drag to reorder"
            >
              ⠿
            </span>
            <span class={`${ADMIN_TYPE_BODY} font-medium flex-1`}>
              {SIDEBAR_BLOCK_LABELS[block.id]}
            </span>
            <span class={ADMIN_TYPE_META}>{block.id}</span>
            <label class={ADMIN_TYPE_INLINE_LABEL}>
              <input
                type="checkbox"
                checked={block.enabled}
                onChange={(e) => toggle(index, e.currentTarget.checked)}
              />
              Show
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
