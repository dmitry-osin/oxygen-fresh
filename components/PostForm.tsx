// Post editor form: title/slug + publishing beside SEO, then Markdown body.
// Source: ai/requirements.md 5.1, F1. MarkdownEditor island (F4).

import type { ComponentChildren } from "preact";
import type { Post, RedirectEntry } from "@/types/index.ts";
import SlugField from "@/islands/SlugField.tsx";
import MarkdownEditor from "@/islands/MarkdownEditor.tsx";
import TagInput from "@/islands/TagInput.tsx";
import UnsavedChangesGuard from "@/islands/UnsavedChangesGuard.tsx";
import {
  PostShortLinkPanel,
  SHORT_LINK_FORM_ID,
} from "@/components/PostShortLinkPanel.tsx";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_BTN_SUCCESS,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_WARN,
} from "@/components/AdminPage.tsx";

const inputCls = ADMIN_INPUT;
const labelCls = ADMIN_TYPE_LABEL;

/** Value for <input type="datetime-local"> in the browser's local TZ. */
function toDatetimeLocal(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return toDatetimeLocal(null);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${
    pad(d.getHours())
  }:${pad(d.getMinutes())}`;
}

function FieldSection(props: {
  title: string;
  description?: string;
  children: ComponentChildren;
  class?: string;
}) {
  return (
    <section class={`${ADMIN_CARD} space-y-4 ${props.class ?? ""}`}>
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

export function PostForm(
  {
    post,
    shortLink = null,
    isNew = false,
  }: {
    post: Post;
    shortLink?: RedirectEntry | null;
    /** Freshly created draft — leaving cancels creation. */
    isNew?: boolean;
  },
) {
  return (
    <div class="space-y-6">
      {post.status === "published" && (
        <form id={SHORT_LINK_FORM_ID} method="post" class="hidden" />
      )}

      <form method="post" class="space-y-6">
        <UnsavedChangesGuard
          forceConfirm={isNew}
          title={isNew ? "Cancel creation?" : undefined}
          message={isNew
            ? "This post was never saved. Discard it and leave?"
            : undefined}
          stayLabel={isNew ? "Keep editing" : undefined}
          leaveLabel={isNew ? "Discard" : undefined}
          discardActionUrl={isNew
            ? `/admin/posts?id=${encodeURIComponent(post.id)}`
            : undefined}
        />

        <div class="grid gap-6 xl:grid-cols-2 items-start">
          <FieldSection
            title="Publishing"
            description="Title, slug, status, tags and intro."
          >
            <div>
              <label class={labelCls} for="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={post.title}
                class={inputCls}
              />
            </div>
            <div>
              <label class={labelCls}>Slug</label>
              <SlugField initialValue={post.slug} excludeId={post.id} />
              {post.status === "published" && (
                <p class={`${ADMIN_TYPE_WARN} mt-1`}>
                  Warning: changing the slug breaks existing URLs.
                </p>
              )}
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div>
                <label class={labelCls} for="status">Status</label>
                <div class="flex flex-wrap items-center gap-2">
                  {post.status === "published"
                    ? (
                      <>
                        <input type="hidden" name="status" value="published" />
                        <p
                          class={`${inputCls} flex-1 min-w-28 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300`}
                        >
                          published
                        </p>
                        <button
                          type="submit"
                          name="action"
                          value="unpublish"
                          class={ADMIN_BTN_SECONDARY}
                        >
                          Unpublish
                        </button>
                      </>
                    )
                    : (
                      <select
                        id="status"
                        name="status"
                        class={inputCls}
                      >
                        <option
                          value="draft"
                          selected={post.status === "draft"}
                        >
                          draft
                        </option>
                        <option
                          value="scheduled"
                          selected={post.status === "scheduled"}
                        >
                          scheduled
                        </option>
                      </select>
                    )}
                </div>
              </div>
              <div>
                <label class={labelCls} for="template">Template</label>
                <select id="template" name="template" class={inputCls}>
                  <option
                    value="default"
                    selected={post.template === "default"}
                  >
                    default
                  </option>
                  <option
                    value="full-width"
                    selected={post.template === "full-width"}
                  >
                    full-width
                  </option>
                </select>
              </div>
              <div>
                <label class={labelCls} for="publishedAt">Publish at</label>
                <input
                  id="publishedAt"
                  name="publishedAt"
                  type="datetime-local"
                  value={toDatetimeLocal(post.publishedAt)}
                  class={inputCls}
                />
              </div>
            </div>
            {post.status !== "published" && (
              <p class={ADMIN_TYPE_MUTED}>
                Publish at is used when status is scheduled. Defaults to now.
              </p>
            )}
            <div>
              <label class={labelCls}>Tags</label>
              <TagInput initialTags={post.tags} />
            </div>
            <div>
              <label class={labelCls} for="excerpt">Intro</label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                class={inputCls}
                placeholder="Auto-generated from content when empty. Use “To Intro” in the editor toolbar to fill from a selection."
              >
                {post.excerpt}
              </textarea>
            </div>
          </FieldSection>

          <div class="space-y-6">
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
                  value={post.metaTitle ?? ""}
                  class={inputCls}
                  placeholder="Defaults to the post title"
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
                  placeholder="Defaults to the intro"
                >
                  {post.metaDescription ?? ""}
                </textarea>
              </div>
              <div>
                <label class={labelCls} for="canonicalUrl">Canonical URL</label>
                <input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  type="text"
                  value={post.canonicalUrl ?? ""}
                  class={inputCls}
                  placeholder="https://…"
                />
              </div>
            </FieldSection>

            {post.status === "published" && (
              <PostShortLinkPanel shortLink={shortLink} />
            )}
          </div>
        </div>

        <FieldSection
          title="Content"
          description="Markdown body."
        >
          <div>
            <label class={labelCls} for="content">Content (Markdown)</label>
            <MarkdownEditor initialContent={post.content} />
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
            {post.status === "published" ? "Save" : "Save draft"}
          </button>
          <button
            type="submit"
            name="action"
            value="publish"
            class={ADMIN_BTN_SUCCESS}
          >
            {post.status === "published" ? "Publish new version" : "Publish"}
          </button>
          {post.status === "published" && (
            <a
              href={`/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              class={ADMIN_BTN_SECONDARY}
            >
              View post
            </a>
          )}
          <div class="ml-auto">
            <ConfirmDeleteTrigger itemName={post.title} />
          </div>
        </div>
      </form>
    </div>
  );
}
