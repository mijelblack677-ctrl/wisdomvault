import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/vaultpro/login.ts
var login_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* POST /api/vaultpro/login
*
* Superadmin-only login for the /vaultpro panel. Unlike the regular admin
* login, this endpoint ONLY accepts admin_users with role = 'super_admin'.
* Sessions are stored in admin_sessions (same table as the admin panel) so a
* superadmin token is also accepted by the existing /api/admin/* endpoints.
*/
var POST = async ({ request }) => {
	const sql = client;
	try {
		const rawBody = await request.text();
		const body = rawBody ? JSON.parse(rawBody) : {};
		const identifier = body.identifier || body.email;
		const password = body.password;
		if (!identifier || !password) return new Response(JSON.stringify({
			success: false,
			message: "Username/Email and password required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		let admins = await sql`
      SELECT * FROM admin_users
      WHERE (email = ${identifier} OR username = ${identifier})
        AND is_active = true
    `;
		if (admins.length === 0 && process.env.VAULTPRO_PASSWORD) {
			const envUsername = process.env.VAULTPRO_USERNAME || "vaultpro";
			const envEmail = process.env.VAULTPRO_EMAIL || "vaultpro@wisdomvault.com";
			if ((identifier === envUsername || identifier.toLowerCase() === envEmail.toLowerCase()) && password === process.env.VAULTPRO_PASSWORD) {
				const created = await sql`
          INSERT INTO admin_users (username, email, password_hash, role, is_active, created_at)
          VALUES (${envUsername}, ${envEmail}, ${await bcrypt.hash(password, 10)}, 'super_admin', true, NOW())
          ON CONFLICT (username) DO NOTHING
          RETURNING id, username, email, role, is_active
        `;
				console.log("🛠  VaultPro superadmin auto-provisioned from env vars");
				admins = created;
			}
		}
		if (admins.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Invalid credentials"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const admin = admins[0];
		if (admin.role !== "super_admin") return new Response(JSON.stringify({
			success: false,
			message: "This account is not authorized for the SuperAdmin panel."
		}), {
			status: 403,
			headers: { "Content-Type": "application/json" }
		});
		if (!await bcrypt.compare(password, admin.password_hash)) return new Response(JSON.stringify({
			success: false,
			message: "Invalid credentials"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 1440 * 60 * 1e3);
		await sql`
      INSERT INTO admin_sessions (admin_id, token, expires_at)
      VALUES (${admin.id}, ${token}, ${expiresAt.toISOString()})
    `;
		await sql`
      UPDATE admin_users SET last_login = NOW() WHERE id = ${admin.id}
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "SuperAdmin login successful",
			admin: {
				id: admin.id,
				username: admin.username,
				email: admin.email,
				role: admin.role
			},
			token
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("VaultPro login error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/login@_@ts
var page = () => login_exports;
//#endregion
export { page };
