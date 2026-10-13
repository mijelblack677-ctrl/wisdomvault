import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/premium/packs.ts
var packs_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const userId = new URL(request.url).searchParams.get("userId");
		const sql = client;
		const packs = await sql`
      SELECT * FROM premium_packs WHERE is_active = true ORDER BY display_order
    `;
		let ownedPacks = [];
		if (userId) ownedPacks = (await sql`
        SELECT pack_id FROM user_premium_packs WHERE user_id = ${userId}
      `).map((o) => o.pack_id);
		const packsWithCounts = await Promise.all(packs.map(async (pack) => {
			const countResult = await sql`
        SELECT COUNT(*) as count FROM premium_content_items WHERE pack_id = ${pack.id}
      `;
			return {
				...pack,
				long_description: pack.long_description || pack.description,
				thumbnail_url: pack.thumbnail_url || "",
				itemCount: parseInt(countResult[0]?.count || "0"),
				isOwned: ownedPacks.includes(pack.id),
				price: parseFloat(pack.price)
			};
		}));
		return new Response(JSON.stringify({
			success: true,
			packs: packsWithCounts
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Packs API error:", err);
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
//#region \0virtual:astro:page:src/pages/api/premium/packs@_@ts
var page = () => packs_exports;
//#endregion
export { page };
