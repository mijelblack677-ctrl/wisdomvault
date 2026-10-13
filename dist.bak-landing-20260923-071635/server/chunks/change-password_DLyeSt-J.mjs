import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/user/change-password.ts
var change_password_exports = /* @__PURE__ */ __exportAll({
	PUT: () => PUT,
	prerender: () => false
});
var PUT = async ({ request }) => {
	try {
		const { userId, currentPassword, newPassword } = await request.json();
		if (!userId || !currentPassword || !newPassword) return new Response(JSON.stringify({
			success: false,
			message: "User ID, current password, and new password are required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		if (newPassword.length < 6) return new Response(JSON.stringify({
			success: false,
			message: "New password must be at least 6 characters long"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const user = await sql`
      SELECT id, password_hash FROM users WHERE id = ${userId}
    `;
		if (user.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		if (!await bcrypt.compare(currentPassword, user[0].password_hash)) return new Response(JSON.stringify({
			success: false,
			message: "Current password is incorrect"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		await sql`
      UPDATE users 
      SET 
        password_hash = ${await bcrypt.hash(newPassword, 10)},
        updated_at = NOW()
      WHERE id = ${userId}
    `;
		await sql`
      INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        link
      ) VALUES (
        ${userId},
        'system',
        '🔐 Password Changed',
        'Your password was successfully changed. If you did not make this change, please contact support immediately.',
        '/dashboard/profile'
      )
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Password changed successfully!"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Change password error:", err);
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
//#region \0virtual:astro:page:src/pages/api/user/change-password@_@ts
var page = () => change_password_exports;
//#endregion
export { page };
