export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

// GET - list all payment proofs
export const GET: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const sql = client;

    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const proofs = await sql`
      SELECT pp.*, u.full_name as user_name, pp2.name as pack_name
      FROM payment_proofs pp
      JOIN users u ON pp.user_id = u.id
      JOIN premium_packs pp2 ON pp.pack_id = pp2.id
      ORDER BY pp.created_at DESC
    `;

    return new Response(JSON.stringify({ success: true, proofs }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - approve or reject
export const PUT: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const sql = client;

    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { proofId, userId, packId, status, notes } = body;

    if (!proofId || !status) {
      return new Response(JSON.stringify({ success: false, message: 'Proof ID and status required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update proof status
    await sql`
      UPDATE payment_proofs 
      SET status = ${status}, admin_notes = ${notes || ''}, reviewed_by = ${sessions[0].admin_id}, reviewed_at = NOW()
      WHERE id = ${proofId}
    `;

    // If approved, unlock the pack for the user
    if (status === 'approved' && userId && packId) {
      // Check if already owned
      const existing = await sql`SELECT id FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}`;
      if (existing.length === 0) {
        const pack = await sql`SELECT price FROM premium_packs WHERE id = ${packId}`;
        await sql`
          INSERT INTO user_premium_packs (user_id, pack_id, amount_paid, transaction_ref)
          VALUES (${userId}, ${packId}, ${pack[0]?.price || 0}, ${'proof-' + proofId})
        `;
      }

      // Notify user
      const packData = await sql`SELECT name FROM premium_packs WHERE id = ${packId}`;
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'payment_approved', 'Payment Approved!', 
        ${'Your payment for "' + (packData[0]?.name || 'pack') + '" has been approved. The pack is now unlocked!'}, 
        '/dashboard')
      `;
    }

    // If rejected, notify user
    if (status === 'rejected' && userId) {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'payment_rejected', 'Payment Rejected', 
        ${'Your payment proof was rejected. ' + (notes || 'Please contact support for details.')}, 
        '/dashboard')
      `;
    }

    return new Response(JSON.stringify({ success: true, message: 'Payment ' + status }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
