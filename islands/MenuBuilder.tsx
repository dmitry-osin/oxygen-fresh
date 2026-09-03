// Menu builder (F6): drag-and-drop reordering with drag handles, plus a
// form POST that persists the new order. Delete uses ConfirmDeleteTrigger
// (modal is ConfirmDeleteHost in the admin layout).
// Source: ai/requirements.md 5.1 (drag handles), F6, :478.

import { useSignal } from "@preact/signals";
import type { MenuItem } from "@/types/index.ts";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_TYPE_BODY,
  ADMIN_TYPE_META,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_WARN,
} from "@/lib/admin-ui.ts";

/** Public href for an item, mirroring lib/menu.ts toNavLink. */
function hrefOf(item: MenuItem): string {
  if (item.type === "external") return item.target;
  return item.type === "page" ? `/page/${item.target}` : `/${item.target}`;
}

const TYPE_BADGE =
  `${ADMIN_TYPE_META} rounded-full px-2 py-0.5 bg-gray-100 dark:bg-gray-800`;

export default function MenuBuilder({ items }: { items: MenuItem[] }) {
  const ordered = useSignal(items);
  const dragging = useSignal(-1);
  const originalIds = items.map((item) => item.id).join(",");
  const dirty = () =>
    ordered.value.map((item) => item.id).join(",") !==
      originalIds;

  // Live reorder while dragging: the dragged row follows the pointer
  // across list positions (classic dragenter pattern).
  function moveTo(index: number) {
    const from = dragging.value;
    if (from === -1 || from === index) return;
    const next = [...ordered.value];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    ordered.value = next;
    dragging.value = index;
  }

  return (
    <div>
      <ul class="space-y-2">
        {ordered.value.map((item, index) => (
          <li
            key={item.id}
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
            <span class={`${ADMIN_TYPE_BODY} font-medium truncate`}>
              {item.label}
            </span>
            <span class={TYPE_BADGE}>{item.type}</span>
            <span class={`${ADMIN_TYPE_META} truncate hidden sm:inline`}>
              {hrefOf(item)}
            </span>
            <div class="ml-auto shrink-0">
              <ConfirmDeleteTrigger
                itemName={item.label}
                actionUrl={`/admin/menu?id=${item.id}`}
                size="sm"
              />
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 &&
        <p class={ADMIN_TYPE_MUTED}>The menu is empty. Add items below.</p>}
      <form method="post" class="mt-4">
        <input type="hidden" name="action" value="reorder" />
        <input
          type="hidden"
          name="order"
          value={JSON.stringify(ordered.value.map((item) => item.id))}
        />
        <button
          type="submit"
          disabled={!dirty()}
          class={ADMIN_BTN_PRIMARY}
        >
          Save order
        </button>
        {dirty() &&
          <span class={`${ADMIN_TYPE_WARN} ml-3`}>Unsaved order</span>}
      </form>
    </div>
  );
}
