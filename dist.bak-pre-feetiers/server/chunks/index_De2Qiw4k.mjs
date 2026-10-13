import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/admin/packs/index.ts
var packs_exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	GET: () => GET,
	POST: () => POST,
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
		if ((await sql`
      SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()
    `).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const packs = await sql`
      SELECT * FROM premium_packs ORDER BY display_order, created_at, id
    `;
		const packsWithItems = await Promise.all(packs.map(async (pack) => {
			const items = await sql`
        SELECT * FROM premium_content_items WHERE pack_id = ${pack.id} ORDER BY display_order, created_at, id
      `;
			return {
				...pack,
				items
			};
		}));
		return new Response(JSON.stringify({
			success: true,
			packs: packsWithItems
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin packs GET error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var POST = async ({ request }) => {
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
		const { name, price, description, is_free, category, long_description, thumbnail_url } = await request.json();
		if (!name) return new Response(JSON.stringify({
			success: false,
			message: "Course name is required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const result = await sql`
      INSERT INTO premium_packs (
        name, 
        slug, 
        price, 
        description, 
        is_free,
        category,
        long_description,
        thumbnail_url,
        is_active
      ) VALUES (
        ${name},
        ${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")},
        ${is_free ? 0 : parseFloat(price) || 0},
        ${description || ""},
        ${is_free || false},
        ${category || "General"},
        ${long_description || description || ""},
        ${thumbnail_url || ""},
        true
      )
      RETURNING id, name, price, is_free
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Course created successfully!",
			pack: result[0]
		}), {
			status: 201,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin packs POST error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var DELETE = async ({ request }) => {
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
		const { packId } = await request.json();
		if (!packId) return new Response(JSON.stringify({
			success: false,
			message: "Pack ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await sql`DELETE FROM premium_content_items WHERE pack_id = ${packId}`;
		await sql`DELETE FROM premium_packs WHERE id = ${packId}`;
		return new Response(JSON.stringify({
			success: true,
			message: "Course deleted successfully"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin packs DELETE error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/packs/index@_@ts
var page = () => packs_exports;
//#endregion
export { page };
