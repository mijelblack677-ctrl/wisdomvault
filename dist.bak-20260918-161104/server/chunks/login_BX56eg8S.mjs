import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import { a as rateLimitResponse, i as isPasswordLocked, n as clearPasswordFailures, o as recordPasswordFailure, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
//#region src/pages/api/auth/login.ts
var login_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var MAX_PASSWORD_FAILURES = 3;
var POST = async ({ request }) => {
	try {
		const limit = checkRateLimit(`login:${clientIp(request)}`, 20, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const rawBody = await request.text();
		const { identifier, password } = JSON.parse(rawBody);
		if (!identifier || !password) return new Response(JSON.stringify({
			success: false,
			message: "Email/Phone and password required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const isEmail = identifier.includes("@") && identifier.includes(".");
		let users;
		if (isEmail) users = await sql`
        SELECT * FROM users 
        WHERE email = ${identifier} AND is_active = true
      `;
		else users = await sql`
        SELECT * FROM users 
        WHERE phone = ${identifier.replace(/\s/g, "")} AND is_active = true
      `;
		const normalizedId = identifier.toLowerCase().trim();
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
		if (users.length === 0) {
			recordPasswordFailure(normalizedId);
			return new Response(JSON.stringify({
				success: false,
				message: "Invalid credentials"
			}), {
				status: 401,
				headers: { "Content-Type": "application/json" }
			});
		}
		const user = users[0];
		if (!await bcrypt.compare(password, user.password_hash)) {
			const attempt = recordPasswordFailure(normalizedId);
			const remaining = MAX_PASSWORD_FAILURES - attempt.count;
			const msg = attempt.locked ? `Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(attempt.retryAfterSeconds / 60)} minute(s).` : remaining <= 1 ? `Invalid credentials. Warning: your account will be locked after ${remaining} more failed attempt.` : "Invalid credentials";
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
		const expiresAt = new Date(Date.now() + 10080 * 60 * 1e3);
		await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Login successful",
			user: {
				id: user.id,
				fullName: user.full_name,
				email: user.email,
				phone: user.phone,
				referralCode: user.referral_code,
				paymentStatus: user.payment_status,
				isFoundingMember: user.is_founding_member
			},
			token
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Login error:", err);
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
//#region \0virtual:astro:page:src/pages/api/auth/login@_@ts
var page = () => login_exports;
//#endregion
export { page };
