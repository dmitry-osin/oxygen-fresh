// Public site footer. Minimal, typography-first (UI 5.2).
// Social links come from the site settings (F12).

import type { Settings } from "@/types/index.ts";

export function Footer(
  { siteName, socialLinks = [] }: {
    siteName: string;
    socialLinks?: Settings["socialLinks"];
  },
) {
  const year = new Date().getFullYear();
  return (
    <footer class="border-t border-gray-200 mt-16">
      <div class="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-500 flex justify-between">
        <span>&copy; {year} {siteName}</span>
        <ul class="flex gap-4 items-center">
          {socialLinks.map((link) => (
            <li key={link.platform + link.url}>
              <a
                href={link.url}
                rel="noopener"
                class="hover:text-gray-900"
              >
                {link.platform}
              </a>
            </li>
          ))}
          <li>
            <a href="/rss.xml" class="hover:text-gray-900">RSS</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
