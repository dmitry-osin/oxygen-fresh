// Public site header: site name + navigation from the menu (F6).
// Server-rendered, no client JS (UI 5.2). Dark variants for F17.

import type { NavLink } from "@/lib/menu.ts";

export function Header(
  { navLinks, siteName }: { navLinks: NavLink[]; siteName: string },
) {
  return (
    <header class="border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
        <a href="/" class="text-xl font-bold tracking-tight">{siteName}</a>
        <nav>
          <ul class="flex gap-5 text-sm">
            {navLinks.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
