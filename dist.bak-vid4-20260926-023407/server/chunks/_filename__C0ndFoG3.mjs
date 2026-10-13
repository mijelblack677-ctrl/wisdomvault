import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import fs from "fs";
import path from "path";
//#region src/pages/api/advert-images/[filename].ts
var _filename__exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var ALLOWED_EXT = /* @__PURE__ */ new Set([
	"jpg",
	"jpeg",
	"png",
	"webp"
]);
var MIME = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp"
};
var GET = async ({ params }) => {
	const raw = params.filename || "";
	const safeName = path.basename(raw);
	if (!safeName || safeName !== raw || safeName.startsWith(".")) return new Response("Not found", { status: 404 });
	const ext = path.extname(safeName).toLowerCase();
	const base = path.basename(safeName, ext);
	if (!ALLOWED_EXT.has(ext.slice(1)) || !/^ad_[a-f0-9]{8}_[0-9]+_[0-9]+$/.test(base)) return new Response("Not found", { status: 404 });
	const advertsRoot = path.resolve(process.cwd(), "public", "uploads", "adverts");
	const filePath = path.resolve(advertsRoot, safeName);
	if (!filePath.startsWith(advertsRoot + path.sep)) return new Response("Not found", { status: 404 });
	let buf;
	try {
		buf = fs.readFileSync(filePath);
	} catch {
		return new Response("Not found", { status: 404 });
	}
	return new Response(new Uint8Array(buf), {
		status: 200,
		headers: {
			"Content-Type": MIME[ext] || "application/octet-stream",
			"Content-Disposition": `inline; filename="${safeName}"`,
			"Cache-Control": "public, max-age=86400, immutable",
			"X-Content-Type-Options": "nosniff"
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/advert-images/[filename]@_@ts
var page = () => _filename__exports;
//#endregion
export { page };
