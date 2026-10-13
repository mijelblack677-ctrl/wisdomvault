import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/vaultpro/admins.ts
var admins_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
/**
* GET  /api/vaultpro/admins                  → list all admin accounts
* POST /api/vaultpro/admins                  → create admin { username, email, password, role? }
*
* PUT /api/vaultpro/admins/:id lives in admins/[id].ts
*/
var GET = async ({ request }) => {
	try {
		await requireVaultPro(request);
		return jsonResponse({
			success: true,
			admins: await client`
      SELECT id, username, email, role, is_active, last_login, created_at
      FROM admin_users
      ORDER BY created_at ASC
    `
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
var POST = async ({ request }) => {
	try {
		const actor = await requireVaultPro(request);
		const sql = client;
		const { username, email, password, role } = await readJson(request);
		if (!username || !email || !password) return jsonResponse({
			success: false,
			message: "username, email and password required"
		}, 400);
		if (password.length < 6) return jsonResponse({
			success: false,
			message: "Password must be at least 6 characters"
		}, 400);
		const finalRole = [
			"super_admin",
			"admin",
			"content_manager",
			"support"
		].includes(role) ? role : "admin";
		if ((await sql`
      SELECT id FROM admin_users WHERE username = ${username} OR email = ${email}
    `).length > 0) return jsonResponse({
			success: false,
			message: "Username or email already in use"
		}, 409);
		const inserted = await sql`
      INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
      VALUES (${username}, ${email}, ${await bcrypt.hash(password, 10)}, ${finalRole}, true, NOW())
      RETURNING id, username, email, role, is_active
    `;
		await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${actor.id}, 'vaultpro_create_admin',
              ${JSON.stringify({
			username,
			email,
			role: finalRole
		})}::jsonb)
    `;
		return jsonResponse({
			success: true,
			message: "Admin created",
			admin: inserted[0]
		}, 201);
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/admins@_@ts
var page = () => admins_exports;
//#endregion
export { page };
