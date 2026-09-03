// Shared admin UI tokens: typography, buttons, inputs, tables.
// Pure strings so islands can import without pulling server components.

// --- Typography (one body size: text-sm; titles/meta only as exceptions) ---

/** Page / editor H1. */
export const ADMIN_TYPE_PAGE_TITLE = "text-2xl font-bold tracking-tight";
/** Section heading above a block (lists, charts, panels). */
export const ADMIN_TYPE_SECTION =
  "text-sm font-medium text-gray-500 dark:text-gray-400";
/** Title inside a card / panel. */
export const ADMIN_TYPE_CARD_TITLE = "text-sm font-semibold";
/** Modal dialog title. */
export const ADMIN_TYPE_MODAL_TITLE = "text-base font-semibold";
/** Default body copy and form controls. */
export const ADMIN_TYPE_BODY = "text-sm";
/** Secondary / helper copy. */
export const ADMIN_TYPE_MUTED = "text-sm text-gray-500 dark:text-gray-400";
/** Tiny meta: captions, badges, hints. */
export const ADMIN_TYPE_META = "text-xs text-gray-500 dark:text-gray-400";
/** Form field label. */
export const ADMIN_TYPE_LABEL = "block text-sm font-medium mb-1";
/** Checkbox / inline label. */
export const ADMIN_TYPE_INLINE_LABEL = "flex items-center gap-2 text-sm";
/** Stat card number. */
export const ADMIN_TYPE_STAT = "text-2xl font-bold";
/** Stat card caption. */
export const ADMIN_TYPE_STAT_LABEL = "text-sm text-gray-500 dark:text-gray-400";
/** “← Back to list” links. */
export const ADMIN_TYPE_BACK = "text-sm text-gray-600 dark:text-gray-400";
/** Error flash / inline error. */
export const ADMIN_TYPE_ERROR = "text-sm text-red-600";
/** Success flash. */
export const ADMIN_TYPE_SUCCESS = "text-sm text-green-700 dark:text-green-400";
/** Warning flash. */
export const ADMIN_TYPE_WARN = "text-sm text-amber-700";
/** Status / tag chip base (add tone classes). */
export const ADMIN_TYPE_BADGE =
  "text-xs uppercase tracking-wide rounded px-2 py-1";

// --- Buttons ---

const ADMIN_BTN_BASE =
  "inline-flex items-center justify-center rounded-md font-medium disabled:opacity-40 whitespace-nowrap";
const ADMIN_BTN_SM = "px-2.5 py-1 text-xs";
const ADMIN_BTN_MD = "px-4 py-2 text-sm";
const ADMIN_TONE_PRIMARY =
  "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:opacity-90";
const ADMIN_TONE_SECONDARY =
  "border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800";
const ADMIN_TONE_DANGER = "bg-red-600 text-white hover:opacity-90";
const ADMIN_TONE_SUCCESS = "bg-green-700 text-white hover:opacity-90";

export const ADMIN_BTN_PRIMARY =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_MD} ${ADMIN_TONE_PRIMARY}`;
export const ADMIN_BTN_SECONDARY =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_MD} ${ADMIN_TONE_SECONDARY}`;
export const ADMIN_BTN_DANGER =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_MD} ${ADMIN_TONE_DANGER}`;
export const ADMIN_BTN_SUCCESS =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_MD} ${ADMIN_TONE_SUCCESS}`;
export const ADMIN_BTN_ROW =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_SM} ${ADMIN_TONE_SECONDARY}`;
export const ADMIN_BTN_ROW_PRIMARY =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_SM} ${ADMIN_TONE_PRIMARY}`;
export const ADMIN_BTN_ROW_DANGER =
  `${ADMIN_BTN_BASE} ${ADMIN_BTN_SM} ${ADMIN_TONE_DANGER}`;

// --- Surfaces ---

export const ADMIN_INPUT =
  "w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-md px-3 py-2 text-sm";
export const ADMIN_CARD =
  "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4";

export const ADMIN_TABLE_WRAP = `${ADMIN_CARD} p-0 overflow-x-auto`;
export const ADMIN_TABLE = "w-full text-left text-sm";
export const ADMIN_THEAD =
  "border-b border-gray-200 dark:border-gray-800 text-gray-500";
export const ADMIN_TH = "px-4 py-3 font-medium";
export const ADMIN_TH_ACTIONS = `${ADMIN_TH} text-right`;
export const ADMIN_TR =
  "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40";
export const ADMIN_TD = "px-4 py-3";
export const ADMIN_TD_MUTED = `${ADMIN_TD} text-gray-500`;
export const ADMIN_TD_ACTIONS = ADMIN_TD;
export const ADMIN_ROW_ACTIONS =
  "flex flex-wrap items-center justify-end gap-1.5";
export const ADMIN_EMPTY = `${ADMIN_TYPE_MUTED} px-4 py-6`;
export const ADMIN_TITLE_LINK = "text-sm font-medium hover:underline";
export const ADMIN_SLUG_SUB = `${ADMIN_TYPE_META} mt-0.5`;
