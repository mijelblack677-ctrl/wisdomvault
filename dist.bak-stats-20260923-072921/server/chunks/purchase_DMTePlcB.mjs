import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
//#region src/pages/api/courses/purchase.ts
var purchase_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const { userId, packId } = await request.json();
		console.log("📦 Course purchase request:", {
			userId,
			packId
		});
		if (!userId || !packId) return new Response(JSON.stringify({
			success: false,
			message: "User ID and Course ID required"
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
		const course = await sql`
      SELECT id, name, price, is_free FROM premium_packs 
      WHERE id = ${packId} AND is_active = true
    `;
		if (course.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Course not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		console.log("📦 Course found:", course[0]);
		const existing = await sql`
      SELECT id, is_free FROM course_purchases 
      WHERE user_id = ${userId} AND pack_id = ${packId}
    `;
		if (existing.length > 0) return new Response(JSON.stringify({
			success: true,
			message: "You already have access to this course",
			alreadyPurchased: true,
			isFree: existing[0].is_free
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		if (course[0].is_free) {
			await sql.begin(async (tx) => {
				await tx`
          INSERT INTO course_purchases (user_id, pack_id, is_free, amount_paid)
          VALUES (${userId}, ${packId}, true, 0)
        `;
				await tx`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (
            ${userId},
            'course_access',
            '📚 Free Course Enrolled',
            ${"You now have access to \"" + course[0].name + "\"! Start learning today."},
            '/dashboard/courses'
          )
        `;
			});
			return new Response(JSON.stringify({
				success: true,
				message: "✅ Free course enrolled! Start learning now.",
				isFree: true,
				alreadyPurchased: false
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		const wallet = await sql`
      SELECT id, balance_available, store_credit FROM wallets WHERE user_id = ${userId}
    `;
		if (wallet.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Wallet not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const price = parseFloat(course[0].price || 0);
		const storeCredit = parseFloat(wallet[0].store_credit || 0);
		const balanceAvailable = parseFloat(wallet[0].balance_available || 0);
		console.log("💰 Wallet balance:", {
			storeCredit,
			balanceAvailable,
			price
		});
		if (storeCredit >= price) {
			await sql.begin(async (tx) => {
				const newStoreCredit = storeCredit - price;
				await tx`
          UPDATE wallets 
          SET store_credit = ${newStoreCredit},
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
            balance_before,
            balance_after,
            description
          ) VALUES (
            ${wallet[0].id},
            'course_purchase_store_credit',
            ${price},
            ${storeCredit},
            ${newStoreCredit},
            ${"Course Purchase (Store Credit): " + course[0].name}
          )
        `;
				await tx`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (
            ${userId},
            'course_purchased',
            '🎓 Course Purchased!',
            ${"You have successfully purchased \"" + course[0].name + "\" using MWK " + price.toLocaleString() + " from your Learning Wallet."},
            '/dashboard/courses'
          )
        `;
			});
			return new Response(JSON.stringify({
				success: true,
				message: `✅ Course purchased using Learning Wallet! MWK ${price.toLocaleString()} deducted.`,
				usedStoreCredit: true,
				newStoreCredit: storeCredit - price,
				alreadyPurchased: false
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		if (balanceAvailable >= price) {
			await sql.begin(async (tx) => {
				const newBalance = balanceAvailable - price;
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
            balance_before,
            balance_after,
            description
          ) VALUES (
            ${wallet[0].id},
            'course_purchase_cash',
            ${price},
            ${balanceAvailable},
            ${newBalance},
            ${"Course Purchase (Cash): " + course[0].name}
          )
        `;
				await tx`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (
            ${userId},
            'course_purchased',
            '🎓 Course Purchased!',
            ${"You have successfully purchased \"" + course[0].name + "\" for MWK " + price.toLocaleString() + " from your Cash Wallet."},
            '/dashboard/courses'
          )
        `;
			});
			return new Response(JSON.stringify({
				success: true,
				message: `✅ Course purchased using Cash Wallet! MWK ${price.toLocaleString()} deducted.`,
				usedStoreCredit: false,
				newBalance: balanceAvailable - price,
				alreadyPurchased: false
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		return new Response(JSON.stringify({
			success: false,
			message: `Insufficient funds. You have MWK ${storeCredit.toLocaleString()} in Learning Wallet and MWK ${balanceAvailable.toLocaleString()} in Cash Wallet. Need MWK ${price.toLocaleString()}.`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("❌ Purchase course error:", err);
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
//#region \0virtual:astro:page:src/pages/api/courses/purchase@_@ts
var page = () => purchase_exports;
//#endregion
export { page };
