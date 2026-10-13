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

    // Append to the end of this course: one past the highest display_order in
    // the pack. Previously every insert hard-coded 0, so all modules in a course
    // shared a single value and `ORDER BY display_order` became a no-op tie —
    // Postgres then returned them in arbitrary physical order, which is why
    // uploads did not come back in the order they were added.
    //
    // The MAX() subquery runs inside the same statement as the INSERT, so two
    // concurrent uploads cannot both read the same "next" value. The read
    // queries also break residual ties on created_at, then id.
    let result;
    if (hasLinkType) {
      result = await sql`
        INSERT INTO premium_content_items (
          pack_id, title, content_type, link_type, file_url, display_order
        ) VALUES (
          ${pack_id}, ${title}, ${content_type || 'pdf'}, ${link_type || 'url'}, ${file_url || ''},
          (SELECT COALESCE(MAX(display_order) + 1, 0) FROM premium_content_items WHERE pack_id = ${pack_id})
        )
        RETURNING id, title, content_type
      `;
    } else {
      result = await sql`
        INSERT INTO premium_content_items (
          pack_id, title, content_type, file_url, display_order
        ) VALUES (
          ${pack_id}, ${title}, ${content_type || 'pdf'}, ${file_url || ''},
          (SELECT COALESCE(MAX(display_order) + 1, 0) FROM premium_content_items WHERE pack_id = ${pack_id})
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

// PUT /api/admin/packs/items
//
// Reorders a course's modules. The body carries the COMPLETE list of item ids
// for the pack in the desired order and display_order is rewritten as the array
// index, so the operation is absolute rather than relative — replaying the same
// request is a no-op, and two concurrent reorders cannot interleave into a
// half-applied order.
//
//   { packId: "…", itemIds: ["first-id", "second-id", …] }
//
// The client must send every item currently in the pack; anything else means it
// is working from a stale list, so we reject it (409) and ask it to reload
// rather than silently dropping modules to the end.
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
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { packId, itemIds } = body;

    if (!packId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'packId and a non-empty itemIds array are required'
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // A duplicate or foreign id would leave a module unpositioned, so treat any
    // list that is not exactly the pack's current membership as stale.
    const current = await sql`
      SELECT id FROM premium_content_items WHERE pack_id = ${packId}
    `;
    const currentIds = new Set(current.map((r: any) => r.id));
    const uniqueIds = [...new Set(itemIds as string[])];
    const isStale =
      uniqueIds.length !== currentIds.size ||
      uniqueIds.some((id) => !currentIds.has(id));

    if (isStale) {
      return new Response(JSON.stringify({
        success: false,
        message: 'This course changed since the list was loaded. Reload and try again.'
      }), {
        status: 409, headers: { 'Content-Type': 'application/json' }
      });
    }

    // One transaction: a partially applied order is never visible to readers.
    await sql.begin(async (tx: any) => {
      for (let i = 0; i < uniqueIds.length; i++) {
        await tx`
          UPDATE premium_content_items
          SET display_order = ${i}
          WHERE id = ${uniqueIds[i]} AND pack_id = ${packId}
        `;
      }
    });

    return new Response(JSON.stringify({ success: true, message: 'Order updated' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin packs items PUT error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
