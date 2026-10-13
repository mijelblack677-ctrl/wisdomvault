import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { t as isAuthorizedUser } from "./auth-check_CHLkWxRW.mjs";
//#region src/lib/notifications.ts
async function getNotifications(userId, limit = 50) {
	const sql = client;
	try {
		return await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
	} catch (error) {
		console.error("Failed to get notifications:", error);
		return [];
	}
}
async function getUnreadCount(userId) {
	const sql = client;
	try {
		const result = await sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ${userId} AND is_read = false
    `;
		return parseInt(result[0]?.count || "0");
	} catch (error) {
		console.error("Failed to get unread count:", error);
		return 0;
	}
}
async function markAsRead(userId, notificationIds) {
	const sql = client;
	try {
		if (notificationIds && notificationIds.length > 0) await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${userId} AND id = ANY(${notificationIds}::uuid[])
      `;
		else await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${userId}
      `;
		return true;
	} catch (error) {
		console.error("Failed to mark notifications as read:", error);
		return false;
	}
}
//#endregion
//#region src/pages/api/notifications/index.ts
var notifications_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	PUT: () => PUT,
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
		if (!await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const notifications = await getNotifications(userId);
		const unreadCount = await getUnreadCount(userId);
		return new Response(JSON.stringify({
			success: true,
			notifications: notifications || [],
			unreadCount
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Notifications GET error:", err);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var PUT = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const { userId, notificationIds } = JSON.parse(rawBody);
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID required"
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
		const success = await markAsRead(userId, notificationIds);
		return new Response(JSON.stringify({
			success,
			message: success ? "Notifications marked as read" : "Failed to mark notifications as read"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Notifications PUT error:", err);
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
//#region \0virtual:astro:page:src/pages/api/notifications/index@_@ts
var page = () => notifications_exports;
//#endregion
export { page };
