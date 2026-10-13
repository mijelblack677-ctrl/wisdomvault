import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as unauthorized, t as requireAdmin } from "./adminAuth_Dr_-tb6j.mjs";
//#region src/pages/api/content/items.ts
var items_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	if (!await requireAdmin(request)) return unauthorized();
	try {
		const packId = new URL(request.url).searchParams.get("packId");
		if (!packId) return new Response(JSON.stringify({
			success: false,
			message: "packId is required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const items = await client`
      SELECT id, title, content_type, file_url, link_type, display_order
      FROM premium_content_items
      WHERE pack_id = ${packId}
      ORDER BY display_order, created_at, id
    `;
		return new Response(JSON.stringify({
			success: true,
			items: items || []
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Items API error:", err);
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
//#region \0virtual:astro:page:src/pages/api/content/items@_@ts
var page = () => items_exports;
//#endregion
export { page };
