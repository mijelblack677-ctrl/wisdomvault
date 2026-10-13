export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse } from '@lib/vaultproAuth';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    await requireVaultPro(request);
    const sql = client;

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500);

    const referrals = await sql`
      SELECT
        r.id, r.referral_type, r.bonus_amount, r.is_paid, r.created_at,
        referrer.full_name as referrer_name, referrer.email as referrer_email,
        referred.full_name as referred_name, referred.email as referred_email
      FROM referrals r
      LEFT JOIN users referrer ON referrer.id = r.referrer_id
      LEFT JOIN users referred ON referred.id = r.referred_id
      ORDER BY r.created_at DESC
      LIMIT ${limit}
    `;

    const stats = await sql`
      SELECT
        referral_type,
        COUNT(*) as count,
        COALESCE(SUM(bonus_amount), 0) as total_bonus,
        COUNT(*) FILTER (WHERE is_paid = true) as paid_count,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true), 0) as total_paid
      FROM referrals
      GROUP BY referral_type
      ORDER BY referral_type
    `;

    const total = await sql`SELECT COUNT(*) as count FROM referrals`;

    return jsonResponse({
      success: true,
      referrals,
      stats,
      total: parseInt(total[0].count || '0'),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};