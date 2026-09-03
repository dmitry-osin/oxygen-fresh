// Social links field group for settings / profile forms: one row per
// existing link plus three empty rows, all submitted as parallel
// socialPlatform / socialUrl arrays - no client JS needed.

import { ADMIN_INPUT, ADMIN_TYPE_LABEL } from "@/lib/admin-ui.ts";

const INPUT = ADMIN_INPUT;

const EMPTY_ROWS = 3;

type SocialLink = { platform: string; url: string };

export function SocialLinksFields(
  { links }: { links: SocialLink[] },
) {
  const rows = [
    ...links,
    ...Array.from({ length: EMPTY_ROWS }, () => ({ platform: "", url: "" })),
  ];
  return (
    <div>
      <span class={ADMIN_TYPE_LABEL}>
        Social links (platform and URL per row)
      </span>
      {rows.map((link, index) => (
        <div
          class="grid grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)] gap-2 mb-2"
          key={index}
        >
          <input
            name="socialPlatform"
            type="text"
            value={link.platform}
            placeholder="Platform (e.g. GitHub)"
            class={INPUT}
          />
          <input
            name="socialUrl"
            type="url"
            value={link.url}
            placeholder="https://github.com/you"
            class={INPUT}
          />
        </div>
      ))}
    </div>
  );
}
