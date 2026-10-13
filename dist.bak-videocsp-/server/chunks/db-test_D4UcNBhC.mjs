import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { n as unauthorized, t as requireAdmin } from "./adminAuth_Dr_-tb6j.mjs";
import postgres from "postgres";
//#region src/pages/api/db-test.ts
var db_test_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	if (!await requireAdmin(request)) return unauthorized();
	const results = {
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		env: {
			DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
			NODE_ENV: process.env.NODE_ENV || "not set"
		},
		db: {
			connected: false,
			error: null
		}
	};
	if (!process.env.DATABASE_URL) {
		results.db.error = "DATABASE_URL environment variable is not set";
		return new Response(JSON.stringify(results, null, 2), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
	try {
		const sql = postgres(process.env.DATABASE_URL, {
			max: 1,
			idle_timeout: 10,
			connect_timeout: 10,
			ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
		});
		const test = await sql`SELECT 1 as test, NOW() as time, version() as version`;
		results.db.connected = true;
		results.db.testResult = test;
		await sql.end();
	} catch (err) {
		results.db.error = err.message;
	}
	return new Response(JSON.stringify(results, null, 2), {
		status: results.db.connected ? 200 : 500,
		headers: { "Content-Type": "application/json" }
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/db-test@_@ts
var page = () => db_test_exports;
//#endregion
export { page };
