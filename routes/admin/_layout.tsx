// Admin layout: persistent left sidebar, every section reachable in one
// click. The login page is rendered without the sidebar.
// Source: ai/requirements.md 5.1 (single sidebar navigation).

import { define } from "@/utils.ts";
import ThemeToggle from "@/islands/ThemeToggle.tsx";

const SECTIONS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/analytics", label: "Analytics" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export default define.layout(function AdminLayout(ctx) {
  // The login page must not show the admin chrome.
  if (ctx.url.pathname === "/admin/login") return <ctx.Component />;

  return (
    <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
      <aside class="w-52 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div class="px-4 py-5 border-b border-gray-200 dark:border-gray-800">
          <a href="/admin" class="font-bold">
            {ctx.state.siteName ?? "oxygen-blog"}
          </a>
          <p class="text-xs text-gray-500 mt-1">{ctx.state.user?.username}</p>
        </div>
        <nav class="flex-1 px-2 py-4">
          <ul class="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <a
                  href={section.href}
                  class={`block rounded px-3 py-2 text-sm ${
                    isActive(ctx.url.pathname, section.href)
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <ThemeToggle theme={ctx.state.theme ?? "system"} />
          <form method="post" action="/admin/logout">
            <button
              type="submit"
              class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main class="flex-1 min-w-0">
        <ctx.Component />
      </main>
    </div>
  );
});
