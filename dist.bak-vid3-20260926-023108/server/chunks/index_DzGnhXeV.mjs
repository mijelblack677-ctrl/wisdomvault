import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import "./db_BfPNFMjW.mjs";
import { i as markAsRead, n as getNotifications, r as getUnreadCount } from "./notifications_Cti0wzLw.mjs";
import { t as isAuthorizedUser } from "./auth-check_HAPvz2t0.mjs";
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
