import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
//#region src/pages/api/whatsapp-group-click.ts
var whatsapp_group_click_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
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
		const body = await request.json().catch(() => ({}));
		const groupId = Number(body.groupId);
		if (!Number.isInteger(groupId)) return new Response(JSON.stringify({
			success: false,
			message: "Valid groupId required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if ((await sql`SELECT id FROM whatsapp_groups WHERE id = ${groupId} AND is_active = TRUE LIMIT 1`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Group not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		try {
			await sql`
        INSERT INTO whatsapp_group_clicks (group_id, user_id, click_day)
        VALUES (${groupId}, ${user.id}::uuid, CURRENT_DATE)
        ON CONFLICT (group_id, user_id, click_day)
        DO UPDATE SET clicked_at = NOW()
      `;
		} catch {}
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("whatsapp-groups click error:", error);
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/whatsapp-group-click@_@ts
var page = () => whatsapp_group_click_exports;
//#endregion
export { page };
