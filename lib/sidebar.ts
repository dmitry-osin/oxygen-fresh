// Public sidebar block order / visibility helpers.

import type { SidebarBlockConfig, SidebarBlockId } from "@/types/index.ts";

export const SIDEBAR_BLOCK_IDS: SidebarBlockId[] = [
  "author",
  "calendar",
  "recent",
  "tags",
];

export const SIDEBAR_BLOCK_LABELS: Record<SidebarBlockId, string> = {
  author: "Author card",
  calendar: "Post calendar",
  recent: "Recent posts",
  tags: "Tag cloud",
};

export const DEFAULT_SIDEBAR_BLOCKS: SidebarBlockConfig[] = [
  { id: "author", enabled: true },
  { id: "calendar", enabled: true },
  { id: "recent", enabled: true },
  { id: "tags", enabled: true },
];

/** Home uses the same defaults (including author card). */
export const DEFAULT_SIDEBAR_HOME: SidebarBlockConfig[] = DEFAULT_SIDEBAR_BLOCKS
  .map((block) => ({ ...block }));

/** Static pages: no author byline by default. */
export const DEFAULT_SIDEBAR_PAGE: SidebarBlockConfig[] = [
  { id: "author", enabled: false },
  { id: "calendar", enabled: true },
  { id: "recent", enabled: true },
  { id: "tags", enabled: true },
];

const KNOWN = new Set<string>(SIDEBAR_BLOCK_IDS);

/** Merge stored order with defaults so new block ids still appear. */
export function normalizeSidebarBlocks(
  blocks?: SidebarBlockConfig[] | null,
  fallback: SidebarBlockConfig[] = DEFAULT_SIDEBAR_BLOCKS,
): SidebarBlockConfig[] {
  const seen = new Set<SidebarBlockId>();
  const result: SidebarBlockConfig[] = [];
  for (const block of blocks ?? []) {
    if (!KNOWN.has(block.id) || seen.has(block.id)) continue;
    seen.add(block.id);
    result.push({ id: block.id, enabled: !!block.enabled });
  }
  for (const item of fallback) {
    if (!seen.has(item.id)) result.push({ ...item });
  }
  return result;
}

/** Parse the hidden JSON field from the settings form. */
export function parseSidebarBlocks(
  raw: string,
  fallback: SidebarBlockConfig[] = DEFAULT_SIDEBAR_BLOCKS,
): SidebarBlockConfig[] | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return "Sidebar blocks payload is not valid JSON.";
  }
  if (!Array.isArray(parsed)) {
    return "Sidebar blocks payload must be an array.";
  }
  const blocks: SidebarBlockConfig[] = [];
  for (const item of parsed) {
    if (
      !item || typeof item !== "object" ||
      !KNOWN.has((item as SidebarBlockConfig).id) ||
      typeof (item as SidebarBlockConfig).enabled !== "boolean"
    ) {
      return "Each sidebar block needs an id and enabled flag.";
    }
    blocks.push({
      id: (item as SidebarBlockConfig).id,
      enabled: (item as SidebarBlockConfig).enabled,
    });
  }
  return normalizeSidebarBlocks(blocks, fallback);
}
