export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse } from '@lib/vaultproAuth';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireVaultPro(request);
    const sql = client;

    const id = url.searchParams.get('id') || '';
    if (!id) {
      return jsonResponse({ success: false, message: 'User id required' }, 400);
    }

    // Note: consent_given_at is fetched separately below — the column may not
    // exist yet if migration 0003 hasn't been applied (see
    // drizzle/0003_add_consent_column.sql), which would 500 this endpoint.
    const users = await sql`
      SELECT
        u.id, u.full_name, u.email, u.phone, u.referral_code,
        u.referred_by, u.payment_status, u.is_active, u.is_founding_member,
        u.founding_member_number, u.registration_year, u.renewal_due_date,
        u.created_at, u.updated_at,
        u.total_gross_earnings, u.total_fees_paid, u.total_net_earnings,
        u.fee_chunks_count,
        w.balance_available, w.store_credit, w.gross_earnings,
        w.gross_earnings_total, w.total_withdrawn, w.fees_paid
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.id = ${id}
    `;

    if (users.length === 0) {
      return jsonResponse({ success: false, message: 'User not found' }, 404);
    }

    const user = users[0];

    // Best-effort consent timestamp: null when the column hasn't been
    // migrated yet instead of failing the whole request.
    try {
      const consent = await sql`SELECT consent_given_at FROM users WHERE id = ${user.id}`;
      user.consent_given_at = consent[0]?.consent_given_at ?? null;
    } catch {
      user.consent_given_at = null;
    }

    // Upline (who referred this user)
    let upline = null;
    if (user.referred_by) {
      const up = await sql`
        SELECT u.id, u.full_name, u.email, u.phone, u.referral_code, u.payment_status, u.is_active,
               w.balance_available, w.store_credit
        FROM users u
        LEFT JOIN wallets w ON w.user_id = u.id
        WHERE u.id = ${user.referred_by}
      `;
      upline = up[0] || null;
    }

    // Direct downline (people this user referred)
    const downline = await sql`
      SELECT u.id, u.full_name, u.email, u.phone, u.referral_code,
             u.payment_status, u.is_active, u.created_at,
             w.balance_available, w.store_credit
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.referred_by = ${user.id}
      ORDER BY u.created_at DESC
      LIMIT 100
    `;

    // Transactions for the user's wallet
    const transactions = await sql`
      SELECT t.*
      FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      WHERE w.user_id = ${user.id}
      ORDER BY t.created_at DESC
      LIMIT 100
    `;

    // Referrals where this user is the referrer (level 1 & 2)
    const referrals = await sql`
      SELECT r.id, r.referral_type, r.bonus_amount, r.is_paid, r.created_at,
             u.full_name as referred_name, u.email as referred_email
      FROM referrals r
      LEFT JOIN users u ON u.id = r.referred_id
      WHERE r.referrer_id = ${user.id}
      ORDER BY r.created_at DESC
      LIMIT 100
    `;

    return jsonResponse({
      success: true,
      user,
      upline,
      downline,
      transactions,
      referrals,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};