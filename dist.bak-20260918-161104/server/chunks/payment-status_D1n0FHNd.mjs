import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/user/payment-status.ts
var payment_status_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const userId = new URL(request.url).searchParams.get("userId");
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const userResult = await client`
      SELECT payment_status FROM users WHERE id = ${userId}
    `;
		if (userResult.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "User not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		return new Response(JSON.stringify({
			success: true,
			paymentStatus: userResult[0].payment_status || "pending"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Payment status error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message,
			error: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/user/payment-status@_@ts
var page = () => payment_status_exports;
//#endregion
export { page };
