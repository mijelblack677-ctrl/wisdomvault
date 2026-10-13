import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import fs from "fs";
import path from "path";
//#region src/pages/api/admin/sponsored/upload.ts
var upload_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
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
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const formData = await request.formData();
		const file = formData.get("file");
		const sponsoredId = formData.get("sponsoredId");
		if (!file || !sponsoredId) return new Response(JSON.stringify({
			success: false,
			message: "File and sponsored ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const filename = `sponsored_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
		const uploadDir = path.join(process.cwd(), "public", "uploads");
		if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
		const filePath = path.join(uploadDir, filename);
		const buffer = Buffer.from(await file.arrayBuffer());
		fs.writeFileSync(filePath, buffer);
		const fileUrl = `/uploads/${filename}`;
		await sql`
      UPDATE sponsored_content SET file_url = ${fileUrl} WHERE id = ${sponsoredId}
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Media file uploaded",
			fileUrl
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
//#region \0virtual:astro:page:src/pages/api/admin/sponsored/upload@_@ts
var page = () => upload_exports;
//#endregion
export { page };
