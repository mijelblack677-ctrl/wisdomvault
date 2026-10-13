import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/lib/publicStats.ts
var CACHE_TTL_MS = 12e4;
var cached = null;
var inFlight = null;
async function queryStats() {
	const sql = client;
	const content = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE is_published = true AND content_type = 'book') AS book_count,
      COUNT(*) FILTER (WHERE is_published = true AND content_type = 'guide') AS guide_count,
      COUNT(*) FILTER (WHERE is_published = true AND content_type IN ('video', 'meditations', 'teaching', 'counsel')) AS video_count,
      COUNT(*) FILTER (WHERE is_published = true AND content_type = 'audio') AS audio_count
    FROM content_items
  `)[0] || {};
	const packRows = await sql`
    SELECT COUNT(*) AS count FROM premium_packs WHERE is_active = true
  `;
	const memberRows = await sql`
    SELECT COUNT(*) AS count FROM users
  `;
	const configs = await sql`
    SELECT config_key, config_value
    FROM platform_config
    WHERE config_key IN (
      'registration_fee_mwk',
      'registration_fee_usd',
      'registration_fee_renewal',
      'referral_bonus_standard',
      'referral_bonus_founding',
      'referral_bonus_renewal',
      'withdrawal_min_amount',
      'withdrawal_fee_percent',
      'founding_member_limit',
      'refund_days'
    )
  `;
	const config = {};
	for (const c of configs) config[c.config_key] = c.config_value;
	return {
		bookCount: parseInt(content.book_count || "0", 10),
		guideCount: parseInt(content.guide_count || "0", 10),
		videoCount: parseInt(content.video_count || "0", 10),
		audioCount: parseInt(content.audio_count || "0", 10),
		coursePackCount: parseInt(packRows[0]?.count || "0", 10),
		memberCount: parseInt(memberRows[0]?.count || "0", 10),
		registrationFeeMwk: parseFloat(config["registration_fee_mwk"] || "13000"),
		registrationFeeUsd: parseFloat(config["registration_fee_usd"] || "8"),
		registrationFeeRenewal: parseFloat(config["registration_fee_renewal"] || "5000"),
		referralBonusStandard: parseFloat(config["referral_bonus_standard"] || "7000"),
		referralBonusFounding: parseFloat(config["referral_bonus_founding"] || "7000"),
		referralBonusRenewal: parseFloat(config["referral_bonus_renewal"] || "1000"),
		withdrawalMinAmount: parseFloat(config["withdrawal_min_amount"] || "5000"),
		withdrawalMaxAmount: 15e5,
		withdrawalFeePercent: parseFloat(config["withdrawal_fee_percent"] || "20"),
		foundingMemberLimit: parseInt(config["founding_member_limit"] || "100", 10),
		refundDays: parseInt(config["refund_days"] || "7", 10),
		usdRate: 1800
	};
}
/**
* Return the public stats, served from a short-lived in-process cache.
* Returns null only when the database is unreachable and no previous
* snapshot exists.
*/
async function getPublicStats() {
	if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
	if (inFlight) return inFlight;
	inFlight = (async () => {
		try {
			const value = await queryStats();
			cached = {
				at: Date.now(),
				value
			};
			return value;
		} catch (error) {
			console.error("publicStats: query failed:", error);
			return cached?.value ?? null;
		} finally {
			inFlight = null;
		}
	})();
	return inFlight;
}
//#endregion
export { getPublicStats as t };
