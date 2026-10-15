import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
//#region src/lib/mailer.ts
var _transporter = null;
var _initFailed = false;
function getTransporter() {
	if (_transporter) return _transporter;
	if (_initFailed) return null;
	const host = process.env.SMTP_HOST;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	if (!host || !user || !pass) {
		console.error("✉️  Mailer not configured: SMTP_HOST/SMTP_USER/SMTP_PASS missing");
		_initFailed = true;
		return null;
	}
	const port = parseInt(process.env.SMTP_PORT || "465", 10);
	const secure = (process.env.SMTP_SECURE || "true") !== "false";
	_transporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: {
			user,
			pass
		},
		connectionTimeout: 15e3,
		greetingTimeout: 15e3,
		socketTimeout: 2e4
	});
	return _transporter;
}
/** Whether the SMTP mailbox is configured (env vars present). */
function mailIsConfigured() {
	return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
/** Send one transactional email. Returns true on success; never throws. */
async function sendMail(opts) {
	const transporter = getTransporter();
	if (!transporter) return false;
	const from = process.env.MAIL_FROM || `"Wisdom Vault" <${process.env.SMTP_USER || "noreply@vault-of-wisdom.com"}>`;
	try {
		const info = await transporter.sendMail({
			from,
			to: opts.to,
			subject: opts.subject,
			text: opts.text,
			html: opts.html,
			replyTo: opts.replyTo || process.env.MAIL_REPLY_TO || "support@vault-of-wisdom.com"
		});
		console.log(`✉️  Mail sent to ${opts.to} (${info.messageId})`);
		return true;
	} catch (error) {
		console.error(`✉️  Mail send failed for ${opts.to}:`, error.message);
		return false;
	}
}
function escapeHtml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
/** Build the branded password-reset email (subject + text + html parts). */
function passwordResetEmail(resetUrl, userName, expiresMinutes) {
	const firstName = (userName || "there").split(" ")[0];
	const safeName = escapeHtml(firstName);
	const safeUrl = escapeHtml(resetUrl);
	return {
		subject: "Reset your Wisdom Vault password",
		text: `Hi ${firstName},

We received a request to reset the password for your Wisdom Vault account.

Open this link to choose a new password (valid for ${expiresMinutes} minutes):
${resetUrl}

If you did not request this, you can safely ignore this email — your password
will stay the same.

— Wisdom Vault
https://vault-of-wisdom.com`.trim(),
		html: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f1ee;font-family:Arial,Helvetica,sans-serif;color:#2d2327;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ee;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7ded8;">
            <tr>
              <td style="background:#2d2327;padding:22px 28px;">
                <span style="color:#c09a8a;font-size:13px;letter-spacing:2px;font-weight:bold;">WISDOM VAULT</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#2d2327;">Reset your password</h1>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a3f43;">Hi ${safeName},</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4a3f43;">
                  We received a request to reset the password for your Wisdom Vault account.
                  Click the button below to choose a new one. This link is valid for ${expiresMinutes} minutes.
                </p>
                <p style="margin:0 0 28px;" align="center">
                  <a href="${safeUrl}" style="display:inline-block;background:#c09a8a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 28px;border-radius:8px;">Choose a new password</a>
                </p>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#8a7a72;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.6;color:#6f8fbf;word-break:break-all;">${safeUrl}</p>
                <hr style="border:none;border-top:1px solid #eee5df;margin:0 0 16px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8a7a72;">
                  If you did not request a password reset, you can safely ignore this email —
                  your password will not change.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#faf7f5;padding:16px 28px;font-size:11px;color:#a89c95;">
                Wisdom Vault &bull; vault-of-wisdom.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
	};
}
//#endregion
//#region src/pages/api/auth/forgot-password.ts
var forgot_password_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var RESET_TTL_MINUTES = 60;
function sha256(value) {
	return crypto.createHash("sha256").update(value).digest("hex");
}
function genericResponse() {
	return new Response(JSON.stringify({
		success: true,
		message: "If an account exists for that email, we have sent a password reset link. Please check your inbox (and spam folder)."
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
}
var POST = async ({ request }) => {
	try {
		const limit = checkRateLimit(`forgot:${clientIp(request)}`, 5, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const body = await request.json().catch(() => ({}));
		const email = String(body && body.email || "").toLowerCase().trim();
		if (!email || !email.includes("@") || !email.includes(".")) return new Response(JSON.stringify({
			success: false,
			message: "Please enter a valid email address."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const users = await sql`
      SELECT id, full_name, email
      FROM users
      WHERE lower(email) = ${email} AND is_active = true
      LIMIT 1
    `;
		if (users.length === 0) return genericResponse();
		const user = users[0];
		if (!mailIsConfigured()) {
			console.error("forgot-password: SMTP is not configured — no email sent");
			return genericResponse();
		}
		await sql`
      UPDATE password_resets
      SET used_at = NOW()
      WHERE user_id = ${user.id} AND used_at IS NULL
    `;
		const token = crypto.randomBytes(32).toString("hex");
		const tokenHash = sha256(token);
		const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1e3);
		await sql`
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt})
    `;
		const mail = passwordResetEmail(`${(process.env.PUBLIC_APP_URL || "https://vault-of-wisdom.com").replace(/\/+$/, "")}/reset-password?token=${token}`, user.full_name, RESET_TTL_MINUTES);
		if (!await sendMail({
			to: user.email,
			subject: mail.subject,
			text: mail.text,
			html: mail.html
		})) console.error("forgot-password: failed to deliver reset email for", user.email);
		return genericResponse();
	} catch (error) {
		console.error("forgot-password error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Something went wrong. Please try again."
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/forgot-password@_@ts
var page = () => forgot_password_exports;
//#endregion
export { page };
