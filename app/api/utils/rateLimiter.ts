/**
 * ─────────────────────────────────────────────────────────────────────────
 * Sliding Window Rate Limiter
 * Limits requests from IP addresses inside a given time window.
 * ─────────────────────────────────────────────────────────────────────────
 */

const globalForLimiter = global as unknown as {
  ipBuckets: Map<string, number[]>;
};

if (!globalForLimiter.ipBuckets) {
  globalForLimiter.ipBuckets = new Map<string, number[]>();
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number; // Seconds until the rate limit resets
}

/**
 * Check if the given IP address is allowed to proceed
 * @param ip Client IP address
 * @param limit Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds (default: 1 minute = 60000ms)
 */
export function checkRateLimit(
  ip: string,
  limit = 20, // 20 requests per minute
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  const buckets = globalForLimiter.ipBuckets;

  // Retrieve timestamps for this IP
  const timestamps = buckets.get(ip) || [];

  // Filter out timestamps outside the active window
  const activeTimestamps = timestamps.filter((time) => now - time < windowMs);

  if (activeTimestamps.length >= limit) {
    // Limit exceeded! Calculate remaining time until oldest request exits the window
    const oldestTimestamp = activeTimestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    const resetSeconds = Math.max(0, Math.ceil((resetTime - now) / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  // Allowed! Push current timestamp and save
  activeTimestamps.push(now);
  buckets.set(ip, activeTimestamps);

  const remaining = limit - activeTimestamps.length;
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    allowed: true,
    limit,
    remaining,
    resetSeconds,
  };
}
