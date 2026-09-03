// Page editor form: grouped cards matching the Post editor layout.
// Pages have no draft/status — content, navigation and SEO only.
// Source: ai/requirements.md F2, UI rules 5.1.

import type { ComponentChildren } from "preact";
import type { Page } from "@/types/index.ts";
import SlugField from "@/islands/SlugField.tsx";
import MarkdownEditor from "@/islands/MarkdownEditor.tsx";
import UnsavedChangesGuard from "@/islands/UnsavedChangesGuard.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_INLINE_LABEL,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_WARN,
} from "@/components/AdminPage.tsx";

const inputCls = ADMIN_INPUT;
const labelCls = ADMIN_TYPE_LABEL;

function FieldSection(props: {
  title: string;
  description?: string;
  children: ComponentChildren;
}) {
  return (
    <section class={`${ADMIN_CARD} space-y-4`}>
      <div>
        <h2 class={ADMIN_TYPE_CARD_TITLE}>{props.title}</h2>
        {props.description && (
          <p class={`${ADMIN_TYPE_MUTED} mt-1`}>{props.description}</p>
        )}
      </div>
      {props.children}
    </section>
  );
}

export function PageForm({ page }: { page: Page }) {
  return (
    <form method="post" class="space-y-6">
      <UnsavedChangesGuard />
      <FieldSection
        title="Content"
        description="Title, URL slug and Markdown body."
      >
        <div>
          <label class={labelCls} for="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={page.title}
            class={inputCls}
          />
        </div>
        <div>
          <label class={labelCls}>Slug</label>
          <SlugField
            initialValue={page.slug}
            excludeId={page.id}
            type="page"
          />
          <p class={`${ADMIN_TYPE_WARN} mt-1`}>
            Warning: changing the slug breaks existing URLs.
          </p>
        </div>
        <div>
          <label class={labelCls} for="content">Content (Markdown)</label>
          <MarkdownEditor initialContent={page.content} />
        </div>
      </FieldSection>

      <FieldSection
        title="Navigation"
        description="How this page appears in the site menu."
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class={labelCls} for="template">Template</label>
            <select id="template" name="template" class={inputCls}>
              <option value="default" selected={page.template === "default"}>
                default (with sidebar)
              </option>
              <option
                value="full-width"
                selected={page.template === "full-width"}
              >
                full-width
              </option>
            </select>
          </div>
          <div>
            <label class={labelCls} for="menuOrder">Menu order</label>
            <input
              id="menuOrder"
              type="number"
              name="menuOrder"
              value={page.menuOrder}
              class={inputCls}
            />
          </div>
        </div>
        <label class={ADMIN_TYPE_INLINE_LABEL}>
          <input
            type="checkbox"
            name="showInMenu"
            checked={page.showInMenu}
          />
          Show in menu
        </label>
      </FieldSection>

      <FieldSection
        title="SEO"
        description="Optional overrides for search and sharing."
      >
        <div>
          <label class={labelCls} for="metaTitle">Meta title</label>
          <input
            id="metaTitle"
            name="metaTitle"
            type="text"
            value={page.metaTitle ?? ""}
            class={inputCls}
            placeholder="Defaults to the page title"
          />
        </div>
        <div>
          <label class={labelCls} for="metaDescription">Meta description</label>
          <textarea
            id="metaDescription"
            name="metaDescription"
            rows={2}
            class={inputCls}
            placeholder="Short summary for search results"
          >
            {page.metaDescription ?? ""}
          </textarea>
        </div>
      </FieldSection>

      <div
        class={`${ADMIN_CARD} flex flex-wrap items-center gap-2 sticky bottom-4 z-10 shadow-sm`}
      >
        <button
          type="submit"
          name="action"
          value="save"
          class={ADMIN_BTN_PRIMARY}
        >
          Save page
        </button>
      </div>
    </form>
  );
}
