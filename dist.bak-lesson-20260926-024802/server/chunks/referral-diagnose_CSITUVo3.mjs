import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
//#region src/pages/api/vaultpro/referral-diagnose.ts
var referral_diagnose_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
/**
* GET  /api/vaultpro/referral-diagnose  → run diagnostics (overview + missing level-2 check)
* POST /api/vaultpro/referral-diagnose  → body { fix: true } fixes missing level-2 bonuses
*/
var GET = async ({ request }) => {
	try {
		await requireVaultPro(request);
		const sql = client;
		const byType = await sql`
      SELECT referral_type, COUNT(*) as count,
             COUNT(*) FILTER (WHERE is_paid) as paid,
             COALESCE(SUM(bonus_amount), 0) as total_bonus
      FROM referrals GROUP BY referral_type ORDER BY referral_type
    `;
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
		const level2Count = await sql`SELECT COUNT(*) as count FROM referrals WHERE referral_type = 'second_level'`;
		const firstLevelCount = await sql`SELECT COUNT(*) as count FROM referrals WHERE referral_type = 'first_level'`;
		return jsonResponse({
			success: true,
			byType,
			missing,
			missingCount: missing.length,
			level2Count: parseInt(level2Count[0].count || "0"),
			firstLevelCount: parseInt(firstLevelCount[0].count || "0")
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
var POST = async ({ request }) => {
	try {
		const admin = await requireVaultPro(request);
		const sql = client;
		if ((await readJson(request)).fix !== true) return jsonResponse({
			success: false,
			message: "Set fix: true to run the fix"
		}, 400);
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
		const LEVEL2_AMOUNT = 1e3;
		let fixed = 0;
		for (const m of missing) try {
			if ((await sql`
          SELECT id FROM referrals
          WHERE referrer_id = ${m.original_referrer}
            AND referred_id = ${m.level2_user}
            AND referral_type = 'second_level'
        `).length > 0) continue;
			await sql`
          INSERT INTO referrals (
            referrer_id, referred_id, referral_type, registration_year,
            bonus_amount, is_paid, created_at
          ) VALUES (
            ${m.original_referrer}, ${m.level2_user}, 'second_level',
            ${m.level2_date ? new Date(m.level2_date).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear()},
            ${LEVEL2_AMOUNT}, true, ${m.level2_date || (/* @__PURE__ */ new Date()).toISOString()}
          )
          RETURNING id
        `;
			await sql`
          UPDATE wallets
          SET store_credit = store_credit + ${LEVEL2_AMOUNT},
              gross_earnings = gross_earnings + ${LEVEL2_AMOUNT},
              updated_at = NOW()
          WHERE user_id = ${m.original_referrer}
        `;
			await sql`
          INSERT INTO transactions (wallet_id, transaction_type, amount, fee_deducted, net_amount,
                                    balance_before, balance_after, description)
          SELECT w.id, 'referral_bonus', ${LEVEL2_AMOUNT}, 0, ${LEVEL2_AMOUNT},
                 w.store_credit - ${LEVEL2_AMOUNT}, w.store_credit,
                 ${"Level 2 referral bonus for user " + m.level2_user}
          FROM wallets w WHERE w.user_id = ${m.original_referrer}
        `;
			fixed++;
		} catch (e) {
			console.error("Referral fix error for", m, e);
		}
		await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${admin.id}, 'vaultpro_fix_level2', ${JSON.stringify({
			fixed,
			found: missing.length
		})}::jsonb)
    `;
		return jsonResponse({
			success: true,
			message: `Fixed ${fixed} missing level-2 bonuses`,
			fixed,
			found: missing.length
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/referral-diagnose@_@ts
var page = () => referral_diagnose_exports;
//#endregion
export { page };
