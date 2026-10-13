// src/lib/rate-limit.ts
//
// Fixed-window rate limiter for API routes.
//
// Deliberately dependency-free and in-process: no Upstash env vars are
// configured for this project, and the production DB should not absorb extra
// per-request COUNT queries on hot paths (every query burns Fluid CPU).
//
// Trade-off to know: on serverless (Vercel) each warm instance keeps its own
// counters, so this is a per-instance shield, not a hard global limit. In
// practice it still collapses scripted floods — a bot hammering an endpoint
// reuses the same warm instances, and once one instance starts returning 429
// the client backs off. For a hard edge-level block that never reaches a
// function, enable the Vercel Firewall (attack challenge mode).

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();

// Periodically drop expired buckets so memory stays bounded even under a flood
// of distinct keys. If the map ever explodes, clear it entirely rather than
// leaking — a brief unthrottled window beats an OOM.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
  if (buckets.size > 50_000) buckets.clear();
}

/**
 * Check a fixed-window limit for `key`. Each key is allowed `limit` hits per
 * `windowMs`. When the limit is exceeded, `retryAfterSeconds` reports the
 * seconds until the current window resets.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
  if (bucket.count <= limit) {
    return { allowed: true, retryAfterSeconds };
  }
  return { allowed: false, retryAfterSeconds };
}

/**
 * Best-effort client IP from the headers Vercel (and edge proxies) set.
 * `x-forwarded-for` is the chain of proxies; the client is the leftmost entry.
 */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/** Build a standard 429 JSON response with a Retry-After header. */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message: 'Too many requests. Please try again shortly.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PER-USER FAILED PASSWORD TRACKER (account lockout)
//
// After MAX_PASSWORD_FAILURES wrong passwords for the same identifier
// (email or phone), the account is locked for LOCKOUT_DURATION_MS. This
// prevents brute-force password guessing regardless of IP rotation.
//
// Deliberately in-process memory (not DB): resets on cold start, which
// is acceptable — an attacker who waits for a cold start gains only a
// single fresh batch of attempts before lockout re-applies.
// ─────────────────────────────────────────────────────────────────────────
const MAX_PASSWORD_FAILURES = 3;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface PasswordFailure {
  count: number;
  lockedUntil: number; // timestamp when lockout expires, 0 = not locked
}

const passwordFailures = new Map<string, PasswordFailure>();

/** Check whether the given identifier is currently locked out. */
export function isPasswordLocked(identifier: string): { locked: boolean; retryAfterSeconds: number } {
  const key = identifier.toLowerCase().trim();
  const entry = passwordFailures.get(key);
  if (!entry) return { locked: false, retryAfterSeconds: 0 };
  if (entry.lockedUntil > Date.now()) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1000),
    };
  }
  return { locked: false, retryAfterSeconds: 0 };
}

/** Record a failed password attempt. Returns the new state. */
export function recordPasswordFailure(identifier: string): { count: number; locked: boolean; retryAfterSeconds: number } {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  let entry = passwordFailures.get(key);

  // If existing lockout expired, reset
  if (!entry || (entry.lockedUntil > 0 && now >= entry.lockedUntil)) {
    entry = { count: 0, lockedUntil: 0 };
  }

  entry.count += 1;

  if (entry.count >= MAX_PASSWORD_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    passwordFailures.set(key, entry);
    return {
      count: entry.count,
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  passwordFailures.set(key, entry);
  return {
    count: entry.count,
    locked: false,
    retryAfterSeconds: 0,
  };
}

/** Clear failure count on successful login. */
export function clearPasswordFailures(identifier: string): void {
  passwordFailures.delete(identifier.toLowerCase().trim());
}
