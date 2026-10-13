import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
//#region src/pages/api/premium/payment-proof.ts
var payment_proof_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const { userId, packId, providerName, phoneNumber, cardName, amountSent } = JSON.parse(rawBody);
		if (!userId || !packId || !providerName || !phoneNumber || !amountSent) return new Response(JSON.stringify({
			success: false,
			message: "All fields are required: provider name, phone number, and amount sent"
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
		const existing = await sql`
      SELECT id, status FROM payment_proofs 
      WHERE user_id = ${userId} AND pack_id = ${packId}
      ORDER BY created_at DESC LIMIT 1
    `;
		if (existing.length > 0) {
			if (existing[0].status === "pending") return new Response(JSON.stringify({
				success: false,
				message: "You already have a pending payment for this pack. Please wait for admin approval."
			}), {
				status: 409,
				headers: { "Content-Type": "application/json" }
			});
			if (existing[0].status === "approved") return new Response(JSON.stringify({
				success: false,
				message: "You already own this pack."
			}), {
				status: 409,
				headers: { "Content-Type": "application/json" }
			});
		}
		if ((await sql`
      SELECT id FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}
    `).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "You already own this pack."
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const pack = await sql`SELECT name, price FROM premium_packs WHERE id = ${packId} AND is_active = true`;
		if (pack.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Pack not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		await sql`
      INSERT INTO payment_proofs (user_id, pack_id, provider_name, phone_number, card_name, amount_sent)
      VALUES (${userId}, ${packId}, ${providerName}, ${phoneNumber}, ${cardName || ""}, ${parseFloat(amountSent)})
    `;
		return new Response(JSON.stringify({
			success: true,
			message: `Payment proof submitted for "${pack[0].name}". Waiting for admin approval. You'll be notified when approved.`
		}), {
			status: 201,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			message: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/premium/payment-proof@_@ts
var page = () => payment_proof_exports;
//#endregion
export { page };
