// Page body editor: Markdown (default/full-width) or raw HTML (blank).
// Template select lives here so switching format updates the editor live.

import { useSignal } from "@preact/signals";
import type { Page } from "@/types/index.ts";
import MarkdownEditor from "@/islands/MarkdownEditor.tsx";
import {
  ADMIN_INPUT,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

const inputCls = ADMIN_INPUT;
const labelCls = ADMIN_TYPE_LABEL;

const TEMPLATES: { value: Page["template"]; hint: string }[] = [
  { value: "default", hint: "Blog chrome + sidebar" },
  { value: "full-width", hint: "Blog chrome, no sidebar" },
  {
    value: "blank",
    hint: "Standalone HTML — no blog UI; put CSS/JS in the markup",
  },
];

export default function PageBodyEditor(props: {
  initialTemplate: Page["template"];
  initialContent: string;
}) {
  const template = useSignal<Page["template"]>(props.initialTemplate);

  return (
    <div class="space-y-4">
      <div>
        <label class={labelCls} for="template">Template</label>
        <select
          id="template"
          name="template"
          class={inputCls}
          value={template.value}
          onChange={(e) => {
            template.value = (e.currentTarget.value as Page["template"]) ||
              "default";
          }}
        >
          {TEMPLATES.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              selected={template.value === opt.value}
            >
              {opt.value}
            </option>
          ))}
        </select>
        <p class={`${ADMIN_TYPE_MUTED} mt-1`}>
          {TEMPLATES.find((t) => t.value === template.value)?.hint}
        </p>
      </div>

      {template.value === "blank"
        ? (
          <div>
            <label class={labelCls} for="content">HTML document</label>
            <textarea
              id="content"
              name="content"
              rows={22}
              class={`${inputCls} font-mono text-sm`}
              placeholder={`<!-- Fragment or full <!DOCTYPE html>… -->
<style>
  body { font-family: system-ui; margin: 2rem; }
</style>
<h1>Hello</h1>
<script>
  console.log("blank page");
</script>`}
            >
              {props.initialContent}
            </textarea>
            <p class={`${ADMIN_TYPE_MUTED} mt-2`}>
              Paste a full HTML document or a fragment (we wrap fragments).
              Include {"<style>"} and {"<script>"}{" "}
              in the same field — they are part of the page. Only admins can
              edit this.
            </p>
          </div>
        )
        : (
          <div>
            <label class={labelCls} for="content">Content (Markdown)</label>
            <MarkdownEditor initialContent={props.initialContent} />
          </div>
        )}
    </div>
  );
}
