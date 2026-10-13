import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { t as isAuthorizedUser } from "./auth-check_CHLkWxRW.mjs";
//#region src/pages/api/premium/purchase.ts
var purchase_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const { userId, packId } = JSON.parse(rawBody);
		if (!userId || !packId) return new Response(JSON.stringify({
			success: false,
			message: "User ID and Pack ID required"
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
		if ((await sql`SELECT id FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}`).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "You already own this pack"
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const pack = await sql`SELECT * FROM premium_packs WHERE id = ${packId} AND is_active = true`;
		if (pack.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Pack not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		await sql`
      INSERT INTO user_premium_packs (user_id, pack_id, amount_paid, transaction_ref)
      VALUES (${userId}, ${packId}, ${pack[0].price}, ${"manual-" + Date.now()})
    `;
		return new Response(JSON.stringify({
			success: true,
			message: `Unlocked: ${pack[0].name}`,
			pack: {
				id: pack[0].id,
				name: pack[0].name,
				price: parseFloat(pack[0].price)
			}
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
//#region \0virtual:astro:page:src/pages/api/premium/purchase@_@ts
var page = () => purchase_exports;
//#endregion
export { page };
