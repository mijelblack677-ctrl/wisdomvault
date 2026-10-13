import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/content/howto/index.ts
var howto_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
	const sql = client;
	try {
		const items = await sql`
      SELECT 
        ci.id,
        ci.title,
        ci.description,
        ci.content_type,
        ci.file_url,
        ci.thumbnail_url,
        ci.author,
        ci.created_at,
        ci.link_type,
        ci.is_published,
        ci.steps,
        ci.tips,
        cc.name as category_name,
        cc.slug as category_slug
      FROM content_items ci
      JOIN content_categories cc ON ci.category_id = cc.id
      WHERE ci.content_type = 'guide' AND ci.is_published = true
      ORDER BY ci.created_at DESC
    `;
		console.log("📚 Found guides:", items.length);
		const categories = await sql`
      SELECT * FROM content_categories WHERE is_active = true ORDER BY display_order
    `;
		return new Response(JSON.stringify({
			success: true,
			items: items || [],
			categories: categories || [],
			totalItems: items.length
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("How-to guides error:", err);
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
//#region \0virtual:astro:page:src/pages/api/content/howto/index@_@ts
var page = () => howto_exports;
//#endregion
export { page };
