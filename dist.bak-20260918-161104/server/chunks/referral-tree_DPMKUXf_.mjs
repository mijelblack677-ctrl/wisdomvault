import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_Bo-Lmbfi.mjs";
//#region src/pages/api/vaultpro/referral-tree.ts
var referral_tree_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request, url }) => {
	try {
		await requireVaultPro(request);
		const sql = client;
		const identifier = url.searchParams.get("identifier") || "";
		if (!identifier) return jsonResponse({
			success: false,
			message: "identifier (email/phone/referral_code/id) required"
		}, 400);
		const users = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier) ? await sql`
          SELECT id, full_name, email, phone, referral_code, referred_by, payment_status, is_active
          FROM users WHERE id = ${identifier} LIMIT 1
        ` : await sql`
          SELECT id, full_name, email, phone, referral_code, referred_by, payment_status, is_active
          FROM users
          WHERE email = ${identifier}
             OR phone = ${identifier}
             OR referral_code = ${identifier}
             OR full_name ILIKE ${"%" + identifier + "%"}
          ORDER BY (email = ${identifier}) DESC, (phone = ${identifier}) DESC,
                   (referral_code = ${identifier}) DESC, full_name
          LIMIT 1
        `;
		if (users.length === 0) return jsonResponse({
			success: false,
			message: "User not found"
		}, 404);
		const user = users[0];
		const upline = [];
		let current = user.referred_by;
		let guard = 0;
		while (current && guard < 10) {
			const rows = await sql`
        SELECT id, full_name, email, phone, referral_code, payment_status, is_active, referred_by
        FROM users WHERE id = ${current}
      `;
			if (rows.length === 0) break;
			upline.push(rows[0]);
			current = rows[0].referred_by;
			guard++;
		}
		const downline = await sql`
      SELECT id, full_name, email, phone, referral_code, payment_status, is_active, created_at
      FROM users WHERE referred_by = ${user.id}
      ORDER BY created_at DESC
      LIMIT 200
    `;
		const level2 = await sql`
      SELECT
        u1.full_name as referrer_name, u1.email as referrer_email,
        u2.id as id, u2.full_name as full_name, u2.email as email,
        u2.phone as phone, u2.referral_code as referral_code,
        u2.payment_status as payment_status, u2.created_at as created_at
      FROM users u1
      JOIN users u2 ON u2.referred_by = u1.id
      WHERE u1.referred_by = ${user.id}
      ORDER BY u2.created_at DESC
      LIMIT 200
    `;
		return jsonResponse({
			success: true,
			user,
			upline,
			downlineCount: downline.length,
			downline,
			level2
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
//#region \0virtual:astro:page:src/pages/api/vaultpro/referral-tree@_@ts
var page = () => referral_tree_exports;
//#endregion
export { page };
