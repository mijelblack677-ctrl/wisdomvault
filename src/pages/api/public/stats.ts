export const prerender = false;

import type { APIRoute } from 'astro';
import { getPublicStats } from '@lib/publicStats';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

// ============================================================
// PUBLIC STATS ENDPOINT
// Unauthenticated by design: the dashboard, billing page and landing
// page use it to show real numbers from the database instead of
// hardcoded values. It exposes only counts and published fee config,
// never user-identifying data.
//
// Hardening:
//   • Per-IP rate limit — a flood is answered with 429 before it can
//     turn into a flood of database COUNT queries.
//   • Results come from getPublicStats(), which caches them for 120s and
//     de-duplicates concurrent callers, so the cache TTL bounds DB load
//     regardless of request volume.
//   • Database errors are logged server-side and never echoed to the
//     client (no schema/connection details leak).
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  const limit = checkRateLimit(`public-stats:${clientIp(request)}`, 60, 60_000);
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  const stats = await getPublicStats();
  if (!stats) {
    return new Response(
      JSON.stringify({ success: false, message: 'Stats temporarily unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ success: true, stats }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
