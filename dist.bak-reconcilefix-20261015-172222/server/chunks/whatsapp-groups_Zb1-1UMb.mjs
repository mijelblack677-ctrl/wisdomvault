import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
//#region src/pages/api/whatsapp-groups.ts
var whatsapp_groups_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	const sql = client;
	try {
		const user = await getAuthUser(request);
		if (!user) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		if ((await sql`
      SELECT 1 FROM users
      WHERE id = ${user.id} AND is_active = TRUE AND payment_status = 'verified'
      LIMIT 1
    `).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Payment required"
		}), {
			status: 403,
			headers: { "Content-Type": "application/json" }
		});
		const groups = await sql`
      SELECT id, name, description, link, sort_order, updated_at
      FROM whatsapp_groups
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, id ASC
    `;
		return new Response(JSON.stringify({
			success: true,
			groups: groups || []
		}), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store"
			}
		});
	} catch (error) {
		console.error("whatsapp-groups GET error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Server error"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/whatsapp-groups@_@ts
var page = () => whatsapp_groups_exports;
//#endregion
export { page };
