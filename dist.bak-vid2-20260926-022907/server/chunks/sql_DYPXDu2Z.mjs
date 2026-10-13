import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
//#region src/pages/api/vaultpro/sql.ts
var sql_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* POST /api/vaultpro/sql
* Body: { query: string, allowWrite?: boolean }
*
* Runs a single SQL statement. By default only read-only statements
* (SELECT / SHOW / EXPLAIN / WITH ... SELECT) are allowed. Pass allowWrite:true
* to run INSERT / UPDATE / DELETE / ALTER / etc. — an audit log entry is always
* recorded.
*/
var POST = async ({ request }) => {
	try {
		const admin = await requireVaultPro(request);
		const sql = client;
		const body = await readJson(request);
		const query = String(body.query || "").trim();
		if (!query) return jsonResponse({
			success: false,
			message: "query required"
		}, 400);
		const normalized = query.replace(/;\s*$/, "");
		if (normalized.includes(";")) return jsonResponse({
			success: false,
			message: "Only a single statement is allowed"
		}, 400);
		const upper = normalized.toUpperCase();
		const isReadOnly = /^(SELECT|SHOW|EXPLAIN|WITH|VALUES)\b/.test(upper);
		const allowWrite = body.allowWrite === true;
		if (!isReadOnly && !allowWrite) return jsonResponse({
			success: false,
			message: "This statement modifies data. Set allowWrite:true to confirm you want to run it.",
			isReadOnly: false
		}, 400);
		let statement = normalized;
		if (isReadOnly && /^SELECT\b/i.test(statement) && !/LIMIT\s+\d+/i.test(statement)) statement = statement.replace(/;?\s*$/, "") + " LIMIT 500";
		const started = Date.now();
		const result = await sql.unsafe(statement);
		const elapsed = Date.now() - started;
		await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${admin.id}, 'vaultpro_sql',
              ${JSON.stringify({
			query: statement.slice(0, 2e3),
			readOnly: isReadOnly
		})}::jsonb)
    `;
		return jsonResponse({
			success: true,
			isReadOnly,
			rows: result.length,
			elapsedMs: elapsed,
			data: result
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
//#region \0virtual:astro:page:src/pages/api/vaultpro/sql@_@ts
var page = () => sql_exports;
//#endregion
export { page };
