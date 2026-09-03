// Performance dashboard (F15): rolling response times and HTML sizes
// from lib/perf.ts, cache hit rates and a live KV read/write latency
// probe. Source: ai/requirements.md 366-369, :472.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { perfSnapshot } from "@/lib/perf.ts";
import { kv } from "@/lib/kv.ts";
import {
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
  avgWriteMs: number;
}

/** A few timed KV reads/writes to sample live latency. */
async function measureKvLatency(): Promise<Latency> {
  const reads: number[] = [];
  const writes: number[] = [];
  for (let i = 0; i < PROBE_ROUNDS; i++) {
    let started = performance.now();
    await kv.get(PROBE_KEY);
    reads.push(performance.now() - started);
    started = performance.now();
    await kv.set(PROBE_KEY, i);
    writes.push(performance.now() - started);
  }
  await kv.delete(PROBE_KEY);
  const avg = (values: number[]) =>
    values.reduce((sum, v) => sum + v, 0) / values.length;
  return { avgReadMs: avg(reads), avgWriteMs: avg(writes) };
}

export const handler = define.handlers({
  async GET() {
    return {
      data: {
        snapshot: perfSnapshot(),
        latency: await measureKvLatency(),
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

      <h2 class={`${ADMIN_TYPE_SECTION} mb-3`}>KV latency (live probe)</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Metric label="Avg read" value={ms(latency.avgReadMs)} />
        <Metric label="Avg write" value={ms(latency.avgWriteMs)} />
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
