// Approximate reading time from Markdown.
// ~130 wpm: technical prose is denser than general reading (~200).

import { plainText } from "@/lib/markdown.ts";

const WORDS_PER_MINUTE = 130;

/** Whole minutes to read; at least 1 when there is any text. */
export function readingTimeMinutes(markdown: string): number {
  const words = plainText(markdown).split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
