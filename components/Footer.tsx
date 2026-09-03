// Public site footer. Description, social links, RSS, theme toggle (F17).

import type { Settings } from "@/types/index.ts";
import PublicThemeToggle from "@/islands/PublicThemeToggle.tsx";
import {
  PUBLIC_DIVIDER,
  PUBLIC_LINK,
  PUBLIC_SHELL,
  PUBLIC_TYPE_MUTED,
} from "@/lib/public-ui.ts";

export function Footer(
  { siteName, footerDescription, socialLinks = [] }: {
    siteName: string;
    footerDescription?: string;
    socialLinks?: Settings["socialLinks"];
  },
) {
  const year = new Date().getFullYear();
  return (
    <footer
      class={`border-t ${PUBLIC_DIVIDER} bg-white dark:bg-gray-950 shrink-0`}
    >
      <div
        class={`${PUBLIC_SHELL} py-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6 ${PUBLIC_TYPE_MUTED}`}
      >
        <div class="min-w-0 space-y-1.5">
          <p>&copy; {year} {siteName}</p>
          {footerDescription && (
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
              {footerDescription}
            </p>
          )}
        </div>
        <ul class="flex flex-wrap gap-x-4 gap-y-2 items-center shrink-0">
          {socialLinks.map((link) => (
            <li key={link.platform + link.url}>
              <a href={link.url} rel="noopener noreferrer" class={PUBLIC_LINK}>
                {link.platform}
              </a>
            </li>
          ))}
          <li>
            <a href="/rss.xml" class={PUBLIC_LINK}>RSS</a>
          </li>
          <li>
            <PublicThemeToggle />
          </li>
        </ul>
      </div>
    </footer>
  );
}
