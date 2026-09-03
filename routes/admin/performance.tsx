// Performance dashboard (F15): rolling response times and HTML sizes
// from lib/perf.ts, cache hit rates and an async KV latency probe.
// Source: ai/requirements.md 366-369, :472.
//
// Snapshot metrics are in-memory and cheap. KV probes run after paint via
// /admin/api/perf-kv so opening this page does not wait on SQLite rounds
// (writes remain opt-in — they churn the WAL and can stall Vite on Windows).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { perfSnapshot } from "@/lib/perf.ts";
import {
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD,
  ADMIN_EMPTY,
  ADMIN_TABLE,
  ADMIN_TABLE_WRAP,
  ADMIN_TD,
  ADMIN_TH,
  ADMIN_THEAD,
  ADMIN_TR,
  ADMIN_TYPE_META,
  ADMIN_TYPE_SECTION,
  ADMIN_TYPE_STAT,
  ADMIN_TYPE_STAT_LABEL,
  AdminPage,
} from "@/components/AdminPage.tsx";

export const handler = define.handlers({
  GET(ctx) {
    return {
      data: {
        snapshot: perfSnapshot(),
        writeProbe: ctx.url.searchParams.get("writeProbe") === "1",
      },
    };
  },
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div class={ADMIN_CARD}>
      <p class={ADMIN_TYPE_STAT_LABEL}>{label}</p>
      <p class={`${ADMIN_TYPE_STAT} mt-1`}>{value}</p>
    </div>
  );
}

function ms(value: number): string {
  return `${value.toFixed(1)} ms`;
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default define.page<typeof handler>(function PerformancePage(
  { data },
) {
  const { snapshot, writeProbe } = data;
  return (
    <AdminPage
      title="Performance"
      description={`Last ${snapshot.requestCount} application requests (in-memory, resets on restart).`}
    >
      <Head>
        <title>Performance - Admin</title>
        <script type="module" src="/admin-perf.js"></script>
      </Head>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Metric
          label="Avg response"
          value={ms(snapshot.avgResponseMs)}
        />
        <Metric
          label="Min / Max"
          value={`${ms(snapshot.minResponseMs)} / ${
            ms(snapshot.maxResponseMs)
          }`}
        />
        <Metric
          label="Avg HTML size"
          value={snapshot.avgHtmlBytes === null
            ? "n/a"
            : kb(snapshot.avgHtmlBytes)}
        />
        <Metric
          label="Max HTML size"
          value={snapshot.maxHtmlBytes === null
            ? "n/a"
            : kb(snapshot.maxHtmlBytes)}
        />
      </div>

      <h2 class={`${ADMIN_TYPE_SECTION} mb-3`}>KV latency</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div class={ADMIN_CARD}>
          <p class={ADMIN_TYPE_STAT_LABEL}>Avg read</p>
          <p class={`${ADMIN_TYPE_STAT} mt-1`} data-perf-read>…</p>
        </div>
        <div class={ADMIN_CARD}>
          <p class={ADMIN_TYPE_STAT_LABEL}>Avg write</p>
          <p class={`${ADMIN_TYPE_STAT} mt-1`} data-perf-write>
            {writeProbe ? "…" : "not run"}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 mb-8">
        <p class={ADMIN_TYPE_META}>
          Latency is measured after the page opens. Write probe is opt-in so
          local Vite is not stalled by SQLite WAL churn.
        </p>
        <a href="/admin/performance?writeProbe=1" class={ADMIN_BTN_SECONDARY}>
          Run write probe
        </a>
      </div>

      <h2 class={`${ADMIN_TYPE_SECTION} mb-3`}>In-memory caches</h2>
      <div class={`${ADMIN_TABLE_WRAP} mb-4`}>
        <table class={ADMIN_TABLE}>
          <thead>
            <tr class={ADMIN_THEAD}>
              <th class={ADMIN_TH}>Cache</th>
              <th class={ADMIN_TH}>Hits</th>
              <th class={ADMIN_TH}>Misses</th>
              <th class={ADMIN_TH}>Hit rate</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.caches.map((cache) => (
              <tr key={cache.name} class={ADMIN_TR}>
                <td class={ADMIN_TD}>{cache.name}</td>
                <td class={ADMIN_TD}>{cache.hits}</td>
                <td class={ADMIN_TD}>{cache.misses}</td>
                <td class={ADMIN_TD}>{Math.round(cache.hitRate * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {snapshot.caches.length === 0 && (
          <p class={ADMIN_EMPTY}>No cache activity yet.</p>
        )}
      </div>
      <p class={ADMIN_TYPE_META}>
        Public page weight target: under 150 KB. Samples cover HTML only; CSS
        and images are served as static assets.
      </p>
    </AdminPage>
  );
});
