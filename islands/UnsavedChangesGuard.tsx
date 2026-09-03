// Warn before leaving admin forms with unsaved field changes.
// In-app link clicks use a styled modal; tab close/refresh still uses the
// browser beforeunload dialog (browsers do not allow customizing that one).
// Mark ephemeral fields (e.g. settings tab) with data-unsaved-ignore.

import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_SECONDARY,
  ADMIN_TYPE_MODAL_TITLE,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

function serializeForm(form: HTMLFormElement): string {
  const ignore = new Set<string>();
  for (const el of form.querySelectorAll("[data-unsaved-ignore]")) {
    const name = (el as HTMLInputElement).name;
    if (name) ignore.add(name);
  }
  const data = new FormData(form);
  const parts: string[] = [];
  for (const [key, value] of data.entries()) {
    if (ignore.has(key)) continue;
    if (typeof value === "string") parts.push(`${key}=${value}`);
    else parts.push(`${key}=[file:${value.name}:${value.size}]`);
  }
  return parts.join("&");
}

function isModifiedClick(e: MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

export default function UnsavedChangesGuard() {
  const anchor = useRef<HTMLSpanElement>(null);
  const pendingHref = useSignal<string | null>(null);
  const bypassRef = useRef(false);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;

    let initial = "";
    let ready = false;
    bypassRef.current = false;

    const readyTimer = setTimeout(() => {
      initial = serializeForm(form);
      ready = true;
    }, 0);

    function isDirty(): boolean {
      return ready && !bypassRef.current && serializeForm(form!) !== initial;
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = "";
    }

    function onClick(e: MouseEvent) {
      if (bypassRef.current || isModifiedClick(e)) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (!isDirty()) return;
      e.preventDefault();
      e.stopPropagation();
      pendingHref.value = link.href;
    }

    function onSubmit() {
      bypassRef.current = true;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && pendingHref.value) {
        pendingHref.value = null;
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown);
    form.addEventListener("submit", onSubmit);

    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown);
      form.removeEventListener("submit", onSubmit);
    };
  }, []);

  function stay() {
    pendingHref.value = null;
  }

  function leave() {
    const href = pendingHref.value;
    if (!href) return;
    bypassRef.current = true;
    pendingHref.value = null;
    globalThis.location.href = href;
  }

  return (
    <>
      <span ref={anchor} class="hidden" aria-hidden="true" />
      {pendingHref.value && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-title"
        >
          <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm shadow-lg border border-gray-200 dark:border-gray-800">
            <h2
              id="unsaved-title"
              class={`${ADMIN_TYPE_MODAL_TITLE} mb-2`}
            >
              Unsaved changes
            </h2>
            <p class={`${ADMIN_TYPE_MUTED} mb-6`}>
              You have unsaved edits on this page. Leave without saving?
            </p>
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                class={ADMIN_BTN_SECONDARY}
                onClick={stay}
              >
                Stay
              </button>
              <button
                type="button"
                class={ADMIN_BTN_DANGER}
                onClick={leave}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
