// Split-pane Markdown editor island (F4): textarea on the left, live preview
// on the right rendered server-side via /api/preview (debounced 300ms),
// toolbar, media library modal, focus mode.
// Source: ai/requirements.md F4 (section 7.1).

import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { MediaFile } from "@/lib/media.ts";
import MediaPicker from "@/islands/MediaPicker.tsx";

interface EditorProps {
  initialContent: string;
}

export default function MarkdownEditor(props: EditorProps) {
  const content = useSignal(props.initialContent);
  const preview = useSignal("");
  const focusMode = useSignal(false);
  const mediaOpen = useSignal(false);
  const mediaFiles = useSignal<MediaFile[]>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  async function updatePreview() {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: content.value }),
    });
    if (res.ok) preview.value = (await res.json()).html;
  }

  function schedulePreview() {
    clearTimeout(timer.current);
    timer.current = setTimeout(updatePreview, 300);
  }

  useEffect(() => {
    updatePreview();
  }, []);

  /** Wrap the current selection with prefix/suffix (bold, italic, code). */
  function applyWrap(prefix: string, suffix = prefix) {
    const area = areaRef.current;
    if (!area) return;
    const { selectionStart: s, selectionEnd: e, value } = area;
    content.value = value.slice(0, s) + prefix + value.slice(s, e) + suffix +
      value.slice(e);
    schedulePreview();
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(s + prefix.length, e + prefix.length);
    });
  }

  /** Prefix the current line (heading, quote, list item). */
  function applyLinePrefix(prefix: string) {
    const area = areaRef.current;
    if (!area) return;
    const { selectionStart: s, value } = area;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    content.value = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    schedulePreview();
    requestAnimationFrame(() => area.focus());
  }

  /** Insert text at the cursor (link, image). */
  function insertText(text: string) {
    const area = areaRef.current;
    if (!area) return;
    const { selectionStart: s, value } = area;
    content.value = value.slice(0, s) + text + value.slice(s);
    schedulePreview();
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(s + text.length, s + text.length);
    });
  }

  async function openMedia() {
    mediaOpen.value = true;
    const res = await fetch("/admin/api/media");
    if (res.ok) mediaFiles.value = (await res.json()).files;
  }

  function pickImage(file: MediaFile) {
    insertText(`![${file.name}](${file.url})`);
    mediaOpen.value = false;
  }

  const tools = [
    { label: "B", title: "Bold", run: () => applyWrap("**") },
    { label: "I", title: "Italic", run: () => applyWrap("*") },
    { label: "H", title: "Heading", run: () => applyLinePrefix("## ") },
    { label: "Link", title: "Link", run: () => insertText("[text](https://)") },
    {
      label: "Code",
      title: "Code block",
      run: () => applyWrap("```\n", "\n```"),
    },
    { label: "Quote", title: "Quote", run: () => applyLinePrefix("> ") },
    { label: "List", title: "List", run: () => applyLinePrefix("- ") },
  ];

  const btnCls =
    "px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800";

  return (
    <div>
      <div class="flex flex-wrap gap-1 mb-2">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            class={btnCls}
            onClick={tool.run}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          title="Insert image"
          class={btnCls}
          onClick={openMedia}
        >
          Image
        </button>
        <span class="flex-1" />
        <button
          type="button"
          class={btnCls}
          onClick={() => (focusMode.value = !focusMode.value)}
        >
          {focusMode.value ? "Show preview" : "Focus mode"}
        </button>
      </div>

      <div
        class={`grid gap-4 ${focusMode.value ? "grid-cols-1" : "grid-cols-2"}`}
      >
        <textarea
          ref={areaRef}
          id="content"
          name="content"
          rows={18}
          value={content.value}
          onInput={(e) => {
            content.value = e.currentTarget.value;
            schedulePreview();
          }}
          class="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 font-mono bg-white dark:bg-gray-900"
        />
        {!focusMode.value && (
          <div
            class="prose max-w-none border border-gray-200 dark:border-gray-700 rounded px-3 py-2 overflow-auto bg-white dark:bg-gray-900"
            // deno-lint-ignore react-no-danger -- sanitized server-side by /api/preview (renderMarkdown)
            dangerouslySetInnerHTML={{ __html: preview.value }}
          />
        )}
      </div>

      {mediaOpen.value && (
        <MediaPicker
          files={mediaFiles.value}
          onPick={pickImage}
          onClose={() => (mediaOpen.value = false)}
        />
      )}
    </div>
  );
}
