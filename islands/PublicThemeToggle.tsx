// Public dark theme toggle (F17): icon button in the footer.

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Moon, Sun } from "lucide-preact";

const BTN =
  "inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

export default function PublicThemeToggle() {
  const dark = useSignal(false);

  useEffect(() => {
    dark.value = document.documentElement.classList.contains("dark");
  }, []);

  function toggle() {
    dark.value = !dark.value;
    document.documentElement.classList.toggle("dark", dark.value);
    try {
      localStorage.setItem("theme", dark.value ? "dark" : "light");
    } catch (_) {
      /* persistence unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      class={BTN}
      aria-label={dark.value ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark.value
        ? <Sun size={18} aria-hidden="true" />
        : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
