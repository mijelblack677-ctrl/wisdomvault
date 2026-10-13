export const prerender = false;

import type { APIRoute } from 'astro';
import { requireAdmin, unauthorized } from '../../lib/adminAuth';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

// ADMIN-ONLY test echo. Previously open to anyone (request reflection).
export const POST: APIRoute = async ({ request }) => {
  const limit = checkRateLimit(`echo:${clientIp(request)}`, 10, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.text();
    return new Response(JSON.stringify({
      success: true,
      received: body,
      contentType: request.headers.get('content-type'),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
