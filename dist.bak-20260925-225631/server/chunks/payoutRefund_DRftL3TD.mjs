//#region src/lib/payoutRefund.ts
/**
* Shared payout refund helper.
*
* Every code path that may need to refund a failed PayChangu payout calls
* this single function, ensuring the exact same DB mutations happen in the
* same transaction regardless of call-site. Two important safety properties:
*
*   1. **Double-refund proof** – the row's status is read under FOR UPDATE
*      and the refund only fires when the row is still 'processing'. A
*      second call after the first has already moved it to 'failed' is a
*      harmless no-op (the UPDATE affects 0 rows).
*
*   2. **Consistent accounting** – wallet totals, user totals, and the
*      refund transaction record are always written together in a single
*      postgres.js transaction, so a mid-refund crash never leaves the
*      books in an inconsistent state.
*/
async function refundFailedPayout(sql, withdrawalId, note) {
	let refunded = false;
	await sql.begin(async (tx) => {
		const w = (await tx`
      SELECT w.id, w.wallet_id, w.amount_requested, w.withdrawal_fee,
             w.amount_paid, w.status, wal.user_id
      FROM withdrawals w
      JOIN wallets wal ON w.wallet_id = wal.id
      WHERE w.id = ${withdrawalId}
      FOR UPDATE
    `)[0];
		if (!w || w.status !== "processing") return;
		const refundAmount = parseFloat(w.amount_requested || 0);
		const netPaid = parseFloat(w.amount_paid || 0);
		const fee = parseFloat(w.withdrawal_fee || 0);
		await tx`
      UPDATE withdrawals SET status = 'failed', processed_at = NOW(),
        notes = notes || ${note}
      WHERE id = ${withdrawalId}
    `;
		const walletRows = await tx`SELECT balance_available FROM wallets WHERE id = ${w.wallet_id}`;
		const currentBal = parseFloat(walletRows[0]?.balance_available || 0);
		await tx`
      UPDATE wallets
      SET balance_available = balance_available + ${refundAmount},
          total_withdrawn = GREATEST(total_withdrawn - ${netPaid}, 0),
          fees_paid = GREATEST(fees_paid - ${fee}, 0),
          updated_at = NOW()
      WHERE id = ${w.wallet_id}
    `;
		await tx`
      UPDATE users
      SET total_fees_paid = GREATEST(COALESCE(total_fees_paid, 0) - ${fee}, 0),
          total_net_earnings = COALESCE(total_net_earnings, 0) + ${fee}
      WHERE id = ${w.user_id}
    `;
		await tx`
      INSERT INTO transactions (
        wallet_id, transaction_type, amount, fee_deducted, net_amount,
        balance_before, balance_after, description
      ) VALUES (
        ${w.wallet_id}, 'withdrawal_refund', ${refundAmount}, 0, ${refundAmount},
        ${currentBal}, ${currentBal + refundAmount},
        ${"PayChangu payout failed - Amount auto-refunded: MWK " + refundAmount.toLocaleString()}
      )
    `;
		refunded = true;
	});
	return refunded;
}
//#endregion
export { refundFailedPayout as t };
