// Performance dashboard (F15): rolling response times and HTML sizes
// from lib/perf.ts, cache hit rates and a live KV read latency probe.
// Source: ai/requirements.md 366-369, :472.
//
// Page load only times reads. Writes used to run on every GET and churn
// the SQLite WAL — on Windows that can make Vite think sources changed
// and stall navigations across the admin UI.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { perfSnapshot } from "@/lib/perf.ts";
import { kv, KvKeys } from "@/lib/kv.ts";
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

const PROBE_ROUNDS = 5;
const PROBE_KEY = ["perf_probe"] as const;

interface Latency {
  avgReadMs: number;
  avgWriteMs: number | null;
}

/** Timed KV reads against the settings key (always present / harmless). */
async function measureKvReads(): Promise<number> {
  const key = KvKeys.settings();
  const reads: number[] = [];
  for (let i = 0; i < PROBE_ROUNDS; i++) {
    const started = performance.now();
    await kv.get(key);
    reads.push(performance.now() - started);
  }
  return reads.reduce((sum, v) => sum + v, 0) / reads.length;
}

/** Optional write probe — only when explicitly requested. */
async function measureKvWrites(): Promise<number> {
  const writes: number[] = [];
  for (let i = 0; i < PROBE_ROUNDS; i++) {
    const started = performance.now();
    await kv.set(PROBE_KEY, i);
    writes.push(performance.now() - started);
  }
  await kv.delete(PROBE_KEY);
  return writes.reduce((sum, v) => sum + v, 0) / writes.length;
}

export const handler = define.handlers({
  async GET(ctx) {
    const withWrite = ctx.url.searchParams.get("writeProbe") === "1";
    const avgReadMs = await measureKvReads();
    const avgWriteMs = withWrite ? await measureKvWrites() : null;
    return {
      data: {
        snapshot: perfSnapshot(),
        latency: { avgReadMs, avgWriteMs } satisfies Latency,
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
  const { snapshot, latency } = data;
  return (
    <AdminPage
      title="Performance"
      description={`Last ${snapshot.requestCount} application requests (in-memory, resets on restart).`}
    >
      <Head>
        <title>Performance - Admin</title>
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
        <Metric label="Avg read" value={ms(latency.avgReadMs)} />
        <Metric
          label="Avg write"
          value={latency.avgWriteMs === null
            ? "not run"
            : ms(latency.avgWriteMs)}
        />
      </div>
      <div class="flex flex-wrap items-center gap-3 mb-8">
        <p class={ADMIN_TYPE_META}>
          Reads run on every visit. Write probe is opt-in so local Vite is
          not stalled by SQLite WAL churn.
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
