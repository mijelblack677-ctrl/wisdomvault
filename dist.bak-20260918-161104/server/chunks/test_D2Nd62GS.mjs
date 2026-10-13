import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
//#region src/pages/api/referral/test.ts
var test_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
	return new Response(JSON.stringify({
		success: true,
		message: "Referral API is working!",
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/referral/test@_@ts
var page = () => test_exports;
//#endregion
export { page };
