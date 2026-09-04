// Page editor form: navigation beside SEO, then Markdown or blank HTML body.
// Source: ai/requirements.md F2, UI rules 5.1.

import type { ComponentChildren } from "preact";
import type { Page } from "@/types/index.ts";
import SlugField from "@/islands/SlugField.tsx";
import PageBodyEditor from "@/islands/PageBodyEditor.tsx";
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

export function PageForm(
  { page, isNew = false }: { page: Page; isNew?: boolean },
) {
  return (
    <form method="post" class="space-y-6">
      <UnsavedChangesGuard
        forceConfirm={isNew}
        title={isNew ? "Cancel creation?" : undefined}
        message={isNew
          ? "This page was never saved. Discard it and leave?"
          : undefined}
        stayLabel={isNew ? "Keep editing" : undefined}
        leaveLabel={isNew ? "Discard" : undefined}
        discardActionUrl={isNew
          ? `/admin/pages?id=${encodeURIComponent(page.id)}`
          : undefined}
      />

      <div class="grid gap-6 xl:grid-cols-2 items-start">
        <FieldSection
          title="Page"
          description="Title, slug and menu placement."
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
            <label class={labelCls} for="menuOrder">Menu order</label>
            <input
              id="menuOrder"
              type="number"
              name="menuOrder"
              value={page.menuOrder}
              class={inputCls}
            />
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
            <label class={labelCls} for="metaDescription">
              Meta description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              rows={3}
              class={inputCls}
              placeholder="Short summary for search results"
            >
              {page.metaDescription ?? ""}
            </textarea>
          </div>
        </FieldSection>
      </div>

      <FieldSection
        title="Content"
        description="Markdown in the blog layout, or standalone HTML."
      >
        <PageBodyEditor
          initialTemplate={page.template}
          initialContent={page.content}
        />
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
