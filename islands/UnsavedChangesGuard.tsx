// Warn before leaving admin forms with unsaved field changes.
// In-app link clicks use a styled modal; tab close/refresh still uses the
// browser beforeunload dialog (browsers do not allow customizing that one).
// Mark ephemeral fields (e.g. settings tab) with data-unsaved-ignore.
//
// Brand-new drafts pass forceConfirm + discardActionUrl so leaving cancels
// creation (POST delete) instead of keeping an empty Untitled entity.

import { useEffect, useRef } from "preact/hooks";
import { useSignal } from "@preact/signals";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_SECONDARY,
  ADMIN_TYPE_MODAL_TITLE,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

export interface UnsavedChangesGuardProps {
  /** Ask even when the form still matches its initial values. */
  forceConfirm?: boolean;
  title?: string;
  message?: string;
  stayLabel?: string;
  leaveLabel?: string;
  /** POST target that deletes the new draft (expects action=delete). */
  discardActionUrl?: string;
}

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

function samePathname(href: string): boolean {
  try {
    const next = new URL(href, globalThis.location.href);
    return next.origin === globalThis.location.origin &&
      next.pathname === globalThis.location.pathname;
  } catch {
    return false;
  }
}

export default function UnsavedChangesGuard(
  props: UnsavedChangesGuardProps = {},
) {
  const {
    forceConfirm = false,
    title = "Unsaved changes",
    message = "You have unsaved edits on this page. Leave without saving?",
    stayLabel = "Stay",
    leaveLabel = "Leave",
    discardActionUrl,
  } = props;

  const anchor = useRef<HTMLSpanElement>(null);
  const pendingHref = useSignal<string | null>(null);
  const bypassRef = useRef(false);
  const forceRef = useRef(forceConfirm);
  const discardRef = useRef(discardActionUrl);
  forceRef.current = forceConfirm;
  discardRef.current = discardActionUrl;

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

    function needsConfirm(href: string): boolean {
      if (bypassRef.current) return false;
      const dirty = isDirty();
      if (dirty) return true;
      if (!forceRef.current) return false;
      // Allow Edit ↔ History on the same entity without discarding.
      return !samePathname(href);
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (bypassRef.current) return;
      if (!isDirty() && !forceRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }

    function onClick(e: MouseEvent) {
      if (isModifiedClick(e)) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (!needsConfirm(link.href)) return;
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

    globalThis.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown);
    form.addEventListener("submit", onSubmit);

    return () => {
      clearTimeout(readyTimer);
      globalThis.removeEventListener("beforeunload", onBeforeUnload);
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

    const discard = discardRef.current;
    if (discard && !samePathname(href)) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = discard;
      form.style.display = "none";
      const action = document.createElement("input");
      action.type = "hidden";
      action.name = "action";
      action.value = "delete";
      form.appendChild(action);
      document.body.appendChild(form);
      form.submit();
      return;
    }

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
              {title}
            </h2>
            <p class={`${ADMIN_TYPE_MUTED} mb-6`}>
              {message}
            </p>
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                class={ADMIN_BTN_SECONDARY}
                onClick={stay}
              >
                {stayLabel}
              </button>
              <button
                type="button"
                class={ADMIN_BTN_DANGER}
                onClick={leave}
              >
                {leaveLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
