import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/categories.ts
var categories_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
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
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const categories = await sql`
      SELECT * FROM content_categories 
      WHERE is_active = true 
      ORDER BY display_order
    `;
		return new Response(JSON.stringify({
			success: true,
			categories
		}), {
			status: 200,
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
//#region \0virtual:astro:page:src/pages/api/admin/categories@_@ts
var page = () => categories_exports;
//#endregion
export { page };
