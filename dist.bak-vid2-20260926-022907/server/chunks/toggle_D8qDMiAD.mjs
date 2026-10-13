import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/sponsored/toggle.ts
var toggle_exports = /* @__PURE__ */ __exportAll({
	PUT: () => PUT,
	prerender: () => false
});
var PUT = async ({ request }) => {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({
		success: false,
		message: "Unauthorized"
	}), {
		status: 401,
		headers: { "Content-Type": "application/json" }
	});
	const token = authHeader.replace("Bearer ", "");
	const sql = client;
	try {
		if ((await sql`
      SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()
    `).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { id, is_active } = await request.json();
		if (!id) return new Response(JSON.stringify({
			success: false,
			message: "Content ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await sql`
      UPDATE sponsored_content 
      SET is_active = ${is_active} 
      WHERE id = ${id}
    `;
		return new Response(JSON.stringify({
			success: true,
			message: is_active ? "Task activated" : "Task deactivated"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin sponsored toggle error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/sponsored/toggle@_@ts
var page = () => toggle_exports;
//#endregion
export { page };
