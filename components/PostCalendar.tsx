// Zero-JS post calendar for the public sidebar.
// Days with posts are black links to /day/YYYY-MM-DD; empty days are gray.
// Month navigation uses /?cal=YYYY-MM.

import {
  type CalendarMonth,
  calendarMonthKey,
  formatCalendarMonth,
  shiftCalendarMonth,
} from "@/utils/date.ts";
import {
  PUBLIC_LINK,
  PUBLIC_TYPE_META,
  PUBLIC_TYPE_SECTION,
} from "@/lib/public-ui.ts";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function PostCalendar(
  { month, daysWithPosts, selectedDay }: {
    month: CalendarMonth;
    /** UTC days (YYYY-MM-DD) that have at least one published post. */
    daysWithPosts: string[];
    selectedDay?: string;
  },
) {
  const withPosts = new Set(daysWithPosts);
  const first = new Date(Date.UTC(month.year, month.month - 1, 1));
  // Mon=0 … Sun=6
  const startPad = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(month.year, month.month, 0))
    .getUTCDate();
  const prev = shiftCalendarMonth(month, -1);
  const next = shiftCalendarMonth(month, 1);
  const cells: (number | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section>
      <h3 class={`${PUBLIC_TYPE_SECTION} mb-3`}>Calendar</h3>
      <div class="flex items-center justify-between gap-2 mb-3">
        <a
          href={`/?cal=${calendarMonthKey(prev)}`}
          class={`${PUBLIC_LINK} px-1.5 py-0.5 text-sm`}
          aria-label="Previous month"
        >
          ‹
        </a>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize text-center truncate">
          {formatCalendarMonth(month)}
        </p>
        <a
          href={`/?cal=${calendarMonthKey(next)}`}
          class={`${PUBLIC_LINK} px-1.5 py-0.5 text-sm`}
          aria-label="Next month"
        >
          ›
        </a>
      </div>
      <div class="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((label) => (
          <span key={label} class={`${PUBLIC_TYPE_META} font-medium`}>
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`e-${index}`} class="h-8" />;
          }
          const key = `${month.year}-${String(month.month).padStart(2, "0")}-${
            String(day).padStart(2, "0")
          }`;
          const hasPosts = withPosts.has(key);
          const selected = selectedDay === key;
          const base =
            "inline-flex h-8 w-full items-center justify-center rounded text-sm";
          if (hasPosts) {
            return (
              <a
                key={key}
                href={`/day/${key}`}
                class={`${base} font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selected ? "ring-1 ring-gray-900 dark:ring-gray-100" : ""
                }`}
                title={`${day}: posts`}
              >
                {day}
              </a>
            );
          }
          return (
            <span
              key={key}
              class={`${base} text-gray-400 dark:text-gray-600`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
}
