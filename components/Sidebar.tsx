// Sidebar for the "default" template (F7): configurable widgets
// (author, calendar, recent, tags) plus automatic TOC on posts.

import type { AuthorProfile, Post, SidebarBlockConfig } from "@/types/index.ts";
import type { TocEntry } from "@/lib/markdown.ts";
import type { TagWithCount } from "@/lib/tags.ts";
import type { CalendarMonth } from "@/utils/date.ts";
import { DEFAULT_SIDEBAR_BLOCKS } from "@/lib/sidebar.ts";
import {
  PUBLIC_ASIDE,
  PUBLIC_LINK,
  PUBLIC_LINK_UNDERLINE,
  PUBLIC_TYPE_META,
  PUBLIC_TYPE_SECTION,
} from "@/lib/public-ui.ts";
import { AuthorCard } from "./AuthorCard.tsx";
import { PostCalendar } from "./PostCalendar.tsx";
import type { ComponentChildren } from "preact";

/** Map tag frequency to a font-size class (popular → larger). */
function tagCloudClass(count: number, min: number, max: number): string {
  if (max <= min) return "text-sm font-medium";
  const t = (count - min) / (max - min);
  if (t >= 0.8) return "text-xl font-semibold";
  if (t >= 0.6) return "text-lg font-semibold";
  if (t >= 0.4) return "text-base font-medium";
  if (t >= 0.2) return "text-sm font-medium";
  return "text-xs font-medium";
}

function TocSection({ toc }: { toc: TocEntry[] }) {
  return (
    <section>
      <h3 class={`${PUBLIC_TYPE_SECTION} mb-3`}>On this page</h3>
      <ul class="space-y-2 text-sm">
        {toc.map((entry) => (
          <li
            key={entry.id}
            class={entry.level === 3 ? "pl-3" : ""}
          >
            <a href={`#${entry.id}`} class={PUBLIC_LINK_UNDERLINE}>
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Sidebar(
  {
    recentPosts,
    tags,
    toc = [],
    author,
    postDays = [],
    calendarMonth,
    selectedDay,
    sidebarBlocks = DEFAULT_SIDEBAR_BLOCKS,
  }: {
    recentPosts: Post[];
    tags: TagWithCount[];
    toc?: TocEntry[];
    author?: AuthorProfile;
    postDays?: string[];
    calendarMonth?: CalendarMonth;
    selectedDay?: string;
    sidebarBlocks?: SidebarBlockConfig[];
  },
) {
  const counts = tags.map((t) => t.count);
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;
  const enabled = sidebarBlocks.filter((block) => block.enabled);

  const nodes: ComponentChildren[] = [];
  let tocPlaced = false;

  for (const block of enabled) {
    if (block.id === "author") {
      if (author) {
        nodes.push(
          <div key="author" class="lg:sticky lg:top-24">
            <AuthorCard author={author} />
          </div>,
        );
      }
      if (toc.length > 0) {
        nodes.push(<TocSection key="toc" toc={toc} />);
        tocPlaced = true;
      }
      continue;
    }
    if (block.id === "calendar" && calendarMonth) {
      nodes.push(
        <PostCalendar
          key="calendar"
          month={calendarMonth}
          daysWithPosts={postDays}
          selectedDay={selectedDay}
        />,
      );
      continue;
    }
    if (block.id === "recent" && recentPosts.length > 0) {
      nodes.push(
        <section key="recent">
          <h3 class={`${PUBLIC_TYPE_SECTION} mb-3`}>Recent posts</h3>
          <ul class="space-y-2.5">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <a
                  href={`/${post.slug}`}
                  class={`${PUBLIC_LINK_UNDERLINE} text-sm leading-snug`}
                >
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </section>,
      );
      continue;
    }
    if (block.id === "tags" && tags.length > 0) {
      nodes.push(
        <section key="tags">
          <h3 class={`${PUBLIC_TYPE_SECTION} mb-3`}>Popular tags</h3>
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            {tags.map((tag) => (
              <a
                key={tag.slug}
                href={`/tag/${tag.slug}`}
                class={`${PUBLIC_LINK} ${
                  tagCloudClass(tag.count, min, max)
                } leading-none`}
                title={`${tag.count} post${tag.count === 1 ? "" : "s"}`}
              >
                {tag.name}
                <span class={`${PUBLIC_TYPE_META} ml-1 font-normal`}>
                  {tag.count}
                </span>
              </a>
            ))}
          </div>
        </section>,
      );
    }
  }

  if (!tocPlaced && toc.length > 0) {
    nodes.unshift(<TocSection key="toc" toc={toc} />);
  }

  if (nodes.length === 0) return null;

  return <aside class={PUBLIC_ASIDE}>{nodes}</aside>;
}
