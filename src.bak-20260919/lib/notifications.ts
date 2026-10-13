// src/lib/notifications.ts
import { client } from '@db';

export interface Notification {
  id?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(notification: Notification) {
  const sql = client;
  try {
    const result = await sql`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        ${notification.userId},
        ${notification.type},
        ${notification.title},
        ${notification.message},
        ${notification.link || ''}
      )
      RETURNING id
    `;
    return result[0];
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function createNotifications(userIds: string[], notification: Omit<Notification, 'userId'>) {
  const sql = client;
  try {
    const results = [];
    for (const userId of userIds) {
      const result = await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          ${notification.type},
          ${notification.title},
          ${notification.message},
          ${notification.link || ''}
        )
        RETURNING id
      `;
      results.push(result[0]);
    }
    return results;
  } catch (error) {
    console.error('Failed to create notifications:', error);
    return [];
  }
}

export async function getNotifications(userId: string, limit: number = 50) {
  const sql = client;
  try {
    const notifications = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

export async function getUnreadCount(userId: string) {
  const sql = client;
  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ${userId} AND is_read = false
    `;
    return parseInt(result[0]?.count || '0');
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}

export async function markAsRead(userId: string, notificationIds?: string[]) {
  const sql = client;
  try {
    if (notificationIds && notificationIds.length > 0) {
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${userId} AND id = ANY(${notificationIds}::uuid[])
      `;
    } else {
      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${userId}
      `;
    }
    return true;
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return false;
  }
}
