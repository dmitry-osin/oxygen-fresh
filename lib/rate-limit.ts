// In-memory sliding window rate limiter (per process, not persisted).
// Used on the login endpoint: ai/requirements.md section 10.

export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();

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
    return allowed;
  }

  /** Clear all hits for a key (e.g. after a successful login). */
  reset(key: string): void {
    this.hits.delete(key);
  }
}
