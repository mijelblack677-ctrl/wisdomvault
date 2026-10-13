import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { t as refundFailedPayout } from "./payoutRefund_DRftL3TD.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { t as getAuthUser } from "./auth_7nHarZVP.mjs";
//#region src/lib/feeCalculator.ts
var BRACKET_BONUSES = [
	{
		min: 3e4,
		max: 39999,
		bonus: 1e3
	},
	{
		min: 4e4,
		max: 49999,
		bonus: 1500
	},
	{
		min: 5e4,
		max: 59999,
		bonus: 1500
	},
	{
		min: 6e4,
		max: 69999,
		bonus: 1500
	},
	{
		min: 7e4,
		max: 79999,
		bonus: 1600
	},
	{
		min: 8e4,
		max: 89999,
		bonus: 1700
	},
	{
		min: 9e4,
		max: 99999,
		bonus: 1800
	},
	{
		min: 1e5,
		max: 119999,
		bonus: 3e3
	},
	{
		min: 12e4,
		max: 139999,
		bonus: 3100
	},
	{
		min: 14e4,
		max: 169999,
		bonus: 3300
	},
	{
		min: 17e4,
		max: 189999,
		bonus: 1400
	},
	{
		min: 19e4,
		max: Infinity,
		bonus: 4e3
	}
];
function getBracketBonus(amount) {
	for (const b of BRACKET_BONUSES) if (amount >= b.min && amount <= b.max) return b.bonus;
	return 0;
}
function calculateWithdrawalFee(amount, mode = "manual") {
	if (amount <= 0) return 0;
	if (amount < 7e3) return 0;
	let baseFee;
	if (amount < 2e4) baseFee = 1e3;
	else baseFee = 1e3 + 25 * (Math.floor((amount - 2e4) / 1e4) + 1);
	const bonus = getBracketBonus(amount);
	return baseFee + bonus;
}
/**
* Calculate net payout after fee
*/
function calculateNetPayout(amount, mode = "manual") {
	return amount - calculateWithdrawalFee(amount, mode);
}
/**
* Get fee breakdown for display
*/
function getFeeBreakdown(amount, mode = "manual") {
	const fee = (amount < 7e3 ? 0 : amount < 2e4 ? 1e3 : (() => {
		return 1e3 + 25 * (Math.floor((amount - 2e4) / 1e4) + 1);
	})()) + getBracketBonus(amount);
	const net = amount - fee;
	let tier = "";
	let description = "";
	if (amount < 7e3) {
		tier = "No Fee";
		description = "Below minimum withdrawal (MWK 7,000)";
	} else if (amount < 2e4) {
		tier = "Tier 1";
		description = "7,000 - 19,999 MWK";
	} else {
		const bracket = Math.floor((amount - 2e4) / 1e4);
		const lower = 2e4 + bracket * 1e4;
		const upper = lower + 9999;
		tier = `Tier ${bracket + 2}`;
		description = `${lower.toLocaleString()} - ${upper.toLocaleString()} MWK`;
	}
	return {
		fee,
		net,
		tier,
		description
	};
}
//#endregion
//#region src/pages/api/wallet/withdraw.ts
var withdraw_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* Normalize a Malawian phone number to comparable digits-only form:
* strips spaces/dashes/+, optional leading 265 country code, and leading 0.
* e.g. "+265 999 123 456", "0999123456" and "265999123456" all → "999123456".
*/
function normalizePhone(phone) {
	let digits = (phone || "").replace(/[^0-9]/g, "");
	if (digits.startsWith("265")) digits = digits.slice(3);
	return digits.replace(/^0+/, "");
}
var operatorCache = null;
var OPERATOR_CACHE_TTL = 1440 * 60 * 1e3;
async function getOperatorIds() {
	if (operatorCache && Date.now() - operatorCache.fetchedAt < OPERATOR_CACHE_TTL) return {
		airtel: operatorCache.airtel,
		tnm: operatorCache.tnm
	};
	try {
		const data = await (await fetch("https://api.paychangu.com/mobile-money/", {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
			}
		})).json();
		console.log("PayChangu operators:", JSON.stringify(data, null, 2));
		if (data.status === "success" && data.data) {
			const operators = data.data;
			let airtel = "";
			let tnm = "";
			for (const op of operators) {
				const code = (op.short_code || "").toLowerCase();
				const name = (op.name || "").toLowerCase();
				if (code === "airtel" || name.includes("airtel")) airtel = op.ref_id || "";
				if (code === "tnm" || name.includes("tnm") || name.includes("mpamba")) tnm = op.ref_id || "";
			}
			if (airtel && tnm) {
				operatorCache = {
					airtel,
					tnm,
					fetchedAt: Date.now()
				};
				console.log(`✅ PayChangu operators cached: Airtel=${airtel}, TNM=${tnm}`);
				return {
					airtel,
					tnm
				};
			}
		}
		console.warn("⚠️ Could not fetch operators dynamically, using fallback IDs");
		return {
			airtel: "20be6c20-adeb-4b5b-a7ba-0769820df4fb",
			tnm: "27494cb5-ba9e-437f-a114-4e7a7686bcca"
		};
	} catch (err) {
		console.error("Failed to fetch PayChangu operators:", err);
		return {
			airtel: "20be6c20-adeb-4b5b-a7ba-0769820df4fb",
			tnm: "27494cb5-ba9e-437f-a114-4e7a7686bcca"
		};
	}
}
/**
* Detect mobile money provider from phone number.
* Numbers starting with 08 (or +2658) are TNM Mpamba;
* numbers starting with 09 (or +2659) are Airtel Money.
*/
function detectProvider(phone) {
	const clean = phone.replace(/[\s\-+]/g, "");
	const num = clean.startsWith("265") ? clean.substring(3) : clean;
	if (num.startsWith("08") || num.startsWith("8")) return "tnm";
	if (num.startsWith("09") || num.startsWith("9")) return "airtel";
	return "airtel";
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
* Ask PayChangu what actually happened to a payout charge.
* ok=false means PayChangu was unreachable or returned something we can't
* interpret — never use that to trigger a refund.
*/
async function verifyPayoutWithPayChangu(chargeId) {
	try {
		const res = await fetch(`https://api.paychangu.com/mobile-money/payments/${chargeId}/verify`, {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
			}
		});
		let data = {};
		try {
			data = await res.json();
		} catch {
			data = {};
		}
		const topOk = data.status === "success" || data.status === "successful";
		const message = String(data.message || data.detail || "");
		if (res.status === 404 || /not found|does not exist|no (record|transaction|payout|charge)/i.test(message)) return {
			ok: true,
			status: "not_found",
			message
		};
		const record = data.data;
		if (!topOk || !(record !== null && typeof record === "object" && !Array.isArray(record))) return {
			ok: false,
			status: "unknown",
			message
		};
		const inner = String(record.status || "").toLowerCase();
		if ([
			"success",
			"successful",
			"completed"
		].includes(inner)) return {
			ok: true,
			status: "success",
			message
		};
		if ([
			"failed",
			"cancelled",
			"expired",
			"reversed",
			"rejected"
		].includes(inner)) return {
			ok: true,
			status: "failed",
			message
		};
		if ([
			"pending",
			"processing",
			"queued"
		].includes(inner)) return {
			ok: true,
			status: "pending",
			message
		};
		return {
			ok: true,
			status: "unknown",
			message: `Unexpected payout status: ${inner}`
		};
	} catch (err) {
		return {
			ok: false,
			status: "unknown",
			message: err.message
		};
	}
}
/**
* Resolve the outcome of an ambiguous PayChangu payout initiation (network
* error, 5xx, unreadable body — where we don't know if the payout was accepted).
*
* Verifies against PayChangu (with retries) and only refunds when it proves
* the payout never happened. On PayChangu unreachable / uninterpretable: leaves
* the row as 'processing' so the daily reconcile cron finalises it.
*/
async function resolveAmbiguousPayoutInit(sql, withdrawalId, chargeId) {
	const attempts = [
		0,
		3e3,
		6e3
	];
	let last = {
		ok: false,
		status: "unknown",
		message: ""
	};
	let notFoundCount = 0;
	for (const delayMs of attempts) {
		if (delayMs) await sleep(delayMs);
		last = await verifyPayoutWithPayChangu(chargeId);
		if (last.status === "success") {
			await sql`
        UPDATE withdrawals SET status = 'completed', processed_at = NOW(),
          notes = notes || ${" | Auto-reconciled after ambiguous init: PayChangu confirms payout success (charge " + chargeId + ")"}
        WHERE id = ${withdrawalId}
      `;
			return {
				outcome: "completed",
				refunded: false
			};
		}
		if (last.status === "failed") {
			await refundFailedPayout(sql, withdrawalId, " | PayChangu verify after ambiguous init: " + (last.message || "failed") + " — AUTO REFUNDED");
			return {
				outcome: "failed",
				refunded: true
			};
		}
		if (last.status === "pending") {
			await sql`
        UPDATE withdrawals SET status = 'processing',
          notes = notes || ${" | Ambiguous init; PayChangu verify shows payout processing (charge " + chargeId + ")"}
        WHERE id = ${withdrawalId}
      `;
			return {
				outcome: "processing",
				refunded: false
			};
		}
		if (last.status === "not_found") {
			notFoundCount++;
			continue;
		}
	}
	if (notFoundCount > 0 && last.status === "not_found") {
		await refundFailedPayout(sql, withdrawalId, " | PayChangu verify: no payout record after ambiguous init (" + notFoundCount + " lookups) — AUTO REFUNDED");
		return {
			outcome: "failed",
			refunded: true
		};
	}
	return {
		outcome: "processing",
		refunded: false
	};
}
function isDefinitiveRejection(httpStatus, data) {
	if (httpStatus >= 400 && httpStatus < 500) return true;
	const s = String(data?.status || "").toLowerCase();
	return [
		"failed",
		"error",
		"failure",
		"rejected",
		"cancelled"
	].includes(s);
}
function isRateLimit(httpStatus, data) {
	const msg = String(data?.message || data?.detail || "");
	return httpStatus === 429 || /rate limit|too many requests|throttl/i.test(msg);
}
/**
* Get the withdrawal mode from platform_config.
* 'manual' = admin approves payouts manually (no PayChangu API calls)
* 'paychangu' = automatic payouts via PayChangu mobile money
*/
async function getWithdrawalMode(sql) {
	try {
		return (await sql`SELECT config_value FROM platform_config WHERE config_key = 'withdrawal_mode'`)[0]?.config_value || "manual";
	} catch {
		return "manual";
	}
}
var POST = async ({ request }) => {
	try {
		const limit = checkRateLimit(`withdraw:${clientIp(request)}`, 5, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const rawBody = await request.text();
		const { userId: bodyUserId, amount, cardholderName, phoneNumber } = JSON.parse(rawBody);
		if (!amount) return new Response(JSON.stringify({
			success: false,
			message: "Amount required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		let userId = null;
		const sessionUser = await getAuthUser(request);
		if (sessionUser) userId = sessionUser.id;
		else if (bodyUserId) {
			const candidate = await sql`
        SELECT id, phone FROM users WHERE id = ${bodyUserId} AND is_active = true LIMIT 1
      `;
			if (candidate.length > 0) {
				const payoutDigits = normalizePhone(phoneNumber);
				const registeredDigits = normalizePhone(candidate[0].phone);
				if (payoutDigits && registeredDigits && payoutDigits === registeredDigits) userId = bodyUserId;
			}
		}
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized. Please sign in and try again."
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const withdrawalMode = await getWithdrawalMode(sql);
		const user = await sql`
      SELECT id, full_name, email, payment_status, phone
      FROM users WHERE id = ${userId}
    `;
		if (user.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		if (user[0].payment_status !== "verified") return new Response(JSON.stringify({
			success: false,
			message: "Your account must be verified before you can withdraw."
		}), {
			status: 403,
			headers: { "Content-Type": "application/json" }
		});
		const withdrawalAmount = parseFloat(amount);
		if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) return new Response(JSON.stringify({
			success: false,
			message: "Invalid amount"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const wallets = await sql`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
		if (wallets.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Wallet not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const wallet = wallets[0];
		const currentBalance = parseFloat(wallet.balance_available);
		const minConfig = await sql`
      SELECT config_value FROM platform_config WHERE config_key = 'withdrawal_min_amount'
    `;
		const minWithdrawal = parseFloat(minConfig[0]?.config_value || "7000");
		if (withdrawalAmount < minWithdrawal) return new Response(JSON.stringify({
			success: false,
			message: `Minimum withdrawal is MWK ${minWithdrawal.toLocaleString()}. Your balance: MWK ${currentBalance.toLocaleString()}`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (withdrawalAmount > currentBalance) return new Response(JSON.stringify({
			success: false,
			message: `Insufficient balance. You have MWK ${currentBalance.toLocaleString()} available.`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const existingActive = await sql`
      SELECT id, status, payment_method, payment_reference FROM withdrawals
      WHERE wallet_id = ${wallet.id}
        AND status IN ('pending', 'processing')
      ORDER BY requested_at DESC
      LIMIT 1
    `;
		if (existingActive.length > 0) {
			const stuck = existingActive[0];
			let resolvedStuck = false;
			if (stuck.status === "processing" && stuck.payment_method === "paychangu_mobile_money" && stuck.payment_reference) try {
				const verifyData = await (await fetch(`https://api.paychangu.com/mobile-money/payments/${stuck.payment_reference}/verify`, {
					method: "GET",
					headers: {
						"Accept": "application/json",
						"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
					}
				})).json();
				const topOk = verifyData.status === "success" || verifyData.status === "successful";
				const innerStatus = verifyData.data?.status;
				const hasRecord = verifyData.data !== null && typeof verifyData.data === "object";
				if (topOk && hasRecord && [
					"success",
					"successful",
					"completed"
				].includes(innerStatus)) {
					await sql`
              UPDATE withdrawals
              SET status = 'completed', processed_at = NOW(),
                  notes = notes || ${" | Auto-reconciled: PayChangu confirms payout success (charge " + stuck.payment_reference + ")"}
              WHERE id = ${stuck.id}
            `;
					await sql`
              INSERT INTO notifications (user_id, type, title, message, link)
              VALUES (${userId}, 'withdrawal_completed', '✅ Withdrawal Successful',
                ${`Your earlier withdrawal has been confirmed as sent to your mobile money wallet.`},
                '/dashboard/wallet')
            `;
					resolvedStuck = true;
					console.log(`✅ Self-healed stuck withdrawal ${stuck.id}: PayChangu confirms success, allowing new request`);
				}
			} catch (err) {
				console.error(`Self-heal verify failed for ${stuck.payment_reference}:`, err);
			}
			if (!resolvedStuck) return new Response(JSON.stringify({
				success: false,
				message: `You already have a ${stuck.status} withdrawal. Please wait for it to complete before requesting another.`
			}), {
				status: 409,
				headers: { "Content-Type": "application/json" }
			});
		}
		const feeAmount = calculateWithdrawalFee(withdrawalAmount, withdrawalMode);
		const netPayout = calculateNetPayout(withdrawalAmount, withdrawalMode);
		const feeBreakdown = getFeeBreakdown(withdrawalAmount, withdrawalMode);
		const payoutPhone = phoneNumber || user[0].phone;
		const provider = detectProvider(payoutPhone);
		console.log(`💰 Withdrawal request:\n      User: ${user[0].full_name}\n      Amount: ${withdrawalAmount}\n      Fee: ${feeAmount} (${feeBreakdown.tier})\n      Net: ${netPayout}\n      Phone: ${payoutPhone}\n      Provider: ${provider}\n      Mode: ${withdrawalMode}\n    `);
		const chargeId = `WV-WD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const recentWithdrawals = await sql`
      SELECT COUNT(*) as count FROM withdrawals
      WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = ${userId})
        AND requested_at > NOW() - INTERVAL '1 hour'
        AND status NOT IN ('failed', 'rejected')
    `;
		if (parseInt(recentWithdrawals[0].count) >= 3) return new Response(JSON.stringify({
			success: false,
			message: "Rate limit: maximum 3 withdrawals per hour. Please try again later."
		}), {
			status: 429,
			headers: { "Content-Type": "application/json" }
		});
		if (withdrawalMode === "manual") {
			const result = await sql.begin(async (tx) => {
				const lockedWallet = await tx`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
				const lockedBalance = parseFloat(lockedWallet[0]?.balance_available || 0);
				if (withdrawalAmount > lockedBalance) throw new Error(`Insufficient balance. You have MWK ${lockedBalance.toLocaleString()} available.`);
				const withdrawalResult = await tx`
          INSERT INTO withdrawals (
            wallet_id, amount_requested, withdrawal_fee, amount_paid,
            status, payment_method, payment_reference, requested_at, notes
          ) VALUES (
            ${wallet.id}, ${withdrawalAmount}, ${feeAmount}, ${netPayout},
            'pending', 'manual', ${chargeId}, NOW(),
            ${`Name: ${cardholderName || user[0].full_name}, Phone: ${payoutPhone}, Provider: ${provider}. Fee: ${feeAmount} (${feeBreakdown.tier}: ${feeBreakdown.description}). Mode: manual`}
          )
          RETURNING id, requested_at
        `;
				const newBalance = lockedBalance - withdrawalAmount;
				await tx`
          UPDATE wallets
          SET balance_available = ${newBalance},
              total_withdrawn = ${parseFloat(wallet.total_withdrawn || 0) + netPayout},
              fees_paid = ${parseFloat(wallet.fees_paid || 0) + feeAmount},
              updated_at = NOW()
          WHERE id = ${wallet.id}
        `;
				await tx`
          UPDATE users
          SET total_fees_paid = COALESCE(total_fees_paid, 0) + ${feeAmount},
              total_net_earnings = COALESCE(total_net_earnings, 0) - ${feeAmount}
          WHERE id = ${userId}
        `;
				await tx`
          INSERT INTO transactions (
            wallet_id, transaction_type, amount, fee_deducted, net_amount,
            balance_before, balance_after, description
          ) VALUES (
            ${wallet.id}, 'withdrawal', ${withdrawalAmount}, ${feeAmount}, ${netPayout},
            ${lockedBalance}, ${newBalance},
            ${`Withdrawal request: MWK ${netPayout.toLocaleString()} to ${payoutPhone} (${provider}) — awaiting admin approval (manual mode)`}
          )
        `;
				return {
					withdrawalId: withdrawalResult[0].id,
					requestedAt: withdrawalResult[0].requested_at,
					newBalance
				};
			});
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'withdrawal_pending',
          '💸 Withdrawal Requested',
          ${`Your withdrawal of MWK ${netPayout.toLocaleString()} (fee: MWK ${feeAmount.toLocaleString()}) has been submitted. It will be reviewed by an admin shortly.`},
          '/dashboard/wallet')
      `;
			return new Response(JSON.stringify({
				success: true,
				message: `Withdrawal of MWK ${netPayout.toLocaleString()} requested. It will be reviewed and processed by an admin. You will be notified once it's approved.`,
				withdrawal: {
					id: result.withdrawalId,
					amountRequested: withdrawalAmount,
					fee: feeAmount,
					netPayout,
					status: "pending",
					paymentMethod: "manual",
					provider: provider === "airtel" ? "Airtel Money" : "TNM Mpamba",
					phone: payoutPhone,
					chargeId,
					requestedAt: result.requestedAt
				},
				newBalance: result.newBalance
			}), {
				status: 201,
				headers: { "Content-Type": "application/json" }
			});
		}
		const result = await sql.begin(async (tx) => {
			const lockedWallet = await tx`SELECT * FROM wallets WHERE user_id = ${userId} FOR UPDATE`;
			const lockedBalance = parseFloat(lockedWallet[0]?.balance_available || 0);
			if (withdrawalAmount > lockedBalance) throw new Error(`Insufficient balance. You have MWK ${lockedBalance.toLocaleString()} available.`);
			const withdrawalResult = await tx`
        INSERT INTO withdrawals (
          wallet_id, amount_requested, withdrawal_fee, amount_paid,
          status, payment_method, payment_reference, requested_at, notes
        ) VALUES (
          ${wallet.id}, ${withdrawalAmount}, ${feeAmount}, ${netPayout},
          'processing', 'paychangu_mobile_money', ${chargeId}, NOW(),
          ${`Name: ${cardholderName || user[0].full_name}, Phone: ${payoutPhone}, Provider: ${provider}. Fee: ${feeAmount} (${feeBreakdown.tier}: ${feeBreakdown.description}). Mode: paychangu`}
        )
        RETURNING id, requested_at
      `;
			const newBalance = lockedBalance - withdrawalAmount;
			await tx`
        UPDATE wallets
        SET balance_available = ${newBalance},
            total_withdrawn = ${parseFloat(wallet.total_withdrawn || 0) + netPayout},
            fees_paid = ${parseFloat(wallet.fees_paid || 0) + feeAmount},
            updated_at = NOW()
        WHERE id = ${wallet.id}
      `;
			await tx`
        UPDATE users
        SET total_fees_paid = COALESCE(total_fees_paid, 0) + ${feeAmount},
            total_net_earnings = COALESCE(total_net_earnings, 0) - ${feeAmount}
        WHERE id = ${userId}
      `;
			await tx`
        INSERT INTO transactions (
          wallet_id, transaction_type, amount, fee_deducted, net_amount,
          balance_before, balance_after, description
        ) VALUES (
          ${wallet.id}, 'withdrawal', ${withdrawalAmount}, ${feeAmount}, ${netPayout},
          ${lockedBalance}, ${newBalance},
          ${`Withdrawal via PayChangu: MWK ${netPayout.toLocaleString()} to ${payoutPhone} (${provider})`}
        )
      `;
			return {
				withdrawalId: withdrawalResult[0].id,
				requestedAt: withdrawalResult[0].requested_at,
				newBalance,
				payoutPhone,
				provider,
				chargeId
			};
		});
		let payoutStatus = "processing";
		let payoutMessage = "Withdrawal submitted. Processing via PayChangu...";
		let payoutRefunded = false;
		let payoutRateLimited = false;
		let responseBalance = result.newBalance;
		const providerLabel = provider === "airtel" ? "Airtel Money" : "TNM Mpamba";
		const netStr = netPayout.toLocaleString();
		/** Helper to apply the result of resolveAmbiguousPayoutInit and build
		*  the user-facing message. Defined once to avoid duplicating message
		*  text in try/catch.
		*/
		const applyResolution = async (res) => {
			payoutStatus = res.outcome;
			payoutRefunded = res.refunded;
			if (res.refunded) {
				const balAfter = await sql`SELECT balance_available FROM wallets WHERE id = ${wallet.id}`;
				responseBalance = parseFloat(balAfter[0]?.balance_available || responseBalance);
			}
			if (res.outcome === "completed") payoutMessage = `Your withdrawal of MWK ${netStr} has been sent to ${payoutPhone} via ${providerLabel}.`;
			else if (res.outcome === "failed") payoutMessage = `Something went wrong while processing your withdrawal of MWK ${netStr}. The full amount has been refunded to your balance. Please try again later.`;
			else payoutMessage = `Your withdrawal of MWK ${netStr} was submitted, but we couldn't confirm its status right now. If it was not delivered, the full amount will be refunded to your balance automatically.`;
		};
		try {
			const operators = await getOperatorIds();
			const operatorRefId = provider === "airtel" ? operators.airtel : operators.tnm;
			console.log(`📤 Initiating PayChangu payout: ${netPayout} MWK to ${payoutPhone} via ${provider}`);
			const payoutResponse = await fetch("https://api.paychangu.com/mobile-money/payouts/initialize", {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
				},
				body: JSON.stringify({
					mobile_money_operator_ref_id: operatorRefId,
					mobile: payoutPhone.replace(/[\s\-]/g, ""),
					amount: netPayout.toString(),
					charge_id: result.chargeId,
					email: user[0].email,
					first_name: (user[0].full_name || "").split(" ")[0],
					last_name: (user[0].full_name || "").split(" ").slice(1).join(" ")
				})
			});
			const httpStatus = payoutResponse.status;
			const rawBody = await payoutResponse.text();
			let payoutData = {};
			try {
				payoutData = rawBody ? JSON.parse(rawBody) : {};
			} catch {
				payoutData = {};
			}
			console.log("PayChangu payout response (HTTP", httpStatus + "):", JSON.stringify(payoutData, null, 2));
			const txData = payoutData.data?.transaction || payoutData.data || {};
			const initDataStatus = txData.status;
			const topInitOk = [
				"success",
				"successful",
				"pending"
			].includes(payoutData.status);
			const payoutNotesExtra = " | PayChangu charge_id: " + result.chargeId + ", trans_id: " + (txData.trans_id || "") + ", mobile: " + (txData.mobile || "");
			if (topInitOk && [
				"success",
				"successful",
				"completed"
			].includes(initDataStatus)) {
				payoutStatus = "completed";
				payoutMessage = `Your withdrawal of MWK ${netStr} has been sent to ${payoutPhone} via ${providerLabel}.`;
				await sql`
          UPDATE withdrawals
          SET status = 'completed', processed_at = NOW(),
              notes = notes || ${payoutNotesExtra}
          WHERE id = ${result.withdrawalId}
        `;
			} else if (topInitOk) {
				payoutStatus = "processing";
				payoutMessage = `Withdrawal of MWK ${netStr} is being sent to ${payoutPhone} via ${providerLabel}. You should receive it within minutes.`;
				await sql`
          UPDATE withdrawals
          SET status = 'processing', notes = notes || ${payoutNotesExtra}
          WHERE id = ${result.withdrawalId}
        `;
			} else if (isDefinitiveRejection(httpStatus, payoutData)) {
				const reason = isRateLimit(httpStatus, payoutData) ? "PayChangu rate limit (HTTP " + httpStatus + ")" + (payoutData.message ? ": " + payoutData.message : "") : "PayChangu rejected payout: " + (payoutData.message || "HTTP " + httpStatus);
				console.error("PayChangu payout rejected:", reason);
				await refundFailedPayout(sql, result.withdrawalId, " | " + reason + " — AUTO REFUNDED");
				payoutStatus = "failed";
				payoutRefunded = true;
				payoutRateLimited = isRateLimit(httpStatus, payoutData);
				const balAfter = await sql`SELECT balance_available FROM wallets WHERE id = ${wallet.id}`;
				responseBalance = parseFloat(balAfter[0]?.balance_available || responseBalance);
				payoutMessage = payoutRateLimited ? `PayChangu is receiving too many requests right now (rate limit), so your withdrawal of MWK ${netStr} could not be processed. The full amount has been refunded to your balance. Please try again later.` : `Something went wrong while processing your withdrawal of MWK ${netStr}: ${payoutData.message || "the payment processor rejected the request"}. The full amount has been refunded to your balance. Please try again later.`;
			} else {
				console.warn("PayChangu payout ambiguous (HTTP", httpStatus + ", body:", rawBody.substring(0, 200) + ") — verifying...");
				await applyResolution(await resolveAmbiguousPayoutInit(sql, result.withdrawalId, result.chargeId));
			}
		} catch (payoutErr) {
			console.error("PayChangu payout error (ambiguous — verifying):", payoutErr);
			await applyResolution(await resolveAmbiguousPayoutInit(sql, result.withdrawalId, result.chargeId));
		}
		await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (${userId}, ${"withdrawal_" + payoutStatus},
        ${payoutStatus === "completed" ? "✅ Withdrawal Successful" : payoutStatus === "processing" ? "💸 Withdrawal Processing" : "❌ Withdrawal Failed"},
        ${payoutMessage}, '/dashboard/wallet')
    `;
		return new Response(JSON.stringify({
			success: payoutStatus !== "failed",
			message: payoutMessage,
			refunded: payoutRefunded,
			rateLimited: payoutRateLimited,
			withdrawal: {
				id: result.withdrawalId,
				amountRequested: withdrawalAmount,
				fee: feeAmount,
				netPayout,
				status: payoutStatus,
				paymentMethod: "paychangu_mobile_money",
				provider: providerLabel,
				phone: result.payoutPhone,
				chargeId: result.chargeId,
				requestedAt: result.requestedAt
			},
			newBalance: responseBalance
		}), {
			status: payoutStatus === "failed" ? 200 : 201,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Withdrawal error:", err);
		const isUserError = err.message.includes("Insufficient balance") || err.message.includes("already have");
		return new Response(JSON.stringify({
			success: false,
			message: err.message || "Withdrawal failed. Please try again."
		}), {
			status: isUserError ? 400 : 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/wallet/withdraw@_@ts
var page = () => withdraw_exports;
//#endregion
export { page };
