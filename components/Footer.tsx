// Public site footer. Minimal, typography-first (UI 5.2).
// Social links come from the site settings (F12); the dark theme toggle
// (F17) lives here - the only interactive element on public pages.

import type { Settings } from "@/types/index.ts";
import PublicThemeToggle from "@/islands/PublicThemeToggle.tsx";

export function Footer(
  { siteName, socialLinks = [] }: {
    siteName: string;
    socialLinks?: Settings["socialLinks"];
  },
) {
  const year = new Date().getFullYear();
  return (
    <footer class="border-t border-gray-200 dark:border-gray-800 mt-16">
      <div class="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
        <span>&copy; {year} {siteName}</span>
        <ul class="flex gap-4 items-center">
          {socialLinks.map((link) => (
            <li key={link.platform + link.url}>
              <a
                href={link.url}
                rel="noopener"
                class="hover:text-gray-900 dark:hover:text-gray-200"
              >
                {link.platform}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/rss.xml"
              class="hover:text-gray-900 dark:hover:text-gray-200"
            >
              RSS
            </a>
          </li>
          <li>
            <PublicThemeToggle />
          </li>
        </ul>
      </div>
    </footer>
  );
}
