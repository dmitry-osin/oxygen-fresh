// Client tab switcher for the admin settings form: toggles [data-settings-panel]
// siblings, keeps a hidden input + URL ?tab= in sync (no full reload).

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

export interface SettingsTab {
  id: string;
  label: string;
}

const TAB =
  "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors";
const TAB_IDLE =
  "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100";
const TAB_ACTIVE =
  "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100";

function applyPanels(id: string) {
  for (
    const el of document.querySelectorAll<HTMLElement>("[data-settings-panel]")
  ) {
    el.hidden = el.dataset.settingsPanel !== id;
  }
  const input = document.querySelector<HTMLInputElement>(
    'input[name="settingsTab"]',
  );
  if (input) input.value = id;
  const url = new URL(location.href);
  url.searchParams.set("tab", id);
  history.replaceState(null, "", url);
}

export default function SettingsTabs(
  { tabs, initialTab }: { tabs: SettingsTab[]; initialTab: string },
) {
  const active = useSignal(
    tabs.some((t) => t.id === initialTab) ? initialTab : tabs[0]?.id ?? "",
  );

  useEffect(() => {
    applyPanels(active.value);
  }, []);

  function select(id: string) {
    active.value = id;
    applyPanels(id);
  }

  return (
    <div
      class="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800 mb-6"
      role="tablist"
      aria-label="Settings sections"
    >
      {tabs.map((tab) => {
        const isActive = active.value === tab.id;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            class={`${TAB} ${isActive ? TAB_ACTIVE : TAB_IDLE}`}
            onClick={() => select(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
