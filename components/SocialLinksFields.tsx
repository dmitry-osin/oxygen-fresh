// Social links field group for the settings form (F12): one row per
// existing link plus three empty rows, all submitted as parallel
// socialPlatform / socialUrl arrays - no client JS needed.

import type { Settings } from "@/types/index.ts";

const INPUT =
  "border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded px-3 py-2";

const EMPTY_ROWS = 3;

export function SocialLinksFields(
  { links }: { links: Settings["socialLinks"] },
) {
  const rows = [
    ...links,
    ...Array.from({ length: EMPTY_ROWS }, () => ({ platform: "", url: "" })),
  ];
  return (
    <div>
      <span class="block text-sm font-medium mb-1">
        Social links (platform and URL per row)
      </span>
      {rows.map((link, index) => (
        <div class="flex gap-2 mb-2" key={index}>
          <input
            name="socialPlatform"
            type="text"
            value={link.platform}
            placeholder="Platform (e.g. GitHub)"
            class={`${INPUT} w-1/3`}
          />
          <input
            name="socialUrl"
            type="text"
            value={link.url}
            placeholder="https://github.com/you"
            class={`${INPUT} flex-1`}
          />
        </div>
      ))}
    </div>
  );
}
