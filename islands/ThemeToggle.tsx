// Admin theme toggle (F12): cycles system -> light -> dark, applies the
// .dark class on <html> immediately and persists the choice to settings.
// Source: ai/requirements.md 5.1 (system-aware default, toggle), tech-dep
// "Ручной переключатель темы админки".

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import type { Settings } from "@/types/index.ts";

type Theme = Settings["theme"];
const CYCLE: Theme[] = ["system", "light", "dark"];

function isDarkActive(theme: Theme): boolean {
  const systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark" || (theme === "system" && systemDark);
}

export default function ThemeToggle({ theme }: { theme: Theme }) {
  const current = useSignal<Theme>(theme);

  // The server cannot resolve "system"; align the class on hydration.
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
    }).catch(() => {}); // theme still applies locally if the save fails
  }

  return (
    <button
      type="button"
      class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      onClick={() =>
        setTheme(CYCLE[(CYCLE.indexOf(current.value) + 1) % CYCLE.length])}
      title="Cycle theme: system, light, dark"
    >
      Theme: {current.value}
    </button>
  );
}
