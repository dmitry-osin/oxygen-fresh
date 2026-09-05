// In-memory sliding window rate limiter (per process, not persisted).
// Used on the login endpoint: ai/requirements.md section 10.
//
// Bounded memory: a key with a single, never-repeated hit would otherwise
// live in `hits` forever (nothing ever re-filters it). A periodic sweep
// drops fully-expired keys, and a hard cap evicts the oldest key if an
// attacker still floods us with unique keys faster than the sweep runs.

const SWEEP_EVERY_CALLS = 500;
const MAX_TRACKED_KEYS = 5000;

export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();
  private callsSinceSweep = 0;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** True when the key may proceed; records the hit on success. */
  allow(key: string, now = Date.now()): boolean {
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > windowStart);
    const allowed = recent.length < this.limit;
    if (allowed) recent.push(now);
    this.hits.set(key, recent);
    this.maybeSweep(windowStart);
    return allowed;
  }

  /** Clear all hits for a key (e.g. after a successful login). */
  reset(key: string): void {
    this.hits.delete(key);
  }

  private maybeSweep(windowStart: number): void {
    if (++this.callsSinceSweep >= SWEEP_EVERY_CALLS) {
      this.callsSinceSweep = 0;
      for (const [key, timestamps] of this.hits) {
        if (timestamps.every((t) => t <= windowStart)) this.hits.delete(key);
      }
    }
    while (this.hits.size > MAX_TRACKED_KEYS) {
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey === undefined) break;
      this.hits.delete(oldestKey);
    }
  }
}
