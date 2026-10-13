export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const PUT: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`
      SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()
    `;
    
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Content ID required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    await sql`
      UPDATE sponsored_content 
      SET is_active = ${is_active} 
      WHERE id = ${id}
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      message: is_active ? 'Task activated' : 'Task deactivated' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin sponsored toggle error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
