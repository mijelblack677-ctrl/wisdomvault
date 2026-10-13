import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
//#region src/pages/api/user/vacancies.ts
var vacancies_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		if (!await getAuthUser(request)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const vacancies = (await client`
      SELECT id, title, company, description, location,
             contact_phone, whatsapp, image_urls, created_at, view_count
      FROM vacancies
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 50
    ` || []).map((v) => ({
			id: v.id,
			title: v.title,
			company: v.company,
			description: v.description || "",
			location: v.location || "",
			contactPhone: v.contact_phone || "",
			whatsapp: v.whatsapp || "",
			images: parseImageUrls(v.image_urls),
			createdAt: v.created_at,
			viewCount: v.view_count || 0
		}));
		return new Response(JSON.stringify({
			success: true,
			vacancies
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Vacancies GET error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to load vacancies"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var POST = async ({ request }) => {
	try {
		if (!await getAuthUser(request)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const body = await request.json().catch(() => ({}));
		const id = typeof body?.id === "string" ? body.id : "";
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(JSON.stringify({
			success: false,
			message: "Invalid id"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await client`
      UPDATE vacancies
      SET view_count = view_count + 1
      WHERE id = ${id} AND is_active = true
    `;
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({ success: false }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	}
};
function parseImageUrls(raw) {
	try {
		const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
		return Array.isArray(arr) ? arr.filter((u) => typeof u === "string") : [];
	} catch {
		return [];
	}
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/user/vacancies@_@ts
var page = () => vacancies_exports;
//#endregion
export { page };
