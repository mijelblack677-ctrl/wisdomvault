import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/referral/approve.ts
var approve_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const { userId } = JSON.parse(rawBody);
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const pendingReferrals = await sql`
      SELECT 
        r.id as referral_id,
        r.referrer_id,
        r.bonus_amount,
        r.fee_deducted,
        r.net_amount,
        u.full_name as referrer_name
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      WHERE r.referred_id = ${userId} 
        AND r.is_paid = false
        AND r.referral_type = 'first_level'
    `;
		if (pendingReferrals.length === 0) return new Response(JSON.stringify({
			success: true,
			message: "No pending referrals to approve",
			approved: 0
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		let approvedCount = 0;
		for (const referral of pendingReferrals) {
			const referrerId = referral.referrer_id;
			const bonusAmount = parseFloat(referral.bonus_amount);
			parseFloat(referral.fee_deducted);
			parseFloat(referral.net_amount);
			const walletResult = await sql`
        SELECT id, balance_available, gross_earnings, fees_paid 
        FROM wallets WHERE user_id = ${referrerId}
      `;
			if (walletResult.length === 0) {
				console.error(`Wallet not found for referrer: ${referrerId}`);
				continue;
			}
			const wallet = walletResult[0];
			const currentBalance = parseFloat(wallet.balance_available);
			const currentGross = parseFloat(wallet.gross_earnings);
			const currentFees = parseFloat(wallet.fees_paid || 0);
			const chunkSize = 6e3;
			const feePerChunk = 1e3;
			const oldChunks = Math.floor(currentBalance / chunkSize);
			const newTotal = currentBalance + bonusAmount;
			const actualFee = (Math.floor(newTotal / chunkSize) - oldChunks) * feePerChunk;
			const actualNet = bonusAmount - actualFee;
			const newBalance = newTotal - actualFee;
			await sql`
        UPDATE wallets 
        SET balance_available = ${newBalance},
            gross_earnings = ${currentGross + bonusAmount},
            fees_paid = ${currentFees + actualFee}
        WHERE id = ${wallet.id}
      `;
			await sql`
        UPDATE referrals 
        SET is_paid = true,
            fee_deducted = ${actualFee},
            net_amount = ${actualNet}
        WHERE id = ${referral.referral_id}
      `;
			await sql`
        INSERT INTO transactions (
          wallet_id, 
          referral_id, 
          transaction_type, 
          amount, 
          fee_deducted, 
          balance_before, 
          balance_after, 
          description
        ) VALUES (
          ${wallet.id}, 
          ${referral.referral_id}, 
          'referral_bonus',
          ${bonusAmount}, 
          ${actualFee},
          ${currentBalance}, 
          ${newBalance},
          ${"Referral bonus for " + referral.referrer_name + " - Fee: " + actualFee + " MWK"}
        )
      `;
			await sql`
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          link
        ) VALUES (
          ${referrerId}, 
          'referral_approved',
          '🎉 Referral Bonus Earned!',
          ${"Your referral bonus of MWK " + actualNet.toLocaleString() + " has been credited! The user has been verified."},
          '/dashboard/invites'
        )
      `;
			approvedCount++;
		}
		return new Response(JSON.stringify({
			success: true,
			message: `Approved ${approvedCount} referral(s)`,
			approved: approvedCount
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Referral approval error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/referral/approve@_@ts
var page = () => approve_exports;
//#endregion
export { page };
