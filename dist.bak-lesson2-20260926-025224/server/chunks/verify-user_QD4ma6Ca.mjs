import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
//#region src/pages/api/admin/verify-user.ts
var verify_user_exports = /* @__PURE__ */ __exportAll({
	PUT: () => PUT,
	prerender: () => false
});
/**
* Manual user verification is DISABLED.
* All verification is now handled automatically by PayChangu payment callbacks.
* Users pay via PayChangu → account is auto-verified.
*/
var PUT = async () => {
	return new Response(JSON.stringify({
		success: false,
		message: "Manual verification is disabled. All accounts are verified automatically via PayChangu payment."
	}), {
		status: 403,
		headers: { "Content-Type": "application/json" }
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/verify-user@_@ts
var page = () => verify_user_exports;
//#endregion
export { page };
