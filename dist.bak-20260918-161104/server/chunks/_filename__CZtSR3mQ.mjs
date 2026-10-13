import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import fs from "fs";
import path from "path";
//#region src/pages/api/files/[filename].ts
var _filename__exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ params, request }) => {
	try {
		const { filename } = params;
		if (!filename) return new Response("File not found", { status: 404 });
		const userId = new URL(request.url).searchParams.get("userId");
		const filePath = path.join(process.cwd(), "public", "uploads", filename);
		if (!fs.existsSync(filePath)) return new Response("File not found", { status: 404 });
		const sql = client;
		if ((await sql`
      SELECT id FROM content_items 
      WHERE file_url = ${"/uploads/" + filename} AND is_published = true
    `).length > 0) {
			if (userId) {
				if ((await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = true`).length > 0) return serveFile(filePath, filename);
			}
			return new Response("Login required to access files", { status: 401 });
		}
		const packContent = await sql`
      SELECT pci.pack_id 
      FROM premium_content_items pci
      WHERE pci.file_url = ${"/uploads/" + filename}
    `;
		if (packContent.length > 0) {
			if (!userId) return new Response("Login required", { status: 401 });
			if ((await sql`
        SELECT id FROM user_premium_packs 
        WHERE user_id = ${userId} AND pack_id = ${packContent[0].pack_id}
      `).length > 0) return serveFile(filePath, filename);
			return new Response("Purchase required to access this file", { status: 403 });
		}
		return new Response("File not available", { status: 404 });
	} catch (error) {
		return new Response("Error serving file", { status: 500 });
	}
};
function serveFile(filePath, filename) {
	const fileBuffer = fs.readFileSync(filePath);
	const ext = path.extname(filename).toLowerCase();
	return new Response(fileBuffer, {
		status: 200,
		headers: {
			"Content-Type": {
				".pdf": "application/pdf",
				".jpg": "image/jpeg",
				".jpeg": "image/jpeg",
				".png": "image/png",
				".gif": "image/gif",
				".mp4": "video/mp4",
				".mp3": "audio/mpeg",
				".doc": "application/msword",
				".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				".xls": "application/vnd.ms-excel",
				".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				".zip": "application/zip"
			}[ext] || "application/octet-stream",
			"Content-Disposition": `inline; filename="${filename}"`,
			"Cache-Control": "private, no-cache"
		}
	});
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/files/[filename]@_@ts
var page = () => _filename__exports;
//#endregion
export { page };
