//#region src/lib/paychangu.ts
/**
* Shared PayChangu payment verification helpers.
*
* Single source of truth for:
*  - verifying a payment server-side (/verify-payment/{tx_ref})
*  - auto-verifying a user account after a confirmed payment
*
* Used by the browser-redirect callback, the webhook handler, and the
* user-facing "check my payment" reconciliation endpoint so all three
* paths behave identically.
*/
async function paychanguVerifyPayment(txRef) {
	const verifyData = await (await fetch(`https://api.paychangu.com/verify-payment/${txRef}`, {
		method: "GET",
		headers: {
			"Accept": "application/json",
			"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
		}
	})).json();
	const topOk = verifyData.status === "success" || verifyData.status === "successful";
	const innerStatus = verifyData.data?.status;
	const confirmedPaid = topOk && innerStatus === "success";
	const explicitlyFailed = verifyData.status === "failed" || verifyData.status === "cancelled" || innerStatus === "failed" || innerStatus === "cancelled" || innerStatus === "expired";
	return {
		verifyData,
		confirmedPaid,
		stillPending: topOk && !confirmedPaid && !explicitlyFailed,
		explicitlyFailed,
		paymentData: verifyData.data || null
	};
}
async function markTransactionVerified(sql, txRef, paymentData) {
	await sql`
    UPDATE paychangu_transactions
    SET status = 'success',
        payment_channel = ${paymentData?.authorization?.channel || "unknown"},
        payment_reference = ${paymentData?.reference || ""},
        verified_at = NOW(),
        raw_response = ${JSON.stringify(paymentData || {})}::jsonb
    WHERE tx_ref = ${txRef}
  `;
}
async function markTransactionFailed(sql, txRef, raw) {
	await sql`
    UPDATE paychangu_transactions
    SET status = 'failed',
        raw_response = ${JSON.stringify(raw || {})}::jsonb,
        verified_at = NOW()
    WHERE tx_ref = ${txRef}
  `;
}
/**
* Auto-verify a user account after successful PayChangu payment.
* Idempotent: if the user is already verified it returns immediately.
*
* STEP 1 marks the user verified — this must never be rolled back if later
* best-effort steps (referrals, notifications) fail.
*/
async function autoVerifyUser(sql, userId, txRef, amount) {
	console.log(`🔄 Auto-verifying user ${userId} after PayChangu payment ${txRef}`);
	if ((await sql`
    UPDATE users
    SET payment_status = 'verified',
        updated_at = NOW()
    WHERE id = ${userId} AND payment_status != 'verified'
    RETURNING id
  `).length === 0) {
		console.log(`ℹ️ User ${userId} already verified — skipping`);
		return;
	}
	console.log(`✅ User ${userId} marked as verified`);
	try {
		await sql.begin(async (tx) => {
			const pendingReferralsReceived = await tx`
        SELECT
          r.id as referral_id,
          r.referrer_id,
          r.bonus_amount,
          r.referral_type
        FROM referrals r
        WHERE r.referred_id = ${userId}
          AND r.is_paid = false
        ORDER BY r.created_at ASC
      `;
			for (const referral of pendingReferralsReceived) {
				const referrerId = referral.referrer_id;
				const bonusAmount = parseFloat(referral.bonus_amount);
				const referralId = referral.referral_id;
				const walletResult = await tx`
          SELECT id, balance_available, gross_earnings, gross_earnings_total
          FROM wallets WHERE user_id = ${referrerId}
        `;
				if (walletResult.length === 0) {
					console.error(`❌ No wallet found for referrer ${referrerId}`);
					continue;
				}
				const wallet = walletResult[0];
				const currentBalance = parseFloat(wallet.balance_available || 0);
				const currentGross = parseFloat(wallet.gross_earnings || 0);
				const currentGrossTotal = parseFloat(wallet.gross_earnings_total || 0);
				const newBalance = currentBalance + bonusAmount;
				const isFirstLevel = referral.referral_type === "first_level";
				await tx`
          UPDATE wallets
          SET balance_available = ${newBalance},
              gross_earnings = ${currentGross + bonusAmount},
              gross_earnings_total = ${currentGrossTotal + bonusAmount},
              updated_at = NOW()
          WHERE id = ${wallet.id}
        `;
				await tx`
          UPDATE users
          SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + ${bonusAmount},
              total_net_earnings = COALESCE(total_net_earnings, 0) + ${bonusAmount}
          WHERE id = ${referrerId}
        `;
				await tx`
          UPDATE referrals
          SET is_paid = true, fee_deducted = 0, net_amount = ${bonusAmount}
          WHERE id = ${referralId}
        `;
				await tx`
          INSERT INTO transactions (
            wallet_id, referral_id, transaction_type,
            amount, fee_deducted, net_amount,
            balance_before, balance_after, description
          ) VALUES (
            ${wallet.id},
            ${referralId},
            ${isFirstLevel ? "referral_bonus" : "second_level_referral"},
            ${bonusAmount}, 0,
            ${bonusAmount},
            ${currentBalance},
            ${newBalance},
            ${isFirstLevel ? `First-level referral bonus - MWK ${bonusAmount.toLocaleString()}` : `Second-level referral bonus - MWK ${bonusAmount.toLocaleString()}`}
          )
        `;
				await tx`
          INSERT INTO referral_earnings (
            user_id, referral_id, gross_amount, fee_deducted, net_amount,
            chunk_count_before, chunk_count_after
          ) VALUES (
            ${referrerId}, ${referralId},
            ${bonusAmount}, 0, ${bonusAmount}, 0, 0
          )
        `;
				await tx`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${referrerId},
            ${isFirstLevel ? "referral_approved" : "second_level_referral_approved"},
            ${isFirstLevel ? "🎉 Referral Bonus Earned!" : "🌟 Network Bonus Earned!"},
            ${isFirstLevel ? `🎉 Referral bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.` : `🌟 Network bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.`},
            '/dashboard/invites')
        `;
			}
			const pendingReferralsMade = await tx`
        SELECT
          r.id as referral_id,
          r.referred_id,
          r.bonus_amount,
          r.referral_type
        FROM referrals r
        WHERE r.referrer_id = ${userId}
          AND r.referred_id IN (SELECT id FROM users WHERE payment_status = 'verified')
          AND r.is_paid = false
        ORDER BY r.created_at ASC
      `;
			for (const referral of pendingReferralsMade) {
				referral.referred_id;
				const bonusAmount = parseFloat(referral.bonus_amount);
				const referralId = referral.referral_id;
				const walletResult = await tx`
          SELECT id, balance_available, gross_earnings, gross_earnings_total
          FROM wallets WHERE user_id = ${userId}
        `;
				if (walletResult.length === 0) {
					console.error(`❌ No wallet found for user ${userId}`);
					continue;
				}
				const wallet = walletResult[0];
				const currentBalance = parseFloat(wallet.balance_available || 0);
				const currentGross = parseFloat(wallet.gross_earnings || 0);
				const currentGrossTotal = parseFloat(wallet.gross_earnings_total || 0);
				const newBalance = currentBalance + bonusAmount;
				const isFirstLevel = referral.referral_type === "first_level";
				await tx`
          UPDATE wallets
          SET balance_available = ${newBalance},
              gross_earnings = ${currentGross + bonusAmount},
              gross_earnings_total = ${currentGrossTotal + bonusAmount},
              updated_at = NOW()
          WHERE id = ${wallet.id}
        `;
				await tx`
          UPDATE users
          SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + ${bonusAmount},
              total_net_earnings = COALESCE(total_net_earnings, 0) + ${bonusAmount}
          WHERE id = ${userId}
        `;
				await tx`
          UPDATE referrals
          SET is_paid = true, fee_deducted = 0, net_amount = ${bonusAmount}
          WHERE id = ${referralId}
        `;
				await tx`
          INSERT INTO transactions (
            wallet_id, referral_id, transaction_type,
            amount, fee_deducted, net_amount,
            balance_before, balance_after, description
          ) VALUES (
            ${wallet.id},
            ${referralId},
            ${isFirstLevel ? "referral_bonus" : "second_level_referral"},
            ${bonusAmount}, 0,
            ${bonusAmount},
            ${currentBalance},
            ${newBalance},
            ${isFirstLevel ? `First-level referral bonus - MWK ${bonusAmount.toLocaleString()}` : `Second-level referral bonus - MWK ${bonusAmount.toLocaleString()}`}
          )
        `;
				await tx`
          INSERT INTO referral_earnings (
            user_id, referral_id, gross_amount, fee_deducted, net_amount,
            chunk_count_before, chunk_count_after
          ) VALUES (
            ${userId}, ${referralId},
            ${bonusAmount}, 0, ${bonusAmount}, 0, 0
          )
        `;
				await tx`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${userId},
            ${isFirstLevel ? "referral_approved" : "second_level_referral_approved"},
            ${isFirstLevel ? "🎉 Referral Bonus Earned!" : "🌟 Network Bonus Earned!"},
            ${isFirstLevel ? `🎉 Referral bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.` : `🌟 Network bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.`},
            '/dashboard/invites')
        `;
			}
			const level2ReferralsForNewVerify = await tx`
        SELECT
          r.id as referral_id,
          r.referrer_id,
          r.bonus_amount,
          r.referred_id
        FROM referrals r
        WHERE r.referral_type = 'second_level'
          AND r.referrer_id = ${userId}
          AND r.referred_id IN (SELECT id FROM users WHERE payment_status = 'verified')
          AND r.is_paid = false
      `;
			for (const referral of level2ReferralsForNewVerify) {
				const referrerId = referral.referrer_id;
				const bonusAmount = parseFloat(referral.bonus_amount);
				const referralId = referral.referral_id;
				const walletResult = await tx`
          SELECT id, balance_available, gross_earnings, gross_earnings_total
          FROM wallets WHERE user_id = ${referrerId}
        `;
				if (walletResult.length === 0) {
					console.error(`❌ No wallet found for Level 2 referrer ${referrerId}`);
					continue;
				}
				const wallet = walletResult[0];
				const currentBalance = parseFloat(wallet.balance_available || 0);
				const currentGross = parseFloat(wallet.gross_earnings || 0);
				const currentGrossTotal = parseFloat(wallet.gross_earnings_total || 0);
				const newBalance = currentBalance + bonusAmount;
				await tx`
          UPDATE wallets
          SET balance_available = ${newBalance},
              gross_earnings = ${currentGross + bonusAmount},
              gross_earnings_total = ${currentGrossTotal + bonusAmount},
              updated_at = NOW()
          WHERE id = ${wallet.id}
        `;
				await tx`
          UPDATE users
          SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + ${bonusAmount},
              total_net_earnings = COALESCE(total_net_earnings, 0) + ${bonusAmount}
          WHERE id = ${referrerId}
        `;
				await tx`
          UPDATE referrals
          SET is_paid = true, fee_deducted = 0, net_amount = ${bonusAmount}
          WHERE id = ${referralId}
        `;
				await tx`
          INSERT INTO transactions (
            wallet_id, referral_id, transaction_type,
            amount, fee_deducted, net_amount,
            balance_before, balance_after, description
          ) VALUES (
            ${wallet.id},
            ${referralId},
            'second_level_referral',
            ${bonusAmount}, 0,
            ${bonusAmount},
            ${currentBalance},
            ${newBalance},
            'Second-level referral bonus - MWK ' + bonusAmount.toLocaleString()
          )
        `;
				await tx`
          INSERT INTO referral_earnings (
            user_id, referral_id, gross_amount, fee_deducted, net_amount,
            chunk_count_before, chunk_count_after
          ) VALUES (
            ${referrerId}, ${referralId},
            ${bonusAmount}, 0, ${bonusAmount}, 0, 0
          )
        `;
				await tx`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (${referrerId},
            'second_level_referral_approved',
            '🌟 Network Bonus Earned!',
            '🌟 Network bonus! MWK ' + bonusAmount.toLocaleString() + ' credited to your wallet.',
            '/dashboard/invites')
        `;
			}
		});
		console.log(`✅ Referral bonuses processed for user ${userId}`);
	} catch (err) {
		console.error(`⚠️ Referral processing failed for user ${userId} (user is still verified):`, err);
	}
	try {
		await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        ${userId}, 'payment_approved', '✅ Account Activated!',
        'Your payment has been verified automatically via PayChangu. Welcome to Wisdom Vault! You can now access your dashboard and start earning.',
        '/dashboard'
      )
    `;
	} catch (err) {
		console.error(`⚠️ Welcome notification failed for user ${userId}:`, err);
	}
	console.log(`✅ User ${userId} auto-verification complete`);
}
//#endregion
export { paychanguVerifyPayment as i, markTransactionFailed as n, markTransactionVerified as r, autoVerifyUser as t };
