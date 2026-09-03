// Short link controls for a published post editor.
// Creates /s/{code} redirects (302) via the shared redirects store.
// Uses form="…" so the panel can sit inside the post editor without nested forms.

import type { RedirectEntry } from "@/types/index.ts";
import CopyTextButton from "@/islands/CopyTextButton.tsx";
import { ConfirmDeleteTrigger } from "@/components/ConfirmDeleteTrigger.tsx";
import { absoluteUrl } from "@/lib/seo.ts";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD,
  ADMIN_TYPE_CARD_TITLE,
  ADMIN_TYPE_MUTED,
} from "@/lib/admin-ui.ts";

/** Hidden form id for create-short submits from inside the post editor. */
export const SHORT_LINK_FORM_ID = "post-short-link";

export function PostShortLinkPanel(
  { shortLink }: { shortLink: RedirectEntry | null },
) {
  if (!shortLink) {
    return (
      <section class={`${ADMIN_CARD} space-y-3`}>
        <h2 class={ADMIN_TYPE_CARD_TITLE}>Short link</h2>
        <p class={ADMIN_TYPE_MUTED}>
          Create a short share URL like <code class="text-xs">/s/…</code>{" "}
          that redirects to this post.
        </p>
        <button
          type="submit"
          form={SHORT_LINK_FORM_ID}
          name="action"
          value="create-short"
          class={ADMIN_BTN_PRIMARY}
        >
          Create short link
        </button>
      </section>
    );
  }

  const url = absoluteUrl(shortLink.from);
  return (
    <section class={`${ADMIN_CARD} space-y-3`}>
      <h2 class={ADMIN_TYPE_CARD_TITLE}>Short link</h2>
      <p class="font-mono text-sm break-all">{url}</p>
      <p class={ADMIN_TYPE_MUTED}>
        Redirects with {shortLink.code} to{" "}
        <code class="text-xs">{shortLink.to}</code>
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <CopyTextButton text={url} />
        <a
          href={shortLink.from}
          target="_blank"
          rel="noopener noreferrer"
          class={ADMIN_BTN_SECONDARY}
        >
          Open
        </a>
        <ConfirmDeleteTrigger
          itemName={shortLink.from}
          action="delete-short"
          label="Remove"
          size="sm"
        />
      </div>
    </section>
  );
}
