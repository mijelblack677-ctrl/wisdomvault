export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse, readJson } from '@lib/vaultproAuth';

/**
 * GET  /api/vaultpro/referral-diagnose  → run diagnostics (overview + missing level-2 check)
 * POST /api/vaultpro/referral-diagnose  → body { fix: true } fixes missing level-2 bonuses
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    await requireVaultPro(request);
    const sql = client;

    // 1. Referrals by type
    const byType = await sql`
      SELECT referral_type, COUNT(*) as count,
             COUNT(*) FILTER (WHERE is_paid) as paid,
             COALESCE(SUM(bonus_amount), 0) as total_bonus
      FROM referrals GROUP BY referral_type ORDER BY referral_type
    `;

    // 2. Potential missing level-2 bonuses
    const missing = await sql`
      WITH direct_referrals AS (
        SELECT referrer_id, referred_id, created_at
        FROM referrals
        WHERE referral_type = 'first_level'
      ),
      level2_potential AS (
        SELECT
          d1.referrer_id as original_referrer,
          d2.referred_id as level2_user,
          d2.created_at as level2_date
        FROM direct_referrals d1
        JOIN direct_referrals d2 ON d2.referrer_id = d1.referred_id
        WHERE NOT EXISTS (
          SELECT 1 FROM referrals r
          WHERE r.referrer_id = d1.referrer_id
            AND r.referred_id = d2.referred_id
            AND r.referral_type = 'second_level'
        )
      )
      SELECT
        u1.full_name as referrer_name, u1.email as referrer_email,
        u2.full_name as level2_name, u2.email as level2_email,
        lp.level2_date
      FROM level2_potential lp
      JOIN users u1 ON u1.id = lp.original_referrer
      JOIN users u2 ON u2.id = lp.level2_user
      ORDER BY lp.level2_date DESC
      LIMIT 100
    `;

    // 3. Level-2 count check
    const level2Count = await sql`SELECT COUNT(*) as count FROM referrals WHERE referral_type = 'second_level'`;
    const firstLevelCount = await sql`SELECT COUNT(*) as count FROM referrals WHERE referral_type = 'first_level'`;

    return jsonResponse({
      success: true,
      byType,
      missing,
      missingCount: missing.length,
      level2Count: parseInt(level2Count[0].count || '0'),
      firstLevelCount: parseInt(firstLevelCount[0].count || '0'),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const admin = await requireVaultPro(request);
    const sql = client;
    const body = await readJson(request);

    if (body.fix !== true) {
      return jsonResponse({ success: false, message: 'Set fix: true to run the fix' }, 400);
    }

    // Recompute the same "missing level 2" query
    const missing = await sql`
      WITH direct_referrals AS (
        SELECT referrer_id, referred_id, created_at
        FROM referrals WHERE referral_type = 'first_level'
      ),
      level2_potential AS (
        SELECT
          d1.referrer_id as original_referrer,
          d2.referred_id as level2_user,
          d2.created_at as level2_date
        FROM direct_referrals d1
        JOIN direct_referrals d2 ON d2.referrer_id = d1.referred_id
        WHERE NOT EXISTS (
          SELECT 1 FROM referrals r
          WHERE r.referrer_id = d1.referrer_id
            AND r.referred_id = d2.referred_id
            AND r.referral_type = 'second_level'
        )
      )
      SELECT lp.original_referrer, lp.level2_user, lp.level2_date
      FROM level2_potential lp
      LIMIT 200
    `;

    const LEVEL2_AMOUNT = 1000; // MWK — matches db_config.py SECOND_LEVEL_BONUS
    let fixed = 0;

    for (const m of missing) {
      try {
        // Already exists? skip
        const exists = await sql`
          SELECT id FROM referrals
          WHERE referrer_id = ${m.original_referrer}
            AND referred_id = ${m.level2_user}
            AND referral_type = 'second_level'
        `;
        if (exists.length > 0) continue;

        const inserted = await sql`
          INSERT INTO referrals (
            referrer_id, referred_id, referral_type, registration_year,
            bonus_amount, is_paid, created_at
          ) VALUES (
            ${m.original_referrer}, ${m.level2_user}, 'second_level',
            ${m.level2_date ? new Date(m.level2_date).getFullYear() : new Date().getFullYear()},
            ${LEVEL2_AMOUNT}, true, ${m.level2_date || new Date().toISOString()}
          )
          RETURNING id
        `;

        // Credit the referrer's store credit
        await sql`
          UPDATE wallets
          SET store_credit = store_credit + ${LEVEL2_AMOUNT},
              gross_earnings = gross_earnings + ${LEVEL2_AMOUNT},
              updated_at = NOW()
          WHERE user_id = ${m.original_referrer}
        `;

        // Transaction record
        await sql`
          INSERT INTO transactions (wallet_id, transaction_type, amount, fee_deducted, net_amount,
                                    balance_before, balance_after, description)
          SELECT w.id, 'referral_bonus', ${LEVEL2_AMOUNT}, 0, ${LEVEL2_AMOUNT},
                 w.store_credit - ${LEVEL2_AMOUNT}, w.store_credit,
                 ${'Level 2 referral bonus for user ' + m.level2_user}
          FROM wallets w WHERE w.user_id = ${m.original_referrer}
        `;

        fixed++;
      } catch (e) {
        console.error('Referral fix error for', m, e);
      }
    }

    await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${admin.id}, 'vaultpro_fix_level2', ${JSON.stringify({ fixed, found: missing.length })}::jsonb)
    `;

    return jsonResponse({ success: true, message: `Fixed ${fixed} missing level-2 bonuses`, fixed, found: missing.length });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};