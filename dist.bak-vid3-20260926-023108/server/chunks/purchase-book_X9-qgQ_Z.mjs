import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
//#region src/pages/api/content/purchase-book.ts
var purchase_book_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const { userId, contentId, price } = await request.json();
		if (!userId || !contentId || !price) return new Response(JSON.stringify({
			success: false,
			message: "User ID, Content ID, and price required"
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
		const content = await sql`
      SELECT id, title, is_premium, price FROM content_items 
      WHERE id = ${contentId} AND is_premium = true
    `;
		if (content.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Content not found or not premium"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		if ((await sql`
      SELECT id FROM user_content_purchases 
      WHERE user_id = ${userId} AND content_id = ${contentId}
    `).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "You already own this content"
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const wallet = await sql`
      SELECT id, store_credit FROM wallets WHERE user_id = ${userId}
    `;
		if (wallet.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Wallet not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const priceNum = parseFloat(price);
		const storeCredit = parseFloat(wallet[0].store_credit || 0);
		if (storeCredit < priceNum) return new Response(JSON.stringify({
			success: false,
			message: `Insufficient Learning Wallet balance. You need MWK ${priceNum.toLocaleString()}`
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		await sql.begin(async (tx) => {
			const newStoreCredit = storeCredit - priceNum;
			await tx`
        UPDATE wallets 
        SET store_credit = ${newStoreCredit},
            updated_at = NOW()
        WHERE id = ${wallet[0].id}
      `;
			await tx`
        INSERT INTO user_content_purchases (user_id, content_id, amount_paid)
        VALUES (${userId}, ${contentId}, ${priceNum})
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
          'content_purchase',
          ${priceNum},
          ${storeCredit},
          ${newStoreCredit},
          ${"Book Purchase: " + content[0].title}
        )
      `;
			await tx`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'content_purchased',
          '📚 Book Purchased!',
          ${"You have successfully purchased \"" + content[0].title + "\" for MWK " + priceNum.toLocaleString() + " from your Learning Wallet."},
          '/dashboard/library'
        )
      `;
		});
		return new Response(JSON.stringify({
			success: true,
			message: `✅ Book purchased! MWK ${priceNum.toLocaleString()} deducted.`,
			newStoreCredit: storeCredit - priceNum
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Purchase book error:", err);
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
//#region \0virtual:astro:page:src/pages/api/content/purchase-book@_@ts
var page = () => purchase_book_exports;
//#endregion
export { page };
