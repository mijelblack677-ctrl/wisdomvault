export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse } from '@lib/vaultproAuth';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireVaultPro(request);
    const sql = client;

    const identifier = url.searchParams.get('identifier') || '';
    if (!identifier) {
      return jsonResponse({ success: false, message: 'identifier (email/phone/referral_code/id) required' }, 400);
    }

    // Find the user.
    // The id match is kept in a separate query: putting `OR id = ${identifier}`
    // in the same WHERE makes Postgres cast the identifier to uuid, which
    // 500s on any non-UUID input like a referral code or name fragment.
    // Name search is also separate: ILIKE on full_name, so admins can search
    // by "sharlom" or "miracle black" instead of only exact email/phone/code.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const users = isUuid
      ? await sql`
          SELECT id, full_name, email, phone, referral_code, referred_by, payment_status, is_active
          FROM users WHERE id = ${identifier} LIMIT 1
        `
      : await sql`
          SELECT id, full_name, email, phone, referral_code, referred_by, payment_status, is_active
          FROM users
          WHERE email = ${identifier}
             OR phone = ${identifier}
             OR referral_code = ${identifier}
             OR full_name ILIKE ${'%' + identifier + '%'}
          ORDER BY (email = ${identifier}) DESC, (phone = ${identifier}) DESC,
                   (referral_code = ${identifier}) DESC, full_name
          LIMIT 1
        `;

    if (users.length === 0) {
      return jsonResponse({ success: false, message: 'User not found' }, 404);
    }

    const user = users[0];

    // ── Upline chain (walk referred_by up) ──────────────────────────────────
    const upline: any[] = [];
    let current = user.referred_by;
    let guard = 0;
    while (current && guard < 10) {
      const rows = await sql`
        SELECT id, full_name, email, phone, referral_code, payment_status, is_active, referred_by
        FROM users WHERE id = ${current}
      `;
      if (rows.length === 0) break;
      upline.push(rows[0]);
      current = rows[0].referred_by;
      guard++;
    }

    // ── Direct downline ─────────────────────────────────────────────────────
    const downline = await sql`
      SELECT id, full_name, email, phone, referral_code, payment_status, is_active, created_at
      FROM users WHERE referred_by = ${user.id}
      ORDER BY created_at DESC
      LIMIT 200
    `;

    // ── Level 2 downline (referred by the direct downline) ──────────────────
    const level2 = await sql`
      SELECT
        u1.full_name as referrer_name, u1.email as referrer_email,
        u2.id as id, u2.full_name as full_name, u2.email as email,
        u2.phone as phone, u2.referral_code as referral_code,
        u2.payment_status as payment_status, u2.created_at as created_at
      FROM users u1
      JOIN users u2 ON u2.referred_by = u1.id
      WHERE u1.referred_by = ${user.id}
      ORDER BY u2.created_at DESC
      LIMIT 200
    `;

    return jsonResponse({
      success: true,
      user,
      upline,
      downlineCount: downline.length,
      downline,
      level2,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};