// In-process performance metrics for the admin dashboard (F15).
// Response times and HTML sizes are a rolling window of the last
// MAX_SAMPLES requests; cache counters are monotonic. Everything lives
// in memory: metrics reset on server restart, which is fine for an
// operations glance at a personal blog.

const MAX_SAMPLES = 100;

export interface RequestSample {
  durationMs: number;
  htmlBytes: number | null;
}

const samples: RequestSample[] = [];

const cacheCounters = new Map<string, { hits: number; misses: number }>();

/** Called from routes/_middleware.ts after every routed response. */
export function recordRequest(sample: RequestSample): void {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) samples.shift();
}

/** Called by the cached readers (settings, menu). */
export function recordCache(name: string, hit: boolean): void {
  const counter = cacheCounters.get(name) ?? { hits: 0, misses: 0 };
  if (hit) counter.hits++;
  else counter.misses++;
  cacheCounters.set(name, counter);
}

export interface CacheStat {
  name: string;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface PerfSnapshot {
  requestCount: number;
  avgResponseMs: number;
  minResponseMs: number;
  maxResponseMs: number;
  avgHtmlBytes: number | null;
  maxHtmlBytes: number | null;
  caches: CacheStat[];
}

function avg(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Current window metrics; cache hit rate is hits / (hits + misses). */
export function perfSnapshot(): PerfSnapshot {
  const durations = samples.map((s) => s.durationMs);
  const sizes = samples
    .map((s) => s.htmlBytes)
    .filter((bytes): bytes is number => bytes !== null);
  return {
    requestCount: samples.length,
    avgResponseMs: avg(durations),
    minResponseMs: durations.length > 0 ? Math.min(...durations) : 0,
    maxResponseMs: durations.length > 0 ? Math.max(...durations) : 0,
    avgHtmlBytes: sizes.length > 0 ? Math.round(avg(sizes)) : null,
    maxHtmlBytes: sizes.length > 0 ? Math.max(...sizes) : null,
    caches: [...cacheCounters.entries()].map(([name, counter]) => ({
      name,
      hits: counter.hits,
      misses: counter.misses,
      hitRate: counter.hits + counter.misses === 0
        ? 0
        : counter.hits / (counter.hits + counter.misses),
    })),
  };
}
