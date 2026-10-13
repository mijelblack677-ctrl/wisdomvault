export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async ({ request }) => {
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

    const packs = await sql`
      SELECT * FROM premium_packs ORDER BY display_order, created_at, id
    `;
    
    const packsWithItems = await Promise.all(packs.map(async (pack: any) => {
      const items = await sql`
        SELECT * FROM premium_content_items WHERE pack_id = ${pack.id} ORDER BY display_order, created_at, id
      `;
      return { ...pack, items };
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      packs: packsWithItems 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin packs GET error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
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
    const { 
      name, 
      price, 
      description, 
      is_free, 
      category, 
      long_description, 
      thumbnail_url 
    } = body;

    if (!name) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Course name is required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const priceValue = is_free ? 0 : (parseFloat(price) || 0);

    const result = await sql`
      INSERT INTO premium_packs (
        name, 
        slug, 
        price, 
        description, 
        is_free,
        category,
        long_description,
        thumbnail_url,
        is_active
      ) VALUES (
        ${name},
        ${slug},
        ${priceValue},
        ${description || ''},
        ${is_free || false},
        ${category || 'General'},
        ${long_description || description || ''},
        ${thumbnail_url || ''},
        true
      )
      RETURNING id, name, price, is_free
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Course created successfully!',
      pack: result[0]
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin packs POST error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
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
    const { packId } = body;

    if (!packId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Pack ID required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    await sql`DELETE FROM premium_content_items WHERE pack_id = ${packId}`;
    await sql`DELETE FROM premium_packs WHERE id = ${packId}`;

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Course deleted successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin packs DELETE error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
