import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
//#region src/pages/api/content/packs/index.ts
var packs_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const userId = new URL(request.url).searchParams.get("userId");
		if (userId && !await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const packs = await sql`
      SELECT 
        id,
        name,
        slug,
        description,
        long_description,
        price,
        is_free,
        icon_svg,
        thumbnail_url,
        category,
        is_active,
        display_order,
        created_at
      FROM premium_packs 
      WHERE is_active = true 
      ORDER BY display_order
    `;
		let purchasedPackIds = [];
		if (userId) purchasedPackIds = (await sql`
        SELECT pack_id FROM course_purchases WHERE user_id = ${userId}
      `).map((o) => o.pack_id);
		const packsWithData = await Promise.all(packs.map(async (pack) => {
			const countResult = await sql`
        SELECT COUNT(*) as count FROM premium_content_items WHERE pack_id = ${pack.id}
      `;
			const previewItems = await sql`
        SELECT id, title, content_type, file_url, link_type
        FROM premium_content_items 
        WHERE pack_id = ${pack.id} 
        ORDER BY display_order
      `;
			const isOwned = pack.is_free || purchasedPackIds.includes(pack.id);
			const isPremium = !pack.is_free && parseFloat(pack.price || 0) > 0;
			const safePreviewItems = isOwned ? previewItems : (previewItems || []).map((i) => ({
				id: i.id,
				title: i.title,
				content_type: i.content_type,
				link_type: i.link_type,
				file_url: "",
				external_link: ""
			}));
			return {
				id: pack.id,
				name: pack.name,
				slug: pack.slug,
				description: pack.description || "",
				longDescription: pack.long_description || pack.description || "",
				price: parseFloat(pack.price || 0),
				isFree: pack.is_free || false,
				isPremium,
				iconSvg: pack.icon_svg || "",
				thumbnailUrl: pack.thumbnail_url || "",
				category: pack.category || "General",
				isActive: pack.is_active,
				displayOrder: pack.display_order,
				createdAt: pack.created_at,
				itemCount: parseInt(countResult[0]?.count || "0"),
				isOwned,
				previewItems: safePreviewItems
			};
		}));
		return new Response(JSON.stringify({
			success: true,
			packs: packsWithData
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
//#region \0virtual:astro:page:src/pages/api/content/packs/index@_@ts
var page = () => packs_exports;
//#endregion
export { page };
