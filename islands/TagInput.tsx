// Tag chips input: commit on Space / Comma / Enter, remove via badge ×.
// Submits a single hidden comma-separated `tags` field for the post form.
// Source: ai/requirements.md F1 (tags on posts).

import { useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";
import { ADMIN_INPUT, ADMIN_TYPE_META } from "@/lib/admin-ui.ts";

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/,+/g, "");
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const n = normalizeTag(tag);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export default function TagInput(props: { initialTags: string[] }) {
  const tags = useSignal(uniqueTags(props.initialTags));
  const draft = useSignal("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const next = uniqueTags([...tags.value, ...raw.split(/[\s,]+/)]);
    if (next.length === tags.value.length && raw.trim() === "") return;
    tags.value = next;
    draft.value = "";
  }

  function remove(tag: string) {
    tags.value = tags.value.filter((t) => t !== tag);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commit(draft.value);
      return;
    }
    if (e.key === "Backspace" && draft.value === "" && tags.value.length > 0) {
      e.preventDefault();
      tags.value = tags.value.slice(0, -1);
    }
  }

  function onBlur() {
    if (draft.value.trim()) commit(draft.value);
  }

  function onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData("text") ?? "";
    if (!/[\s,]/.test(text)) return;
    e.preventDefault();
    commit(`${draft.value}${text}`);
  }

  return (
    <div>
      <input type="hidden" name="tags" value={tags.value.join(", ")} />
      <div
        class={`${ADMIN_INPUT} flex flex-wrap items-center gap-1.5 min-h-[2.5rem] cursor-text`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.value.map((tag) => (
          <span
            key={tag}
            class="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              class="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 leading-none"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(tag);
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft.value}
          class="flex-1 min-w-32 bg-transparent outline-none text-sm py-0.5"
          placeholder={tags.value.length === 0
            ? "Type a tag, then Space or Comma"
            : "Add another…"}
          onInput={(e) => (draft.value = e.currentTarget.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onPaste={onPaste}
        />
      </div>
      <p class={`${ADMIN_TYPE_META} mt-1`}>
        Press Space, Comma or Enter to add a tag.
      </p>
    </div>
  );
}
