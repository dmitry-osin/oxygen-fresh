// Post editor form: every editable field is visible on screen
// (no hidden "advanced" panels). Source: ai/requirements.md 5.1, F1.
// The plain textarea is replaced by the split-pane MarkdownEditor island
// in stage 7 (F4).

import type { Post } from "@/types/index.ts";
import SlugField from "@/islands/SlugField.tsx";

const inputCls = "w-full border border-gray-300 rounded px-3 py-2";
const labelCls = "block text-sm font-medium mb-1";

export function PostForm({ post }: { post: Post }) {
  return (
    <form method="post" class="space-y-4">
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
          <p class="text-amber-700 text-sm mt-1">
            Warning: changing the slug breaks existing URLs.
          </p>
        )}
      </div>
      <div>
        <label class={labelCls} for="content">Content (Markdown)</label>
        <textarea
          id="content"
          name="content"
          rows={18}
          class={`${inputCls} font-mono`}
        >
          {post.content}
        </textarea>
      </div>
      <div>
        <label class={labelCls} for="excerpt">
          Excerpt (auto-generated from content when empty)
        </label>
        <textarea id="excerpt" name="excerpt" rows={2} class={inputCls}>
          {post.excerpt}
        </textarea>
      </div>
      <div>
        <label class={labelCls} for="tags">Tags (comma-separated)</label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={post.tags.join(", ")}
          class={inputCls}
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class={labelCls} for="template">Template</label>
          <select id="template" name="template" class={inputCls}>
            <option value="default" selected={post.template === "default"}>
              default (with sidebar)
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
          <label class={labelCls} for="status">Status</label>
          <select
            id="status"
            name="status"
            class={inputCls}
            disabled={post.status === "published"}
          >
            <option value="draft" selected={post.status === "draft"}>
              draft
            </option>
            <option value="scheduled" selected={post.status === "scheduled"}>
              scheduled
            </option>
          </select>
        </div>
      </div>
      <div>
        <label class={labelCls} for="publishedAt">
          Publish at (for scheduled posts)
        </label>
        <input
          id="publishedAt"
          name="publishedAt"
          type="datetime-local"
          value={post.publishedAt?.slice(0, 16) ?? ""}
          class={inputCls}
        />
      </div>
      <div>
        <label class={labelCls} for="metaTitle">
          Meta title (SEO override)
        </label>
        <input
          id="metaTitle"
          name="metaTitle"
          type="text"
          value={post.metaTitle ?? ""}
          class={inputCls}
        />
      </div>
      <div>
        <label class={labelCls} for="metaDescription">
          Meta description (SEO override)
        </label>
        <textarea
          id="metaDescription"
          name="metaDescription"
          rows={2}
          class={inputCls}
        >
          {post.metaDescription ?? ""}
        </textarea>
      </div>
      <div>
        <label class={labelCls} for="canonicalUrl">
          Canonical URL (optional override)
        </label>
        <input
          id="canonicalUrl"
          name="canonicalUrl"
          type="text"
          value={post.canonicalUrl ?? ""}
          class={inputCls}
        />
      </div>
      <div class="flex gap-2 pt-2">
        <button
          type="submit"
          name="action"
          value="save"
          class="bg-gray-900 text-white rounded px-4 py-2 font-medium"
        >
          Save
        </button>
        <button
          type="submit"
          name="action"
          value="publish"
          class="bg-green-700 text-white rounded px-4 py-2 font-medium"
        >
          {post.status === "published" ? "Publish new version" : "Publish"}
        </button>
      </div>
    </form>
  );
}
