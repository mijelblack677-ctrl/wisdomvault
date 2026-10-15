import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
//#region src/pages/api/auth/reset-password.ts
var reset_password_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var MIN_PASSWORD_LENGTH = 6;
function sha256(value) {
	return crypto.createHash("sha256").update(value).digest("hex");
}
function json(payload, status = 200) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}
var POST = async ({ request }) => {
	try {
		const limit = checkRateLimit(`reset:${clientIp(request)}`, 10, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const body = await request.json().catch(() => ({}));
		const token = String(body && body.token || "").trim();
		const password = String(body && body.password || "");
		if (!token) return json({
			success: false,
			message: "This reset link is invalid or has expired."
		}, 400);
		if (password.length < MIN_PASSWORD_LENGTH) return json({
			success: false,
			message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
		}, 400);
		const sql = client;
		const rows = await sql`
      SELECT id, user_id, expires_at, used_at
      FROM password_resets
      WHERE token_hash = ${sha256(token)}
      LIMIT 1
    `;
		if (rows.length === 0) return json({
			success: false,
			message: "This reset link is invalid or has expired."
		}, 400);
		const record = rows[0];
		if (record.used_at) return json({
			success: false,
			message: "This reset link has already been used. Please request a new one."
		}, 400);
		if (new Date(record.expires_at).getTime() < Date.now()) return json({
			success: false,
			message: "This reset link has expired. Please request a new one."
		}, 400);
		await sql`
      UPDATE users
      SET password_hash = ${await bcrypt.hash(password, 10)}, updated_at = NOW()
      WHERE id = ${record.user_id}
    `;
		await sql`
      UPDATE password_resets
      SET used_at = NOW()
      WHERE user_id = ${record.user_id} AND used_at IS NULL
    `;
		await sql`DELETE FROM user_sessions WHERE user_id = ${record.user_id}`;
		try {
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${record.user_id},
          'system',
          '🔐 Password Reset',
          'Your password was reset using the forgot-password link. If you did not do this, contact support immediately.',
          '/dashboard'
        )
      `;
		} catch (notifyError) {
			console.error("reset-password: notification insert failed:", notifyError.message);
		}
		return json({
			success: true,
			message: "Your password has been reset. You can now sign in with your new password."
		});
	} catch (error) {
		console.error("reset-password error:", error);
		return json({
			success: false,
			message: "Something went wrong. Please try again."
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/reset-password@_@ts
var page = () => reset_password_exports;
//#endregion
export { page };
