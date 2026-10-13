export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

// GET - List all withdrawals for admin
export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    // Verify admin session
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get URL parameters. LIMIT/OFFSET are clamped to sane bounds; the status
    // filter is validated against an allowlist below (this endpoint previously
    // interpolated `status` straight into SQL — injectable).
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);
    const statusParam = (url.searchParams.get('status') || 'all').toLowerCase();
    const ALLOWED_STATUSES = ['all', 'pending', 'approved', 'processing', 'completed', 'rejected', 'failed', 'cancelled'];
    if (!ALLOWED_STATUSES.includes(statusParam)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid status filter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const status = statusParam;

    // Build where clause - SIMPLIFIED
    let query = `
      SELECT 
        w.id,
        w.wallet_id,
        w.amount_requested,
        w.withdrawal_fee,
        w.amount_paid,
        w.status,
        w.payment_method,
        w.payment_reference,
        w.notes,
        w.requested_at,
        w.processed_at,
        u.full_name,
        u.email,
        u.phone
      FROM withdrawals w
      JOIN wallets wa ON w.wallet_id = wa.id
      JOIN users u ON wa.user_id = u.id
    `;

    // Values are bound as parameters ($1, $2, …) — never interpolated.
    const params: unknown[] = [];
    if (status !== 'all') {
      params.push(status);
      query += ` WHERE w.status = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY w.requested_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    // Execute query
    const withdrawals = await sql.unsafe(query, params);

    // Get total count - SIMPLIFIED
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM withdrawals w
      JOIN wallets wa ON w.wallet_id = wa.id
    `;
    
    if (status !== 'all') {
      countQuery += ` WHERE w.status = $1`;
    }

    const countResult = await sql.unsafe(countQuery, status !== 'all' ? [status] : []);
    const total = countResult[0]?.total || 0;

    // Get stats - SIMPLIFIED
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_requested ELSE 0 END), 0) as pending_amount
      FROM withdrawals
    `;

    const stats = await sql.unsafe(statsQuery);

    return new Response(JSON.stringify({
      success: true,
      withdrawals: withdrawals || [],
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      },
      stats: {
        pending: parseInt(stats[0]?.pending || 0),
        completed: parseInt(stats[0]?.completed || 0),
        rejected: parseInt(stats[0]?.rejected || 0),
        pendingAmount: parseFloat(stats[0]?.pending_amount || 0)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });    } catch (error) {
      const err = error as Error;
      console.error('GET /api/admin/withdrawals error:', err);
      console.error('Error details:', err.message);
      // SECURITY: never return stack traces to the client (info leak).
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to load withdrawals'
      }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - Update withdrawal status
export const PUT: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { withdrawalId, status, notes } = body;

    if (!withdrawalId || !status) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Withdrawal ID and status required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the withdrawal with user_id from wallet
    const withdrawal = await sql`
      SELECT w.*, wa.user_id 
      FROM withdrawals w
      JOIN wallets wa ON w.wallet_id = wa.id
      WHERE w.id = ${withdrawalId}
    `;

    if (withdrawal.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Withdrawal not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update withdrawal
    await sql`
      UPDATE withdrawals 
      SET status = ${status}, 
          notes = ${notes || ''}, 
          processed_at = NOW(), 
          processed_by = ${sessions[0].admin_id}
      WHERE id = ${withdrawalId}
    `;

    // If rejected, add funds back to wallet
    if (status === 'rejected') {
      const wallet = await sql`
        SELECT id, balance_available 
        FROM wallets WHERE user_id = ${withdrawal[0].user_id}
      `;
      
      if (wallet.length > 0) {
        const newBalance = parseFloat(wallet[0].balance_available) + parseFloat(withdrawal[0].amount_requested);
        await sql`
          UPDATE wallets 
          SET balance_available = ${newBalance}
          WHERE id = ${wallet[0].id}
        `;
      }
    }

    // Create notification
    const title = status === 'completed' ? '✅ Withdrawal Approved!' : '❌ Withdrawal Rejected';
    const message = status === 'completed' 
      ? `Your withdrawal of MWK ${parseFloat(withdrawal[0].amount_requested).toLocaleString()} has been approved.`
      : `Your withdrawal of MWK ${parseFloat(withdrawal[0].amount_requested).toLocaleString()} was rejected. ${notes ? 'Reason: ' + notes : ''}`;

    await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        ${withdrawal[0].user_id}, 
        ${'withdrawal_' + status}, 
        ${title}, 
        ${message}, 
        '/dashboard/earnings'
      )
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Withdrawal ${status} successfully` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('PUT /api/admin/withdrawals error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
