import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_Bo-Lmbfi.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/vaultpro/admins/[id].ts
var _id__exports = /* @__PURE__ */ __exportAll({
	PUT: () => PUT,
	prerender: () => false
});
/**
* PUT /api/vaultpro/admins/:id
* Body: { is_active?, role?, password? }
*/
var PUT = async ({ request }) => {
	try {
		const actor = await requireVaultPro(request);
		const sql = client;
		const id = new URL(request.url).pathname.split("/").pop() || "";
		if (!id) return jsonResponse({
			success: false,
			message: "admin id required"
		}, 400);
		const body = await readJson(request);
		const existing = await sql`SELECT id, username, email, role, is_active FROM admin_users WHERE id = ${id}`;
		if (existing.length === 0) return jsonResponse({
			success: false,
			message: "Admin not found"
		}, 404);
		const admin = existing[0];
		const updates = [];
		const values = [];
		if (body.is_active !== void 0) {
			if (admin.role === "super_admin" && body.is_active === false && actor.id === admin.id) return jsonResponse({
				success: false,
				message: "You cannot deactivate your own account"
			}, 400);
			updates.push("is_active = $" + (updates.length + 1));
			values.push(body.is_active);
		}
		if (body.role !== void 0) {
			if (![
				"super_admin",
				"admin",
				"content_manager",
				"support"
			].includes(body.role)) return jsonResponse({
				success: false,
				message: "Invalid role"
			}, 400);
			if (actor.id === admin.id && admin.role === "super_admin" && body.role !== "super_admin") return jsonResponse({
				success: false,
				message: "You cannot demote your own account"
			}, 400);
			updates.push("role = $" + (updates.length + 1));
			values.push(body.role);
		}
		if (body.password) {
			if (body.password.length < 6) return jsonResponse({
				success: false,
				message: "Password must be at least 6 characters"
			}, 400);
			const passwordHash = await bcrypt.hash(body.password, 10);
			updates.push("password_hash = $" + (updates.length + 1));
			values.push(passwordHash);
		}
		if (updates.length === 0) return jsonResponse({
			success: false,
			message: "Nothing to update"
		}, 400);
		values.push(id);
		await sql.unsafe(`UPDATE admin_users SET ${updates.join(", ")} WHERE id = $${values.length}`, values);
		await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${actor.id}, 'vaultpro_update_admin',
              ${JSON.stringify({
			adminId: id,
			updates: updates.join(", ")
		})}::jsonb)
    `;
		return jsonResponse({
			success: true,
			message: "Admin updated",
			admin: (await sql`
      SELECT id, username, email, role, is_active FROM admin_users WHERE id = ${id}
    `)[0]
		});
	} catch (error) {
		if (error instanceof Response) return error;
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/admins/[id]@_@ts
var page = () => _id__exports;
//#endregion
export { page };
