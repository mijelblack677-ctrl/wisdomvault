export const prerender = false;

import type { APIRoute } from 'astro';
import { requireAdmin, unauthorized } from '../../../lib/adminAuth';

// ADMIN-ONLY diagnostic.
export const GET: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Referral API is working!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
