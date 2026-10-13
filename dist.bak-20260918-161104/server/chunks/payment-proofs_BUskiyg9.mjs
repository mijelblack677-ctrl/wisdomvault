import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/admin/payment-proofs.ts
var payment_proofs_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	PUT: () => PUT,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
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
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const proofs = await sql`
      SELECT pp.*, u.full_name as user_name, pp2.name as pack_name
      FROM payment_proofs pp
      JOIN users u ON pp.user_id = u.id
      JOIN premium_packs pp2 ON pp.pack_id = pp2.id
      ORDER BY pp.created_at DESC
    `;
		return new Response(JSON.stringify({
			success: true,
			proofs
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			message: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var PUT = async ({ request }) => {
	try {
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
		const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
		if (sessions.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const rawBody = await request.text();
		const { proofId, userId, packId, status, notes } = JSON.parse(rawBody);
		if (!proofId || !status) return new Response(JSON.stringify({
			success: false,
			message: "Proof ID and status required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await sql`
      UPDATE payment_proofs 
      SET status = ${status}, admin_notes = ${notes || ""}, reviewed_by = ${sessions[0].admin_id}, reviewed_at = NOW()
      WHERE id = ${proofId}
    `;
		if (status === "approved" && userId && packId) {
			if ((await sql`SELECT id FROM user_premium_packs WHERE user_id = ${userId} AND pack_id = ${packId}`).length === 0) await sql`
          INSERT INTO user_premium_packs (user_id, pack_id, amount_paid, transaction_ref)
          VALUES (${userId}, ${packId}, ${(await sql`SELECT price FROM premium_packs WHERE id = ${packId}`)[0]?.price || 0}, ${"proof-" + proofId})
        `;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'payment_approved', 'Payment Approved!', 
        ${"Your payment for \"" + ((await sql`SELECT name FROM premium_packs WHERE id = ${packId}`)[0]?.name || "pack") + "\" has been approved. The pack is now unlocked!"}, 
        '/dashboard')
      `;
		}
		if (status === "rejected" && userId) await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'payment_rejected', 'Payment Rejected', 
        ${"Your payment proof was rejected. " + (notes || "Please contact support for details.")}, 
        '/dashboard')
      `;
		return new Response(JSON.stringify({
			success: true,
			message: "Payment " + status
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			message: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/payment-proofs@_@ts
var page = () => payment_proofs_exports;
//#endregion
export { page };
