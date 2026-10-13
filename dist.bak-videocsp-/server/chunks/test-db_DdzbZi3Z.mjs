import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import { n as unauthorized, t as requireAdmin } from "./adminAuth_Dr_-tb6j.mjs";
//#region src/pages/api/test-db.ts
var test_db_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	if (!await requireAdmin(request)) return unauthorized();
	try {
		const result = await client`SELECT 1 as test`;
		return new Response(JSON.stringify({
			success: true,
			message: "Database connected!",
			result: result[0]
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			message: "Database connection failed",
			error: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/test-db@_@ts
var page = () => test_db_exports;
//#endregion
export { page };
