// Server-rendered SVG bar chart for the analytics dashboard (F13):
// stacked bars of post views (dark) + page views (light) per day.
// No client JavaScript (charts requirement, ai/requirements.md:356).

interface DayPoint {
  date: string;
  postViews: number;
  pageViews: number;
}

const WIDTH = 640;
const HEIGHT = 190;
const PADDING = 26;
const GAP = 10;

export function DailyViewsChart({ days }: { days: DayPoint[] }) {
  const innerW = WIDTH - PADDING * 2;
  const innerH = HEIGHT - PADDING * 2;
  const barW = (innerW - GAP * (days.length - 1)) / days.length;
  const max = Math.max(1, ...days.map((d) => d.postViews + d.pageViews));
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      class="w-full max-w-2xl"
      role="img"
      aria-label="Views per day, last 7 days"
    >
      {days.map((day, i) => {
        const total = day.postViews + day.pageViews;
        const x = PADDING + i * (barW + GAP);
        const totalH = (total / max) * innerH;
        const postH = total > 0 ? (day.postViews / total) * totalH : 0;
        const pageH = totalH - postH;
        return (
          <g key={day.date}>
            <rect
              x={x}
              y={HEIGHT - PADDING - postH}
              width={barW}
              height={postH}
              fill="#374151"
              rx="2"
            >
              <title>{`${day.date}: ${day.postViews} post views`}</title>
            </rect>
            <rect
              x={x}
              y={HEIGHT - PADDING - totalH}
              width={barW}
              height={pageH}
              fill="#9ca3af"
              rx="2"
            >
              <title>{`${day.date}: ${day.pageViews} page views`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={HEIGHT - PADDING + 14}
              text-anchor="middle"
              font-size="10"
              fill="#6b7280"
            >
              {day.date.slice(5)}
            </text>
            {total > 0 && (
              <text
                x={x + barW / 2}
                y={HEIGHT - PADDING - totalH - 4}
                text-anchor="middle"
                font-size="10"
                fill="#374151"
              >
                {total}
              </text>
            )}
          </g>
        );
      })}
      <line
        x1={PADDING}
        y1={HEIGHT - PADDING}
        x2={WIDTH - PADDING}
        y2={HEIGHT - PADDING}
        stroke="#e5e7eb"
      />
    </svg>
  );
}
