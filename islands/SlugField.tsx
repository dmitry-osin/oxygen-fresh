// Slug input with on-blur uniqueness validation against the server.
// Source: ai/requirements.md 5.1 (inline validation: slug uniqueness on blur).

import { useSignal } from "@preact/signals";

type CheckState = "idle" | "checking" | "ok" | "taken";

export default function SlugField(
  props: { initialValue: string; excludeId: string },
) {
  const value = useSignal(props.initialValue);
  const state = useSignal<CheckState>("idle");

  async function check() {
    const slug = value.value.trim();
    if (!slug) {
      state.value = "idle";
      return;
    }
    state.value = "checking";
    const res = await fetch(
      `/admin/api/slug-check?slug=${
        encodeURIComponent(slug)
      }&excludeId=${props.excludeId}`,
    );
    const body = res.ok ? await res.json() : null;
    state.value = body?.available ? "ok" : "taken";
  }

  return (
    <div>
      <input
        name="slug"
        type="text"
        value={value.value}
        onInput={(e) => {
          value.value = e.currentTarget.value;
          state.value = "idle";
        }}
        onBlur={check}
        class="w-full border border-gray-300 rounded px-3 py-2"
      />
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
