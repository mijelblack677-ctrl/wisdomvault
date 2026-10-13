import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { n as fetchVideoMeta, t as detectVideoPlatform } from "./video-meta_C86-YQ6N.mjs";
//#region src/pages/api/admin/sponsored/index.ts
var sponsored_exports = /* @__PURE__ */ __exportAll({
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
		const items = await sql`
      SELECT * FROM sponsored_content 
      ORDER BY display_order, created_at DESC
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
		console.error("Admin sponsored GET error:", err);
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
		const { title: _title, description: _description, content_type, sponsor_name, reward_amount, duration_seconds, external_link, video_platform, thumbnail_url: _thumbnail_url } = await request.json();
		if (!content_type) return new Response(JSON.stringify({
			success: false,
			message: "Content type is required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		let title = (_title || "").trim();
		let description = (_description || "").trim();
		let thumbnail_url = (_thumbnail_url || "").trim();
		const detectedPlatform = video_platform || detectVideoPlatform(external_link || "");
		const isVideoPlatform = [
			"youtube",
			"tiktok",
			"vimeo"
		].includes(detectedPlatform);
		if (isVideoPlatform && (!title || !thumbnail_url || !description)) try {
			const meta = await fetchVideoMeta(external_link || "", detectedPlatform);
			if (meta) {
				title = title || meta.title;
				thumbnail_url = thumbnail_url || meta.thumbnail;
				description = description || `Watch "${meta.title}" and earn rewards.`;
			}
		} catch (e) {}
		if (isVideoPlatform) {
			if (!title) title = "Watch & Earn Video";
			if (!description) description = title;
			if (!thumbnail_url && external_link && detectedPlatform === "youtube") {
				const ytMatch = String(external_link).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/);
				if (ytMatch?.[1]) thumbnail_url = `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
			}
		}
		if (!title) return new Response(JSON.stringify({
			success: false,
			message: "Title is required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		let hasVideoPlatform = false;
		try {
			hasVideoPlatform = (await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sponsored_content' 
        AND column_name = 'video_platform'
      `).length > 0;
		} catch (e) {
			console.log("⚠️ Could not check video_platform column");
		}
		let result;
		if (hasVideoPlatform) result = await sql`
        INSERT INTO sponsored_content (
          title, 
          description, 
          content_type, 
          sponsor_name, 
          reward_amount, 
          duration_seconds, 
          external_link,
          video_platform,
          thumbnail_url,
          is_active
        ) VALUES (
          ${title},
          ${description || ""},
          ${content_type},
          ${sponsor_name || ""},
          ${parseFloat(reward_amount) || 50},
          ${parseInt(duration_seconds) || 30},
          ${external_link || ""},
          ${video_platform || "youtube"},
          ${thumbnail_url || ""},
          true
        )
        RETURNING id
      `;
		else result = await sql`
        INSERT INTO sponsored_content (
          title, 
          description, 
          content_type, 
          sponsor_name, 
          reward_amount, 
          duration_seconds, 
          external_link,
          thumbnail_url,
          is_active
        ) VALUES (
          ${title},
          ${description || ""},
          ${content_type},
          ${sponsor_name || ""},
          ${parseFloat(reward_amount) || 50},
          ${parseInt(duration_seconds) || 30},
          ${external_link || ""},
          ${thumbnail_url || ""},
          true
        )
        RETURNING id
      `;
		return new Response(JSON.stringify({
			success: true,
			message: "Sponsored task created successfully!",
			id: result[0]?.id
		}), {
			status: 201,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin sponsored POST error:", err);
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
		const { id } = await request.json();
		if (!id) return new Response(JSON.stringify({
			success: false,
			message: "Content ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		try {
			await sql`
        DELETE FROM sponsored_content WHERE id = ${id}
      `;
		} catch (deleteErr) {
			const msg = deleteErr.message || "";
			if (!(msg.includes("foreign key") || msg.includes("violates") || msg.includes("user_sponsored_views_content_id_fkey"))) throw deleteErr;
			await sql.begin(async (tx) => {
				await tx`DELETE FROM user_sponsored_views WHERE content_id = ${id}`;
				await tx`DELETE FROM sponsored_content WHERE id = ${id}`;
			});
		}
		return new Response(JSON.stringify({
			success: true,
			message: "Sponsored content deleted successfully"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin sponsored DELETE error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/sponsored/index@_@ts
var page = () => sponsored_exports;
//#endregion
export { page };
