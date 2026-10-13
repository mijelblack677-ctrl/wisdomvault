export const prerender = false;
import type { APIRoute } from 'astro';
import postgres from 'postgres';
import { requireAdmin, unauthorized } from '../../lib/adminAuth';

// ADMIN-ONLY diagnostic: shows env/connection status. Previously public, it
// leaked configuration details to anyone who asked.
export const GET: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const results: any = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
    db: {
      connected: false,
      error: null,
    },
  };

  if (!process.env.DATABASE_URL) {
    results.db.error = 'DATABASE_URL environment variable is not set';
    return new Response(JSON.stringify(results, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    });

    const test = await sql`SELECT 1 as test, NOW() as time, version() as version`;
    results.db.connected = true;
    results.db.testResult = test;

    await sql.end();
  } catch (err: any) {
    results.db.error = err.message;
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: results.db.connected ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
};
