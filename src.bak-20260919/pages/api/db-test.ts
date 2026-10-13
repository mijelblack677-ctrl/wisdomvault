export const prerender = false;
import type { APIRoute } from 'astro';
import postgres from 'postgres';

export const GET: APIRoute = async () => {
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

  // Log the status (this will show in Vercel logs)
  console.log('📦 DB Test - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');

  if (!process.env.DATABASE_URL) {
    results.db.error = 'DATABASE_URL environment variable is not set';
    console.error('❌ DATABASE_URL is missing');
    return new Response(JSON.stringify(results, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Try to connect directly
    console.log('🔄 Attempting to connect to database...');
    const sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      idle_timeout: 10,
      connect_timeout: 10,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const test = await sql`SELECT 1 as test, NOW() as time, version() as version`;
    results.db.connected = true;
    results.db.testResult = test;
    console.log('✅ Database connected successfully!');

    // Close the connection
    await sql.end();
  } catch (err: any) {
    results.db.error = err.message;
    results.db.stack = err.stack;
    console.error('❌ Database connection failed:', err.message);
    console.error('Stack:', err.stack);
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: results.db.connected ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
};
