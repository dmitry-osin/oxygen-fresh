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
