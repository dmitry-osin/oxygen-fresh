// Slug input with on-blur uniqueness validation and regenerate-from-title.
// Source: ai/requirements.md 5.1 (inline validation: slug uniqueness on blur).

import { useSignal } from "@preact/signals";
import { slugify } from "@/utils/slugify.ts";
import { ADMIN_BTN_SECONDARY, ADMIN_INPUT } from "@/lib/admin-ui.ts";

type CheckState = "idle" | "checking" | "ok" | "taken";

export default function SlugField(
  props: {
    initialValue: string;
    excludeId: string;
    type?: "post" | "page";
    /** DOM id of the title input used by Regenerate. */
    titleInputId?: string;
  },
) {
  const value = useSignal(props.initialValue);
  const state = useSignal<CheckState>("idle");
  const titleId = props.titleInputId ?? "title";

  async function check(slug = value.value.trim()) {
    if (!slug) {
      state.value = "idle";
      return;
    }
    state.value = "checking";
    const res = await fetch(
      `/admin/api/slug-check?slug=${
        encodeURIComponent(slug)
      }&excludeId=${props.excludeId}&type=${props.type ?? "post"}`,
    );
    const body = res.ok ? await res.json() : null;
    state.value = body?.available ? "ok" : "taken";
  }

  function regenerate() {
    const titleInput = document.getElementById(titleId);
    const title = titleInput instanceof HTMLInputElement
      ? titleInput.value
      : "";
    value.value = slugify(title);
    state.value = "idle";
    void check(value.value);
  }

  return (
    <div>
      <div class="flex gap-2 items-stretch">
        <input
          name="slug"
          type="text"
          value={value.value}
          onInput={(e) => {
            value.value = e.currentTarget.value;
            state.value = "idle";
          }}
          onBlur={() => check()}
          class={`${ADMIN_INPUT} flex-1`}
        />
        <button
          type="button"
          class={`${ADMIN_BTN_SECONDARY} shrink-0`}
          onClick={regenerate}
          title="Generate slug from the title"
        >
          Regenerate
        </button>
      </div>
      {state.value === "taken" && (
        <p class="text-red-600 text-sm mt-1">
          Slug is invalid or already in use.
        </p>
      )}
      {state.value === "ok" && (
        <p class="text-green-700 text-sm mt-1">Slug is available.</p>
      )}
    </div>
  );
}
