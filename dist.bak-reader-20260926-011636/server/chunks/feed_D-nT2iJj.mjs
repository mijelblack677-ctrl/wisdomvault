import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { a as parseImageUrls } from "./advertTemplates_BOjXxPdH.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
//#region src/pages/api/user/adverts/feed.ts
var feed_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const user = await getAuthUser(request);
		if (!user) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const adverts = (await client`
      SELECT id, user_id, template, headline, business_name, description,
             contact_phone, location, whatsapp, image_urls, created_at, view_count,
             is_official, sold
      FROM user_business_adverts
      WHERE status = 'approved' AND is_active = true
      ORDER BY created_at DESC
      LIMIT 20
    ` || []).map((a) => ({
			id: a.id,
			isMine: a.user_id === user.id,
			isOfficial: a.is_official || false,
			sold: a.sold || false,
			template: a.template,
			headline: a.headline,
			businessName: a.business_name,
			description: a.description || "",
			contactPhone: a.contact_phone || "",
			location: a.location || "",
			whatsapp: a.whatsapp || "",
			images: parseImageUrls(a.image_urls),
			createdAt: a.created_at,
			viewCount: a.view_count || 0
		}));
		return new Response(JSON.stringify({
			success: true,
			adverts
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Advert feed GET error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to load adverts"
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
      UPDATE user_business_adverts
      SET view_count = view_count + 1
      WHERE id = ${id} AND status = 'approved' AND is_active = true
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
//#endregion
//#region \0virtual:astro:page:src/pages/api/user/adverts/feed@_@ts
var page = () => feed_exports;
//#endregion
export { page };
