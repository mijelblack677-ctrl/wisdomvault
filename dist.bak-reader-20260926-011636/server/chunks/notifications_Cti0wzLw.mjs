import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
//#region src/lib/notifications.ts
async function createNotification(notification) {
	const sql = client;
	try {
		return (await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        ${notification.userId},
        ${notification.type},
        ${notification.title},
        ${notification.message},
        ${notification.link || ""}
      )
      RETURNING id
    `)[0];
	} catch (error) {
		console.error("Failed to create notification:", error);
		return null;
	}
}
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
export { markAsRead as i, getNotifications as n, getUnreadCount as r, createNotification as t };
