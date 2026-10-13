import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
//#region src/pages/sitemap.xml.ts
var sitemap_xml_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var ENTRIES = [
	{
		path: "/",
		changefreq: "weekly",
		priority: "1.0"
	},
	{
		path: "/register",
		changefreq: "monthly",
		priority: "0.9"
	},
	{
		path: "/login",
		changefreq: "yearly",
		priority: "0.3"
	},
	{
		path: "/terms",
		changefreq: "yearly",
		priority: "0.2"
	},
	{
		path: "/privacy",
		changefreq: "yearly",
		priority: "0.2"
	}
];
var escapeXml = (value) => value.replace(/[<>&'"]/g, (c) => ({
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&apos;",
	"\"": "&quot;"
})[c]);
var GET = ({ site, url }) => {
	const origin = site ?? new URL("https://vault-of-wisdom.com");
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ENTRIES.map((entry) => {
		const loc = new URL(entry.path, origin).href;
		return [
			"  <url>",
			`    <loc>${escapeXml(loc)}</loc>`,
			`    <changefreq>${entry.changefreq}</changefreq>`,
			`    <priority>${entry.priority}</priority>`,
			"  </url>"
		].join("\n");
	}).join("\n")}\n</urlset>\n`;
	return new Response(xml, {
		status: 200,
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=86400"
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/sitemap.xml@_@ts
var page = () => sitemap_xml_exports;
//#endregion
export { page };
