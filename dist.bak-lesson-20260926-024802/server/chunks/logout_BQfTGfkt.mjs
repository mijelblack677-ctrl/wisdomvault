import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/pages/api/vaultpro/logout.ts
var logout_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	const authHeader = request.headers.get("Authorization");
	const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : "";
	if (token) try {
		await client`DELETE FROM admin_sessions WHERE token = ${token}`;
	} catch (e) {
		console.error("VaultPro logout error:", e);
	}
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/logout@_@ts
var page = () => logout_exports;
//#endregion
export { page };
