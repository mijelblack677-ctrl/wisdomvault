import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import fs from "fs";
import path from "path";
//#region src/pages/api/admin/upload.ts
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
		const contentId = formData.get("contentId");
		const packItemId = formData.get("packItemId");
		const title = formData.get("title");
		const description = formData.get("description");
		const packId = formData.get("packId");
		if (!file) return new Response(JSON.stringify({
			success: false,
			message: "No file uploaded"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
		const uploadDir = path.join(process.cwd(), "public", "uploads");
		if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
		const filePath = path.join(uploadDir, filename);
		const buffer = Buffer.from(await file.arrayBuffer());
		fs.writeFileSync(filePath, buffer);
		const fileUrl = `/uploads/${filename}`;
		const contentType = {
			".pdf": "pdf",
			".doc": "pdf",
			".docx": "pdf",
			".mp4": "video",
			".mov": "video",
			".avi": "video",
			".webm": "video",
			".mp3": "audio",
			".wav": "audio",
			".m4a": "audio",
			".epub": "ebook",
			".mobi": "ebook",
			".jpg": "guide",
			".jpeg": "guide",
			".png": "guide"
		}[path.extname(filename).toLowerCase()] || "guide";
		if (packId) {
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
			let newItem;
			if (hasLinkType) newItem = await sql`
          INSERT INTO premium_content_items (pack_id, title, description, content_type, file_url, link_type)
          VALUES (${packId}, ${title || file.name}, ${description || ""}, ${contentType}, ${fileUrl}, ${contentType})
          RETURNING *
        `;
			else newItem = await sql`
          INSERT INTO premium_content_items (pack_id, title, description, content_type, file_url)
          VALUES (${packId}, ${title || file.name}, ${description || ""}, ${contentType}, ${fileUrl})
          RETURNING *
        `;
			return new Response(JSON.stringify({
				success: true,
				message: "File uploaded and added to pack as new resource",
				fileUrl,
				item: newItem[0]
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		if (packItemId) {
			await sql`
        UPDATE premium_content_items SET file_url = ${fileUrl} WHERE id = ${packItemId}
      `;
			return new Response(JSON.stringify({
				success: true,
				message: "File uploaded and linked to pack item",
				fileUrl
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		if (contentId) {
			await sql`
        UPDATE content_items SET file_url = ${fileUrl} WHERE id = ${contentId}
      `;
			return new Response(JSON.stringify({
				success: true,
				message: "File uploaded and linked to content",
				fileUrl
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		return new Response(JSON.stringify({
			success: true,
			message: "File uploaded successfully",
			fileUrl,
			contentType
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Upload error:", err);
		let message = err.message;
		if (message.includes("PayloadTooLarge") || message.includes("too large")) message = "File is too large. Maximum file size is 4.5MB for API routes. Consider using cloud storage for larger files.";
		else if (message.includes("ENOENT")) message = "Upload directory not found. Please try again.";
		else if (message.includes("EACCES")) message = "Permission denied. Cannot write to upload directory.";
		return new Response(JSON.stringify({
			success: false,
			message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/upload@_@ts
var page = () => upload_exports;
//#endregion
export { page };
