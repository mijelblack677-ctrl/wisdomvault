import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { t as isAuthorizedUser } from "./auth-check_CHLkWxRW.mjs";
//#region src/pages/api/paychangu/initiate.ts
var initiate_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* POST /api/paychangu/initiate
* 
* Initiates a PayChangu Standard Checkout payment for the registration fee.
* Returns a checkout_url the user should be redirected to.
* 
* Body: { userId: string }
*/
var POST = async ({ request }) => {
	try {
		const limit = checkRateLimit(`paychangu-initiate:${clientIp(request)}`, 10, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const rawBody = await request.text();
		const { userId } = JSON.parse(rawBody);
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID is required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const users = await sql`
      SELECT id, full_name, email, phone, payment_status
      FROM users WHERE id = ${userId}
    `;
		if (users.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const user = users[0];
		if (user.payment_status === "verified") return new Response(JSON.stringify({
			success: false,
			message: "Your account is already verified!"
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const pendingTx = await sql`
      SELECT id, tx_ref, status, checkout_url, created_at
      FROM paychangu_transactions
      WHERE user_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `;
		if (pendingTx.length > 0) {
			const txCreated = new Date(pendingTx[0].created_at).getTime();
			if (Date.now() - txCreated < 1800 * 1e3 && pendingTx[0].checkout_url) return new Response(JSON.stringify({
				success: true,
				checkoutUrl: pendingTx[0].checkout_url,
				txRef: pendingTx[0].tx_ref,
				message: "You have a pending payment. Redirecting to checkout..."
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		const txRef = `WV-${userId.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
		const amount = 10800;
		const currency = "MWK";
		const baseUrl = new URL(request.url).origin;
		const callbackUrl = `${baseUrl}/api/paychangu/callback`;
		const returnUrl = `${baseUrl}/billing?status=return&tx_ref=${txRef}`;
		const nameParts = (user.full_name || "").split(" ");
		const firstName = nameParts[0] || "User";
		const lastName = nameParts.slice(1).join(" ") || "";
		const paychanguData = await (await fetch("https://api.paychangu.com/payment", {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
			},
			body: JSON.stringify({
				amount: amount.toString(),
				currency,
				email: user.email,
				first_name: firstName,
				last_name: lastName,
				callback_url: callbackUrl,
				return_url: returnUrl,
				tx_ref: txRef,
				customization: {
					title: "Wisdom Vault - Registration",
					description: "Registration MWK 10,000 + Agent fee MWK 800 = MWK 10,800 (one-time)"
				},
				meta: {
					userId: user.id,
					type: "registration"
				}
			})
		})).json();
		console.log("PayChangu initiate response:", JSON.stringify(paychanguData, null, 2));
		if (paychanguData.status === "success" && paychanguData.data?.checkout_url) {
			await sql`
        INSERT INTO paychangu_transactions (
          user_id, tx_ref, amount, currency, status, checkout_url
        ) VALUES (
          ${userId}, ${txRef}, ${amount}, ${currency}, 'pending', ${paychanguData.data.checkout_url}
        )
      `;
			return new Response(JSON.stringify({
				success: true,
				checkoutUrl: paychanguData.data.checkout_url,
				txRef,
				message: "Payment session created successfully"
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		} else {
			console.error("PayChangu initiation failed:", paychanguData);
			return new Response(JSON.stringify({
				success: false,
				message: paychanguData.message || "Failed to create payment session. Please try again."
			}), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
	} catch (error) {
		const err = error;
		console.error("PayChangu initiate error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message || "Payment initiation failed. Please try again."
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/paychangu/initiate@_@ts
var page = () => initiate_exports;
//#endregion
export { page };
