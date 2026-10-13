import { t as client } from "./connection_B4Gof3ME.mjs";
//#region src/lib/vaultproAuth.ts
function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}
/**
* Validate the Authorization header and return the superadmin admin row.
* Throws a Response (401) when the session is missing/expired or the admin is
* not an active super_admin.
*/
async function requireVaultPro(request) {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) throw jsonResponse({
		success: false,
		message: "Unauthorized"
	}, 401);
	const token = authHeader.replace("Bearer ", "");
	const sql = client;
	try {
		const rows = await sql`
      SELECT a.id, a.username, a.email, a.role, a.is_active
      FROM admin_sessions s
      JOIN admin_users a ON a.id = s.admin_id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
        AND a.role = 'super_admin'
        AND a.is_active = true
      LIMIT 1
    `;
		if (rows.length === 0) throw jsonResponse({
			success: false,
			message: "Session expired or not authorized"
		}, 401);
		return rows[0];
	} catch (error) {
		if (error instanceof Response) throw error;
		throw jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
}
/**
* Read the raw JSON body safely. Returns {} on empty/invalid bodies.
*/
async function readJson(request) {
	try {
		const raw = await request.text();
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}
//#endregion
export { readJson as n, requireVaultPro as r, jsonResponse as t };
