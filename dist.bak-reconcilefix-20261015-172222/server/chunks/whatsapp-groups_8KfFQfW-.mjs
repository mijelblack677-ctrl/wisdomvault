import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
//#region src/pages/api/admin/whatsapp-groups.ts
var whatsapp_groups_exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	GET: () => GET,
	POST: () => POST,
	PUT: () => PUT,
	prerender: () => false
});
var sql = client;
function validLink(link) {
	try {
		const u = new URL(link);
		return u.protocol === "https:" && (u.hostname === "chat.whatsapp.com" || u.hostname === "wa.me") && u.pathname.length > 1;
	} catch {
		return false;
	}
}
var GET = async ({ request }) => {
	try {
		await requireVaultPro(request);
	} catch (e) {
		return e;
	}
	return jsonResponse({
		success: true,
		groups: await sql`
    SELECT g.*,
           (SELECT COUNT(*) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS total_clicks,
           (SELECT COUNT(DISTINCT c.user_id) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS unique_users
    FROM whatsapp_groups g
    ORDER BY g.sort_order ASC, g.id ASC
  `
	});
};
var POST = async ({ request }) => {
	try {
		await requireVaultPro(request);
	} catch (e) {
		return e;
	}
	const body = await request.json().catch(() => ({}));
	const name = String(body.name || "").trim();
	const description = String(body.description || "").trim();
	const link = String(body.link || "").trim();
	const sort_order = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
	if (!name || !validLink(link)) return jsonResponse({
		success: false,
		message: "Name and a valid https://chat.whatsapp.com link are required"
	}, 400);
	await sql`
    INSERT INTO whatsapp_groups (name, description, link, sort_order)
    VALUES (${name}, ${description}, ${link}, ${sort_order})
  `;
	return jsonResponse({
		success: true,
		groups: await sql`
    SELECT g.*, 0 AS total_clicks, 0 AS unique_users FROM whatsapp_groups g
    WHERE id = (SELECT MAX(id) FROM whatsapp_groups)
  `
	}, 201);
};
var PUT = async ({ request }) => {
	try {
		await requireVaultPro(request);
	} catch (e) {
		return e;
	}
	const body = await request.json().catch(() => ({}));
	const id = Number(body.id);
	if (!Number.isInteger(id)) return jsonResponse({
		success: false,
		message: "Valid id required"
	}, 400);
	const name = String(body.name || "").trim();
	const description = String(body.description || "").trim();
	const link = String(body.link || "").trim();
	if (!name || !validLink(link)) return jsonResponse({
		success: false,
		message: "Name and a valid https://chat.whatsapp.com link are required"
	}, 400);
	await sql`
    UPDATE whatsapp_groups
    SET name = ${name}, description = ${description}, link = ${link},
        sort_order = ${Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0},
        is_active = ${body.is_active === false ? false : true},
        updated_at = NOW()
    WHERE id = ${id}
  `;
	return jsonResponse({
		success: true,
		groups: await sql`
    SELECT g.*,
           (SELECT COUNT(*) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS total_clicks,
           (SELECT COUNT(DISTINCT c.user_id) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS unique_users
    FROM whatsapp_groups g ORDER BY g.sort_order ASC, g.id ASC
  `
	});
};
var DELETE = async ({ request }) => {
	try {
		await requireVaultPro(request);
	} catch (e) {
		return e;
	}
	const body = await request.json().catch(() => ({}));
	const id = Number(body.id);
	if (!Number.isInteger(id)) return jsonResponse({
		success: false,
		message: "Valid id required"
	}, 400);
	await sql`DELETE FROM whatsapp_groups WHERE id = ${id}`;
	return jsonResponse({
		success: true,
		groups: await sql`
    SELECT g.*,
           (SELECT COUNT(*) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS total_clicks,
           (SELECT COUNT(DISTINCT c.user_id) FROM whatsapp_group_clicks c WHERE c.group_id = g.id) AS unique_users
    FROM whatsapp_groups g ORDER BY g.sort_order ASC, g.id ASC
  `
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/whatsapp-groups@_@ts
var page = () => whatsapp_groups_exports;
//#endregion
export { page };
