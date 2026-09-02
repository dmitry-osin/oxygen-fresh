// Public dark theme toggle (F17): the only interactive element on
// public pages. The class itself is applied pre-paint by
// static/theme.js; this island only wires the button and persists the
// choice in localStorage.

import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

export default function PublicThemeToggle() {
  const dark = useSignal(false);

  // Sync with the class already set by static/theme.js.
  useEffect(() => {
    dark.value = document.documentElement.classList.contains("dark");
  }, []);

  function toggle() {
    dark.value = !dark.value;
    document.documentElement.classList.toggle("dark", dark.value);
    try {
      localStorage.setItem("theme", dark.value ? "dark" : "light");
    } catch (_) {
      /* persistence unavailable - the class still applies for this page */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      class="hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      aria-label="Toggle dark mode"
    >
      {dark.value ? "Light mode" : "Dark mode"}
    </button>
  );
}
