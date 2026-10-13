export const prerender = false;

import type { APIRoute } from 'astro';

/**
 * Manual user verification is DISABLED.
 * All verification is now handled automatically by PayChangu payment callbacks.
 * Users pay via PayChangu → account is auto-verified.
 */
export const PUT: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    success: false, 
    message: 'Manual verification is disabled. All accounts are verified automatically via PayChangu payment.' 
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
};
