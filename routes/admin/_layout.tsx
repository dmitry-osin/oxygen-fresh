// Admin layout: persistent left sidebar with grouped sections and icons.
// Settings lives in the footer next to theme (not in the main nav list).
// Source: ai/requirements.md 5.1 (single sidebar navigation).

import type { LucideIcon } from "lucide-preact";
import {
  Archive,
  ArrowRightLeft,
  BarChart3,
  ExternalLink,
  File,
  FileText,
  Gauge,
  Image,
  LayoutDashboard,
  ListTree,
  LogOut,
  Settings,
  Tags,
  UserRound,
  Wind,
} from "lucide-preact";
import { define } from "@/utils.ts";
import ThemeToggle from "@/islands/ThemeToggle.tsx";
import ConfirmDeleteHost from "@/islands/ConfirmDeleteHost.tsx";
import { ADMIN_TYPE_BODY, ADMIN_TYPE_META } from "@/lib/admin-ui.ts";
import { displayName } from "@/lib/users.ts";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Content",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/pages", label: "Pages", icon: File },
      { href: "/admin/tags", label: "Tags", icon: Tags },
      { href: "/admin/media", label: "Media", icon: Image },
      { href: "/admin/menu", label: "Menu", icon: ListTree },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/performance", label: "Performance", icon: Gauge },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/redirects", label: "Redirects", icon: ArrowRightLeft },
      { href: "/admin/export-import", label: "Backup", icon: Archive },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function NavLink(props: {
  href: string;
  label: string;
  pathname: string;
  icon: LucideIcon;
}) {
  const active = isActive(props.pathname, props.href);
  const Icon = props.icon;
  return (
    <a
      href={props.href}
      class={`flex items-center gap-2.5 rounded-md px-3 py-2 ${ADMIN_TYPE_BODY} ${
        active
          ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-medium"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      <Icon size={16} class="shrink-0 opacity-80" />
      <span class="truncate">{props.label}</span>
    </a>
  );
}

export default define.layout(function AdminLayout(ctx) {
  if (ctx.url.pathname === "/admin/login") return <ctx.Component />;
  const pathname = ctx.url.pathname;

  return (
    <div class="h-dvh flex overflow-hidden bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
      <aside class="w-64 shrink-0 h-full min-h-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div class="px-5 py-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <a
            href="/admin"
            class="flex items-center gap-2.5 text-base font-bold tracking-tight min-w-0"
          >
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shrink-0">
              <Wind size={16} />
            </span>
            <span class="truncate">{ctx.state.siteName ?? "oxygen-blog"}</span>
          </a>
          <p class={`${ADMIN_TYPE_META} mt-2 pl-0.5 truncate`}>
            {ctx.state.user ? displayName(ctx.state.user) : ""}
          </p>
        </div>

        <nav class="flex-1 min-h-0 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                class={`${ADMIN_TYPE_META} uppercase tracking-wider px-3 mb-1.5`}
              >
                {group.label}
              </p>
              <ul class="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      pathname={pathname}
                      icon={item.icon}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div class="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-2 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            class={`flex items-center gap-2.5 rounded-md px-3 py-2 ${ADMIN_TYPE_BODY} text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
          >
            <ExternalLink size={16} class="shrink-0 opacity-80" />
            <span class="truncate">View blog</span>
          </a>
          <NavLink
            href="/admin/profile"
            label="Profile"
            pathname={pathname}
            icon={UserRound}
          />
          <NavLink
            href="/admin/settings"
            label="Settings"
            pathname={pathname}
            icon={Settings}
          />
          <div class="flex items-center justify-between gap-2 px-3 py-1">
            <span class={ADMIN_TYPE_META}>Theme</span>
            <ThemeToggle theme={ctx.state.theme ?? "system"} />
          </div>
          <form method="post" action="/admin/logout" class="px-1">
            <button
              type="submit"
              class={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 ${ADMIN_TYPE_BODY} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`}
            >
              <LogOut size={16} class="shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main class="flex-1 min-w-0 min-h-0 overflow-y-auto">
        <ctx.Component />
      </main>
      <ConfirmDeleteHost />
    </div>
  );
});
