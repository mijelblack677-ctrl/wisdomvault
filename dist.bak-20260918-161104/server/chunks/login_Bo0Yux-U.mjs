import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/admin/login.ts
var login_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	const sql = client;
	try {
		const rawBody = await request.text();
		const body = JSON.parse(rawBody);
		const identifier = body.identifier || body.email;
		const password = body.password;
		if (!identifier || !password) return new Response(JSON.stringify({
			success: false,
			message: "Email/Phone and password required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const isEmail = identifier.includes("@") && identifier.includes(".");
		let admins;
		if (isEmail) admins = await sql`
        SELECT * FROM admin_users 
        WHERE email = ${identifier} AND is_active = true
      `;
		else admins = await sql`
        SELECT * FROM admin_users 
        WHERE username = ${identifier} AND is_active = true
      `;
		if (admins.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Invalid credentials"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const admin = admins[0];
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
		return new Response(JSON.stringify({
			success: true,
			message: "Login successful",
			admin: {
				id: admin.id,
				username: admin.username,
				email: admin.email
			},
			token
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin login error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/login@_@ts
var page = () => login_exports;
//#endregion
export { page };
