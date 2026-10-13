export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

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
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { pack_id, title, content_type, link_type, file_url } = body;

    if (!pack_id || !title) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Pack ID and title are required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if pack exists
    const packCheck = await sql`
      SELECT id FROM premium_packs WHERE id = ${pack_id}
    `;
    
    if (packCheck.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Pack not found' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Check if link_type column exists
    let hasLinkType = false;
    try {
      const colCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'premium_content_items' 
        AND column_name = 'link_type'
      `;
      hasLinkType = colCheck.length > 0;
    } catch (e) {
      console.log('⚠️ Could not check link_type column');
    }

    let result;
    if (hasLinkType) {
      result = await sql`
        INSERT INTO premium_content_items (
          pack_id, title, content_type, link_type, file_url, display_order
        ) VALUES (
          ${pack_id}, ${title}, ${content_type || 'pdf'}, ${link_type || 'url'}, ${file_url || ''}, 0
        )
        RETURNING id, title, content_type
      `;
    } else {
      result = await sql`
        INSERT INTO premium_content_items (
          pack_id, title, content_type, file_url, display_order
        ) VALUES (
          ${pack_id}, ${title}, ${content_type || 'pdf'}, ${file_url || ''}, 0
        )
        RETURNING id, title, content_type
      `;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Item added successfully!',
      item: result[0]
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin packs items POST error:', err);
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
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return new Response(JSON.stringify({ success: false, message: 'Item ID required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    await sql`
      DELETE FROM premium_content_items WHERE id = ${itemId}
    `;

    return new Response(JSON.stringify({ success: true, message: 'Item deleted successfully' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin packs items DELETE error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
