import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import { a as rateLimitResponse, i as isPasswordLocked, n as clearPasswordFailures, o as recordPasswordFailure, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/admin/login.ts
var login_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	const sql = client;
	try {
		const limit = checkRateLimit(`login:admin:${clientIp(request)}`, 10, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
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
		const normalizedId = ("admin:" + identifier).toLowerCase().trim();
		const lockCheck = isPasswordLocked(normalizedId);
		if (lockCheck.locked) {
			const mins = Math.ceil(lockCheck.retryAfterSeconds / 60);
			return new Response(JSON.stringify({
				success: false,
				message: `Account temporarily locked due to too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
				locked: true,
				retryAfterSeconds: lockCheck.retryAfterSeconds
			}), {
				status: 429,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": String(lockCheck.retryAfterSeconds)
				}
			});
		}
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
		if (admins.length === 0) {
			recordPasswordFailure(normalizedId);
			return new Response(JSON.stringify({
				success: false,
				message: "Invalid credentials"
			}), {
				status: 401,
				headers: { "Content-Type": "application/json" }
			});
		}
		const admin = admins[0];
		if (!await bcrypt.compare(password, admin.password_hash)) {
			const attempt = recordPasswordFailure(normalizedId);
			const msg = attempt.locked ? `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(attempt.retryAfterSeconds / 60)} minute(s).` : "Invalid credentials";
			return new Response(JSON.stringify({
				success: false,
				message: msg,
				...attempt.locked && {
					locked: true,
					retryAfterSeconds: attempt.retryAfterSeconds
				}
			}), {
				status: attempt.locked ? 429 : 401,
				headers: { "Content-Type": "application/json" }
			});
		}
		clearPasswordFailures(normalizedId);
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
		console.error("Admin login error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Login failed. Please try again."
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
