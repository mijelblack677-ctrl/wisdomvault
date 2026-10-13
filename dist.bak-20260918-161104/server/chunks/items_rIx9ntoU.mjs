import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/admin/packs/items.ts
var items_exports = /* @__PURE__ */ __exportAll({
	DELETE: () => DELETE,
	POST: () => POST,
	prerender: () => false
});
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
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { pack_id, title, content_type, link_type, file_url } = await request.json();
		if (!pack_id || !title) return new Response(JSON.stringify({
			success: false,
			message: "Pack ID and title are required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if ((await sql`
      SELECT id FROM premium_packs WHERE id = ${pack_id}
    `).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Pack not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		let hasLinkType = false;
		try {
			hasLinkType = (await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'premium_content_items' 
        AND column_name = 'link_type'
      `).length > 0;
		} catch (e) {
			console.log("⚠️ Could not check link_type column");
		}
		let result;
		if (hasLinkType) result = await sql`
        INSERT INTO premium_content_items (
          pack_id, title, content_type, link_type, file_url, display_order
        ) VALUES (
          ${pack_id}, ${title}, ${content_type || "pdf"}, ${link_type || "url"}, ${file_url || ""}, 0
        )
        RETURNING id, title, content_type
      `;
		else result = await sql`
        INSERT INTO premium_content_items (
          pack_id, title, content_type, file_url, display_order
        ) VALUES (
          ${pack_id}, ${title}, ${content_type || "pdf"}, ${file_url || ""}, 0
        )
        RETURNING id, title, content_type
      `;
		return new Response(JSON.stringify({
			success: true,
			message: "Item added successfully!",
			item: result[0]
		}), {
			status: 201,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin packs items POST error:", err);
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
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { itemId } = await request.json();
		if (!itemId) return new Response(JSON.stringify({
			success: false,
			message: "Item ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await sql`
      DELETE FROM premium_content_items WHERE id = ${itemId}
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Item deleted successfully"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin packs items DELETE error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/packs/items@_@ts
var page = () => items_exports;
//#endregion
export { page };
