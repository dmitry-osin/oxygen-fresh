// Copy-to-clipboard control for short links (and similar admin URLs).

import { useSignal } from "@preact/signals";
import { ADMIN_BTN_SECONDARY } from "@/lib/admin-ui.ts";

export default function CopyTextButton(
  { text, label = "Copy" }: { text: string; label?: string },
) {
  const copied = useSignal(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 1500);
    } catch {
      // Fallback for older browsers / denied permission.
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 1500);
    }
  }

  return (
    <button type="button" class={ADMIN_BTN_SECONDARY} onClick={copy}>
      {copied.value ? "Copied" : label}
    </button>
  );
}
