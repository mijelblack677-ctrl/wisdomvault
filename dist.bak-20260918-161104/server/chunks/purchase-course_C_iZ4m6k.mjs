import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { t as isAuthorizedUser } from "./auth-check_CHLkWxRW.mjs";
//#region src/pages/api/content/purchase-course.ts
var purchase_course_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const { userId, packId } = await request.json();
		if (!userId || !packId) return new Response(JSON.stringify({
			success: false,
			message: "User ID and Pack ID required"
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
		const sql = client;
		const pack = await sql`
      SELECT id, name, price, is_free FROM premium_packs 
      WHERE id = ${packId} AND is_active = true
    `;
		if (pack.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Course not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		if ((await sql`
      SELECT id FROM course_purchases 
      WHERE user_id = ${userId} AND pack_id = ${packId}
    `).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "You already have access to this course"
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		if (pack[0].is_free) {
			await sql`
        INSERT INTO course_purchases (user_id, pack_id, is_free, amount_paid)
        VALUES (${userId}, ${packId}, true, 0)
      `;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'course_access',
          '📚 Free Course Access',
          ${"You now have access to \"" + pack[0].name + "\"! Start learning today."},
          '/dashboard/courses'
        )
      `;
			return new Response(JSON.stringify({
				success: true,
				message: "✅ Course access granted! Start learning now.",
				isFree: true
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		const wallet = await sql`
      SELECT id, balance_available FROM wallets WHERE user_id = ${userId}
    `;
		if (wallet.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Wallet not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const price = parseFloat(pack[0].price || 0);
		const balance = parseFloat(wallet[0].balance_available || 0);
		if (balance < price) return new Response(JSON.stringify({
			success: false,
			message: `Insufficient balance. You need MWK ${price.toLocaleString()} but you have MWK ${balance.toLocaleString()}`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await sql.begin(async (tx) => {
			const newBalance = balance - price;
			await tx`
        UPDATE wallets 
        SET balance_available = ${newBalance},
            updated_at = NOW()
        WHERE id = ${wallet[0].id}
      `;
			await tx`
        INSERT INTO course_purchases (user_id, pack_id, is_free, amount_paid)
        VALUES (${userId}, ${packId}, false, ${price})
      `;
			await tx`
        INSERT INTO transactions (
          wallet_id,
          transaction_type,
          amount,
          fee_deducted,
          net_amount,
          balance_before,
          balance_after,
          description
        ) VALUES (
          ${wallet[0].id},
          'course_purchase',
          ${price},
          0,
          ${price},
          ${balance},
          ${newBalance},
          ${"Course Purchase: " + pack[0].name}
        )
      `;
			await tx`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'course_purchased',
          '🎓 Course Purchased!',
          ${"You have successfully purchased \"" + pack[0].name + "\" for MWK " + price.toLocaleString() + ". Start learning now!"},
          '/dashboard/courses'
        )
      `;
		});
		return new Response(JSON.stringify({
			success: true,
			message: `✅ Course purchased! MWK ${price.toLocaleString()} deducted from your wallet.`,
			price,
			newBalance: balance - price
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Purchase course error:", err);
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
//#region \0virtual:astro:page:src/pages/api/content/purchase-course@_@ts
var page = () => purchase_course_exports;
//#endregion
export { page };
