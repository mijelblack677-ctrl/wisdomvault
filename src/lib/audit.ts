// src/lib/audit.ts
import { client } from '@db';

export async function logAuditEvent(event: {
  userId?: string;
  adminId?: string;
  action: string;
  details: any;
  ip?: string;
  userAgent?: string;
}) {
  const sql = client;
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id, admin_id, action, details, ip, user_agent, created_at
      ) VALUES (
        ${event.userId || null},
        ${event.adminId || null},
        ${event.action},
        ${JSON.stringify(event.details)},
        ${event.ip || null},
        ${event.userAgent || null},
        NOW()
      )
    `;
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
