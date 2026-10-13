export const prerender = false;
import type { APIRoute } from 'astro';
import { client } from '../../lib/db/connection';

export const GET: APIRoute = async () => {
  try {
    const result = await client`SELECT 1 as test`;
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connected!',
      result: result[0]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({
      success: false,
      message: 'Database connection failed',
      error: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
