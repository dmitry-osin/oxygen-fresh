// Live KV latency probe for the Performance dashboard.
// Kept off the page GET so opening /admin/performance is not blocked by
// sequential SQLite round-trips (and optional write WAL churn).

import { define } from "@/utils.ts";
import { kv, KvKeys } from "@/lib/kv.ts";

const PROBE_ROUNDS = 5;
const PROBE_KEY = ["perf_probe"] as const;

async function measureReads(): Promise<number> {
  const key = KvKeys.settings();
  const reads: number[] = [];
  for (let i = 0; i < PROBE_ROUNDS; i++) {
    const started = performance.now();
    await kv.get(key);
    reads.push(performance.now() - started);
  }
  return reads.reduce((sum, v) => sum + v, 0) / reads.length;
}

async function measureWrites(): Promise<number> {
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
    const withWrite = ctx.url.searchParams.get("write") === "1";
    const avgReadMs = await measureReads();
    const avgWriteMs = withWrite ? await measureWrites() : null;
    return Response.json({ avgReadMs, avgWriteMs });
  },
});
