export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : '';

  if (token) {
    try {
      await client`DELETE FROM admin_sessions WHERE token = ${token}`;
    } catch (e) {
      console.error('VaultPro logout error:', e);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};