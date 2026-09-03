// Date formatting helpers. All stored dates are ISO 8601 strings.

/** Current time as an ISO 8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Format an ISO date as YYYY-MM-DD. */
export function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Human-readable date for the public site (locale-aware). */
export function formatDateLong(iso: string, locale = "ru-RU"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatDate(iso);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Format an ISO date as YYYY-MM-DD HH:mm (UTC). */
export function formatDateTime(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export interface CalendarMonth {
  year: number;
  month: number; // 1–12
}

/** Parse ?cal=YYYY-MM, or fall back to a day / today (UTC). */
export function parseCalendarMonth(
  calParam: string | null,
  fallbackDay?: string,
): CalendarMonth {
  const candidate = (calParam && /^\d{4}-\d{2}$/.test(calParam)
    ? calParam
    : null) ??
    (fallbackDay && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDay)
      ? fallbackDay.slice(0, 7)
      : null);
  if (candidate) {
    const year = Number(candidate.slice(0, 4));
    const month = Number(candidate.slice(5, 7));
    if (month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/** Shift a calendar month by delta (−1 / +1). */
export function shiftCalendarMonth(
  month: CalendarMonth,
  delta: number,
): CalendarMonth {
  const date = new Date(Date.UTC(month.year, month.month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function calendarMonthKey(month: CalendarMonth): string {
  return `${month.year}-${String(month.month).padStart(2, "0")}`;
}

/** "сентябрь 2026 г." style label. */
export function formatCalendarMonth(
  month: CalendarMonth,
  locale = "ru-RU",
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(month.year, month.month - 1, 1)));
}
