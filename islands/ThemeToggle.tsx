// Admin theme control (F12): System / Light / Dark as icon buttons
// (same visual language as the public PublicThemeToggle).

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Monitor, Moon, Sun } from "lucide-preact";
import type { Settings } from "@/types/index.ts";

type Theme = Settings["theme"];

const OPTIONS: {
  value: Theme;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

const BTN =
  "inline-flex items-center justify-center rounded-md p-1.5 transition-colors";
const BTN_IDLE =
  "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800";
const BTN_ACTIVE = "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900";

function isDarkActive(theme: Theme): boolean {
  const systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark" || (theme === "system" && systemDark);
}

export default function ThemeToggle({ theme }: { theme: Theme }) {
  const current = useSignal<Theme>(theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkActive(theme));
  }, [theme]);

  function setTheme(next: Theme) {
    current.value = next;
    document.documentElement.classList.toggle("dark", isDarkActive(next));
    fetch("/admin/api/theme", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  }

  return (
    <div
      class="inline-flex items-center gap-0.5"
      role="group"
      aria-label="Admin theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = current.value === value;
        return (
          <button
            key={value}
            type="button"
            class={`${BTN} ${active ? BTN_ACTIVE : BTN_IDLE}`}
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => setTheme(value)}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
