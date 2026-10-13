import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as fetchVideoMeta, t as detectVideoPlatform } from "./video-meta_C86-YQ6N.mjs";
//#region src/pages/api/admin/sponsored/meta.ts
var meta_exports = /* @__PURE__ */ __exportAll({
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
		if ((await sql`
      SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()
    `).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const url = new URL(request.url);
		const videoUrl = (url.searchParams.get("url") || "").trim();
		const platformHint = (url.searchParams.get("platform") || "").trim();
		if (!videoUrl) return new Response(JSON.stringify({
			success: false,
			message: "Enter a video URL first."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const detected = detectVideoPlatform(videoUrl);
		const platform = platformHint || detected;
		if (platform === "unknown") return new Response(JSON.stringify({
			success: false,
			message: "Enter a valid YouTube, TikTok, or Vimeo video URL."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const meta = await fetchVideoMeta(videoUrl, platform);
		if (!meta) return new Response(JSON.stringify({
			success: false,
			message: "Could not fetch video details. The URL may be invalid or the video is unavailable."
		}), {
			status: 422,
			headers: { "Content-Type": "application/json" }
		});
		return new Response(JSON.stringify({
			success: true,
			title: meta.title,
			thumbnail: meta.thumbnail,
			platform: meta.platform
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin sponsored meta error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/sponsored/meta@_@ts
var page = () => meta_exports;
//#endregion
export { page };
