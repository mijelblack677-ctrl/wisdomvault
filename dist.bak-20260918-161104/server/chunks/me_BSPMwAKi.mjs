import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_Bo-Lmbfi.mjs";
//#region src/pages/api/vaultpro/me.ts
var me_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		return jsonResponse({
			success: true,
			admin: await requireVaultPro(request)
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/me@_@ts
var page = () => me_exports;
//#endregion
export { page };
