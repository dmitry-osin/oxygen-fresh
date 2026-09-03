// Public site header: brand, navigation, search. Server-rendered (UI 5.2).
// Sticky positioning lives on PublicLayout chrome wrapper.

import { Search, Wind } from "lucide-preact";
import type { NavLink } from "@/lib/menu.ts";
import {
  PUBLIC_LINK_NAV,
  PUBLIC_SHELL,
  PUBLIC_TYPE_SITE_TITLE,
} from "@/lib/public-ui.ts";

export function Header(
  { navLinks, siteName, logoUrl }: {
    navLinks: NavLink[];
    siteName: string;
    logoUrl?: string;
  },
) {
  return (
    <header>
      <div
        class={`${PUBLIC_SHELL} py-4 flex items-center justify-between gap-4`}
      >
        <a
          href="/"
          class={`flex items-center gap-2.5 min-w-0 ${PUBLIC_TYPE_SITE_TITLE}`}
        >
          {logoUrl
            ? (
              <img
                src={logoUrl}
                alt=""
                class="h-7 w-auto shrink-0"
              />
            )
            : (
              <Wind
                class="shrink-0 text-gray-700 dark:text-gray-300"
                size={22}
                aria-hidden="true"
              />
            )}
          <span class="truncate">{siteName}</span>
        </a>
        <nav class="flex items-center gap-1 sm:gap-2">
          <ul class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
            {navLinks.map((link) => (
              <li key={link.href + link.label}>
                <a href={link.href} class={PUBLIC_LINK_NAV}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/search"
            class={`${PUBLIC_LINK_NAV} p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800`}
            aria-label="Search"
          >
            <Search size={18} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
