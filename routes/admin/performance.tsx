// Performance dashboard (F15): rolling response times and HTML sizes
// from lib/perf.ts, cache hit rates and a live KV read/write latency
// probe. Source: ai/requirements.md 366-369, :472.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { perfSnapshot } from "@/lib/perf.ts";
import { kv } from "@/lib/kv.ts";

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
    <div class="border border-gray-200 dark:border-gray-700 rounded p-4">
      <p class="text-sm text-gray-500">{label}</p>
      <p class="text-2xl font-bold">{value}</p>
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
    <div class="px-4 py-8 mx-auto max-w-5xl">
      <Head>
        <title>Performance - Admin</title>
      </Head>
      <h1 class="text-2xl font-bold mb-2">Performance</h1>
      <p class="text-sm text-gray-500 mb-6">
        Last {snapshot.requestCount}{" "}
        application requests (in-memory, resets on restart).
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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

      <h2 class="text-lg font-bold mb-3">KV latency (live probe)</h2>
      <div class="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <Metric label="Avg read" value={ms(latency.avgReadMs)} />
        <Metric label="Avg write" value={ms(latency.avgWriteMs)} />
      </div>

      <h2 class="text-lg font-bold mb-3">In-memory caches</h2>
      <table class="w-full max-w-md text-left text-sm">
        <thead>
          <tr class="border-b dark:border-gray-700">
            <th class="py-2">Cache</th>
            <th class="py-2">Hits</th>
            <th class="py-2">Misses</th>
            <th class="py-2">Hit rate</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.caches.map((cache) => (
            <tr
              key={cache.name}
              class="border-b dark:border-gray-800"
            >
              <td class="py-2">{cache.name}</td>
              <td class="py-2">{cache.hits}</td>
              <td class="py-2">{cache.misses}</td>
              <td class="py-2">{Math.round(cache.hitRate * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {snapshot.caches.length === 0 && (
        <p class="text-sm text-gray-500">No cache activity yet.</p>
      )}
      <p class="text-xs text-gray-500 mt-6 max-w-md">
        Public page weight target: under 150 KB (ai/requirements.md section 11).
        Samples cover HTML only; CSS and images are served as static assets.
      </p>
    </div>
  );
});
