// Shared public-site UI tokens: typography, links, surfaces.
// Pure strings — safe for islands (e.g. PublicThemeToggle).

/**
 * Outer shell for header / main / footer. Same width everywhere so
 * brand, titles and footer never shift horizontally between pages.
 */
export const PUBLIC_SHELL = "max-w-5xl mx-auto px-4 sm:px-6 w-full";

/**
 * Reading column inside PUBLIC_SHELL (lists, full-width articles).
 * Left-aligned — not centered — so titles share the header’s left edge.
 */
export const PUBLIC_READING = "max-w-3xl w-full";

/** @deprecated Use PUBLIC_SHELL + PUBLIC_READING */
export const PUBLIC_CONTAINER = PUBLIC_SHELL;
/** @deprecated Use PUBLIC_SHELL */
export const PUBLIC_CONTAINER_WIDE = PUBLIC_SHELL;

export const PUBLIC_TYPE_SITE_TITLE =
  "text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100";
export const PUBLIC_TYPE_PAGE_TITLE =
  "text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100";
export const PUBLIC_TYPE_ARTICLE_TITLE =
  "text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100";
export const PUBLIC_TYPE_SECTION =
  "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";
export const PUBLIC_TYPE_BODY =
  "text-base text-gray-800 dark:text-gray-200 leading-relaxed";
export const PUBLIC_TYPE_MUTED =
  "text-sm text-gray-500 dark:text-gray-400 leading-relaxed";
export const PUBLIC_TYPE_META = "text-xs text-gray-500 dark:text-gray-400";

export const PUBLIC_LINK =
  "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";
export const PUBLIC_LINK_NAV = `${PUBLIC_LINK} text-sm font-medium`;
export const PUBLIC_LINK_UNDERLINE =
  `${PUBLIC_LINK} hover:underline underline-offset-2`;

export const PUBLIC_INPUT =
  "w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400/40 dark:focus:ring-gray-600/40";

export const PUBLIC_BADGE =
  "inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors";

export const PUBLIC_PROSE =
  "prose prose-gray dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-gray-900 dark:prose-a:text-gray-100";

export const PUBLIC_BTN =
  "inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

export const PUBLIC_DIVIDER = "border-gray-200 dark:border-gray-800";

/** Post / surface card on the public site. */
export const PUBLIC_CARD =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 sm:p-6";

export const PUBLIC_ASIDE =
  "lg:w-64 shrink-0 space-y-8 lg:border-l lg:pl-8 border-gray-200 dark:border-gray-800";

export const PUBLIC_MAIN_PY = "py-10 sm:py-12";
