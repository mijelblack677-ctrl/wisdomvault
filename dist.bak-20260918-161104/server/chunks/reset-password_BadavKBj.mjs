import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/admin/users/reset-password.ts
var reset_password_exports = /* @__PURE__ */ __exportAll({
	PUT: () => PUT,
	prerender: () => false
});
var PUT = async ({ request }) => {
	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({
		success: false,
		message: "Unauthorized"
	}), {
		status: 401,
		headers: { "Content-Type": "application/json" }
	});
	const token = authHeader.replace("Bearer ", "");
	const sql = client;
	try {
		if ((await sql`
      SELECT * FROM admin_sessions 
      WHERE token = ${token} AND expires_at > NOW()
    `).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const { userId, newPassword, sendEmail } = await request.json();
		if (!userId || !newPassword) return new Response(JSON.stringify({
			success: false,
			message: "User ID and new password are required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (newPassword.length < 6) return new Response(JSON.stringify({
			success: false,
			message: "Password must be at least 6 characters long"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const user = await sql`
      SELECT id, full_name, email FROM users WHERE id = ${userId}
    `;
		if (user.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
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
        '🔐 Password Reset',
        'Your password has been reset by an administrator. If you did not request this, please contact support immediately.',
        '/dashboard/profile'
      )
    `;
		return new Response(JSON.stringify({
			success: true,
			message: "Password reset successfully!",
			user: {
				id: user[0].id,
				full_name: user[0].full_name,
				email: user[0].email
			}
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Admin reset password error:", err);
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
//#region \0virtual:astro:page:src/pages/api/admin/users/reset-password@_@ts
var page = () => reset_password_exports;
//#endregion
export { page };
