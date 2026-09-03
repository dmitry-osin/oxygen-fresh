// Split-pane Markdown editor island (F4): textarea on the left, live preview
// on the right rendered server-side via /api/preview (debounced 300ms),
// toolbar, media library modal, focus mode.
// Source: ai/requirements.md F4 (section 7.1).

import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { MediaFile } from "@/lib/media.ts";
import MediaPicker from "@/islands/MediaPicker.tsx";
import { ADMIN_BTN_ROW, ADMIN_TYPE_META } from "@/lib/admin-ui.ts";

interface EditorProps {
  initialContent: string;
}

/** highlight.js aliases (lib/markdown.ts). */
const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX" },
  { value: "jsx", label: "JSX" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
];

export default function MarkdownEditor(props: EditorProps) {
  const content = useSignal(props.initialContent);
  const preview = useSignal("");
  const focusMode = useSignal(false);
  const syncScroll = useSignal(false);
  const codeLang = useSignal("typescript");
  const mediaOpen = useSignal(false);
  const mediaFiles = useSignal<MediaFile[]>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncingScroll = useRef(false);
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

  // Ensure the live signal is flushed into the DOM before FormData is built.
  // Controlled island textareas can otherwise submit a stale/empty value.
  useEffect(() => {
    const form = areaRef.current?.form ??
      areaRef.current?.closest("form");
    if (!form) return;
    function onSubmit() {
      const area = areaRef.current;
      if (area) area.value = content.value;
    }
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  /** Keep the paired pane at the same scroll ratio (0–1). */
  function mirrorScroll(source: HTMLElement, target: HTMLElement) {
    if (!syncScroll.value || syncingScroll.current) return;
    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    if (sourceMax <= 0 || targetMax <= 0) return;
    syncingScroll.current = true;
    target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
    requestAnimationFrame(() => {
      syncingScroll.current = false;
    });
  }

  function onEditorScroll() {
    const area = areaRef.current;
    const pane = previewRef.current;
    if (area && pane) mirrorScroll(area, pane);
  }

  function onPreviewScroll() {
    const area = areaRef.current;
    const pane = previewRef.current;
    if (area && pane) mirrorScroll(pane, area);
  }

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

  /** Fenced code block with a highlight.js language id. */
  function insertCodeBlock() {
    const area = areaRef.current;
    if (!area) return;
    const { selectionStart: s, selectionEnd: e, value } = area;
    const lang = codeLang.value;
    const selected = value.slice(s, e);
    const body = selected || "";
    const block = `\`\`\`${lang}\n${body}\n\`\`\``;
    content.value = value.slice(0, s) + block + value.slice(e);
    schedulePreview();
    requestAnimationFrame(() => {
      area.focus();
      const cursor = s + `\`\`\`${lang}\n`.length + body.length;
      area.setSelectionRange(cursor, cursor);
    });
  }

  function selectionToIntro() {
    const area = areaRef.current;
    if (!area) return;
    const selected = area.value.slice(area.selectionStart, area.selectionEnd)
      .trim();
    if (!selected) return;
    const intro = document.getElementById("excerpt");
    if (!(intro instanceof HTMLTextAreaElement)) return;
    intro.value = selected;
    intro.dispatchEvent(new Event("input", { bubbles: true }));
    intro.focus();
  }

  const tools = [
    { label: "B", title: "Bold", run: () => applyWrap("**") },
    { label: "I", title: "Italic", run: () => applyWrap("*") },
    { label: "H", title: "Heading", run: () => applyLinePrefix("## ") },
    { label: "Link", title: "Link", run: () => insertText("[text](https://)") },
    { label: "Quote", title: "Quote", run: () => applyLinePrefix("> ") },
    { label: "List", title: "List", run: () => applyLinePrefix("- ") },
  ];

  const btnCls = ADMIN_BTN_ROW;

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
        <select
          class="border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-900"
          value={codeLang.value}
          onChange={(e) => (codeLang.value = e.currentTarget.value)}
          aria-label="Code block language"
        >
          {CODE_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
        <button
          type="button"
          title="Insert fenced code block with syntax highlighting"
          class={btnCls}
          onClick={insertCodeBlock}
        >
          Code
        </button>
        <button
          type="button"
          title="Copy the selected text into Intro"
          class={btnCls}
          onClick={selectionToIntro}
        >
          To Intro
        </button>
        <span class="flex-1" />
        {!focusMode.value && (
          <button
            type="button"
            title="Keep editor and preview scrolled together"
            class={`${btnCls} ${
              syncScroll.value
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : ""
            }`}
            aria-pressed={syncScroll.value}
            onClick={() => (syncScroll.value = !syncScroll.value)}
          >
            {syncScroll.value ? "Sync on" : "Sync scroll"}
          </button>
        )}
        <button
          type="button"
          class={btnCls}
          onClick={() => {
            focusMode.value = !focusMode.value;
            if (focusMode.value) syncScroll.value = false;
          }}
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
          onScroll={onEditorScroll}
          class="w-full h-[42.5rem] max-h-[42.5rem] overflow-y-auto resize-none border border-gray-300 dark:border-gray-700 rounded px-3 py-2 font-mono bg-white dark:bg-gray-900"
        />
        {!focusMode.value && (
          <div
            ref={previewRef}
            onScroll={onPreviewScroll}
            class="markdown-preview prose dark:prose-invert max-w-none border border-gray-200 dark:border-gray-700 rounded px-3 py-2 overflow-auto bg-white dark:bg-gray-900 h-[42.5rem] max-h-[42.5rem]"
            // deno-lint-ignore react-no-danger -- sanitized server-side by /api/preview (renderMarkdown)
            dangerouslySetInnerHTML={{ __html: preview.value }}
          />
        )}
      </div>
      <p class={`${ADMIN_TYPE_META} mt-2`}>
        Code blocks: fence with a language, e.g. ```typescript — highlighted on
        the public site via highlight.js.
      </p>

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
