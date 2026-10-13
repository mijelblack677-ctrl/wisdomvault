import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
//#region src/pages/api/health.ts
var health_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
	return new Response(JSON.stringify({
		status: "ok",
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		environment: process.env.NODE_ENV || "development"
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/health@_@ts
var page = () => health_exports;
//#endregion
export { page };
