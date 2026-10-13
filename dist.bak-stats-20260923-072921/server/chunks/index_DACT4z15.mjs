import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
//#region src/pages/api/content/premium-content/index.ts
var premium_content_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get("userId");
		const packId = url.searchParams.get("packId");
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
		const ownership = await sql`
      SELECT * FROM user_premium_packs 
      WHERE user_id = ${userId} AND pack_id = ${packId}
    `;
		if (ownership.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "You do not own this pack. Purchase it first."
		}), {
			status: 403,
			headers: { "Content-Type": "application/json" }
		});
		const pack = await sql`
      SELECT * FROM premium_packs WHERE id = ${packId}
    `;
		const items = await sql`
      SELECT * FROM premium_content_items 
      WHERE pack_id = ${packId} 
      ORDER BY display_order
    `;
		return new Response(JSON.stringify({
			success: true,
			pack: pack[0] || null,
			items: items || [],
			purchasedAt: ownership[0].purchased_at
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Premium content error:", err);
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
//#region \0virtual:astro:page:src/pages/api/content/premium-content/index@_@ts
var page = () => premium_content_exports;
//#endregion
export { page };
