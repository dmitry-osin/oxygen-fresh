// Input validation helpers shared by admin handlers and lib modules.

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True when the value is a valid slug (lowercase alnum, hyphen-separated). */
export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/** True when the value is a non-empty string after trimming. */
export function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** True when the value is a safe upload filename (alphanumeric + dash + dot). */
export function isSafeFilename(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(value);
}
