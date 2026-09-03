// Menu list with drag-and-drop (static/admin-menu.js) and ConfirmDelete.
// Kept as a server component so /admin/menu does not pay for a Preact
// island compile on every cold navigation in Vite.

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

export function MenuBuilder({ items }: { items: MenuItem[] }) {
  const orderJson = JSON.stringify(items.map((item) => item.id));
  return (
    <div data-menu-builder>
      <ul class="space-y-2" data-menu-list>
        {items.map((item) => (
          <li
            key={item.id}
            draggable
            data-menu-id={item.id}
            class="flex items-center gap-3 border rounded px-3 py-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
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
      {items.length === 0 && (
        <p class={ADMIN_TYPE_MUTED}>The menu is empty. Add items below.</p>
      )}
      <form method="post" class="mt-4" data-menu-order-form>
        <input type="hidden" name="action" value="reorder" />
        <input
          type="hidden"
          name="order"
          value={orderJson}
          data-menu-order
          data-menu-order-initial={orderJson}
        />
        <button
          type="submit"
          disabled
          class={ADMIN_BTN_PRIMARY}
          data-menu-save
        >
          Save order
        </button>
        <span
          class={`${ADMIN_TYPE_WARN} ml-3 hidden`}
          data-menu-dirty
        >
          Unsaved order
        </span>
      </form>
    </div>
  );
}
