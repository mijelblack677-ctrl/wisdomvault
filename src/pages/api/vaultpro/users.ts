export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse } from '@lib/vaultproAuth';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireVaultPro(request);
    const sql = client;

    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let where = sql`WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      where = sql`${where} AND (
        u.full_name ILIKE ${'%' + search + '%'} OR
        u.email ILIKE ${'%' + search + '%'} OR
        u.phone ILIKE ${'%' + search + '%'} OR
        u.referral_code ILIKE ${'%' + search + '%'}
      )`;
    }
    if (status) {
      where = sql`${where} AND u.payment_status = ${status}`;
    }

    const users = await sql`
      SELECT
        u.id, u.full_name, u.email, u.phone, u.referral_code,
        u.payment_status, u.is_active, u.is_founding_member,
        u.founding_member_number, u.registration_year, u.renewal_due_date,
        u.created_at, u.updated_at,
        u.total_gross_earnings, u.total_fees_paid, u.total_net_earnings,
        w.balance_available, w.store_credit, w.gross_earnings,
        w.total_withdrawn, w.fees_paid, w.gross_earnings_total,
        (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = u.id) as referrals_count
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = await sql`
      SELECT COUNT(*) as count FROM users u ${where}
    `;

    return jsonResponse({
      success: true,
      users,
      total: parseInt(total[0].count || '0'),
      offset,
      limit,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};