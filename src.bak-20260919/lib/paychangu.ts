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

// Verify a checkout payment with PayChangu. Returns the raw response plus a
// normalized "confirmedPaid" boolean. The PayChangu verify endpoint reports a
// checkout payment as:
//   { status: "success", data: { status: "success" } }   → paid
//   { status: "success", data: { status: "pending" } }   → still processing
//   { status: "failed" | data.status: "failed" }         → not paid / error
export async function paychanguVerifyPayment(txRef: string) {
  const res = await fetch(`https://api.paychangu.com/verify-payment/${txRef}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
    },
  });
  const verifyData = await res.json();

  const topOk = verifyData.status === 'success' || verifyData.status === 'successful';
  const innerStatus = verifyData.data?.status;
  const confirmedPaid = topOk && innerStatus === 'success';
  const explicitlyFailed =
    verifyData.status === 'failed' ||
    verifyData.status === 'cancelled' ||
    innerStatus === 'failed' ||
    innerStatus === 'cancelled' ||
    innerStatus === 'expired';

  return {
    verifyData,
    confirmedPaid,
    stillPending: topOk && !confirmedPaid && !explicitlyFailed,
    explicitlyFailed,
    paymentData: verifyData.data || null,
  };
}

// Update the paychangu_transactions row once a payment is confirmed.
export async function markTransactionVerified(sql: any, txRef: string, paymentData: any) {
  await sql`
    UPDATE paychangu_transactions
    SET status = 'success',
        payment_channel = ${paymentData?.authorization?.channel || 'unknown'},
        payment_reference = ${paymentData?.reference || ''},
        verified_at = NOW(),
        raw_response = ${JSON.stringify(paymentData || {})}::jsonb
    WHERE tx_ref = ${txRef}
  `;
}

// Mark a transaction as failed in the DB.
export async function markTransactionFailed(sql: any, txRef: string, raw: any) {
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
export async function autoVerifyUser(sql: any, userId: string, txRef: string, amount: number) {
  console.log(`🔄 Auto-verifying user ${userId} after PayChangu payment ${txRef}`);

  // STEP 1: Mark user as verified (critical — must not be lost)
  const updateResult = await sql`
    UPDATE users
    SET payment_status = 'verified',
        updated_at = NOW()
    WHERE id = ${userId} AND payment_status != 'verified'
    RETURNING id
  `;

  if (updateResult.length === 0) {
    console.log(`ℹ️ User ${userId} already verified — skipping`);
    return;
  }
  console.log(`✅ User ${userId} marked as verified`);

  // STEP 2: Process referrals (best-effort, never rolls back verification)
  //
  // This handles TWO scenarios:
  //   A) Bonuses owed TO the newly verified user's referrer (for referring them)
  //   B) Bonuses owed TO the newly verified user (for people they referred who verified)
  try {
    await sql.begin(async (tx: any) => {
      // ── A) Process bonuses where the newly verified user was referred ──
      // These are bonuses that the newly verified user's referrer(s) should receive
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
        const isFirstLevel = referral.referral_type === 'first_level';

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
            ${isFirstLevel ? 'referral_bonus' : 'second_level_referral'},
            ${bonusAmount}, 0,
            ${bonusAmount},
            ${currentBalance},
            ${newBalance},
            ${isFirstLevel
              ? `First-level referral bonus - MWK ${bonusAmount.toLocaleString()}`
              : `Second-level referral bonus - MWK ${bonusAmount.toLocaleString()}`}
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
            ${isFirstLevel ? 'referral_approved' : 'second_level_referral_approved'},
            ${isFirstLevel ? '🎉 Referral Bonus Earned!' : '🌟 Network Bonus Earned!'},
            ${isFirstLevel
              ? `🎉 Referral bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.`
              : `🌟 Network bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.`},
            '/dashboard/invites')
        `;
      }

      // ── B) Process bonuses where the newly verified user is the referrer ──
      // These are bonuses the newly verified user earns for referring others who verified
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
        const referredId = referral.referred_id;
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
        const isFirstLevel = referral.referral_type === 'first_level';

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
            ${isFirstLevel ? 'referral_bonus' : 'second_level_referral'},
            ${bonusAmount}, 0,
            ${bonusAmount},
            ${currentBalance},
            ${newBalance},
            ${isFirstLevel
              ? `First-level referral bonus - MWK ${bonusAmount.toLocaleString()}`
              : `Second-level referral bonus - MWK ${bonusAmount.toLocaleString()}`}
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
            ${isFirstLevel ? 'referral_approved' : 'second_level_referral_approved'},
            ${isFirstLevel ? '🎉 Referral Bonus Earned!' : '🌟 Network Bonus Earned!'},
            ${isFirstLevel
              ? `🎉 Referral bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.`
              : `🌟 Network bonus! MWK ${bonusAmount.toLocaleString()} credited to your wallet.`},
            '/dashboard/invites')
        `;
      }

      // ── C) Process Level 2 bonuses where the newly verified user is the Level 1 referrer's referrer ──
      // When User A refers User B, and User B refers User C:
      //   - User B verifying pays User A (handled in part A above)
      //   - User C verifying should pay User B (Level 1) AND User A (Level 2)
      //   - This part handles the Level 2 bonus for User A when User C verifies
      const userIdStr = userId;
      const level2ReferralsForNewVerify = await tx`
        SELECT
          r.id as referral_id,
          r.referrer_id,
          r.bonus_amount,
          r.referred_id
        FROM referrals r
        WHERE r.referral_type = 'second_level'
          AND r.referrer_id = ${userIdStr}
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

  // STEP 3: Welcome notification (best-effort)
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
