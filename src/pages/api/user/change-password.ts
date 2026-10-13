export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';
import bcrypt from 'bcryptjs';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID, current password, and new password are required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Unauthorized' 
      }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Get user with current password
    const user = await sql`
      SELECT id, password_hash FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User not found' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user[0].password_hash);
    if (!validPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Current password is incorrect' 
      }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await sql`
      UPDATE users 
      SET 
        password_hash = ${passwordHash},
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    // Create notification
    await sql`
      INSERT INTO notifications (
        user_id, 
        type, 
        title, 
        message, 
        link
      ) VALUES (
        ${userId},
        'system',
        '🔐 Password Changed',
        'Your password was successfully changed. If you did not make this change, please contact support immediately.',
        '/dashboard/profile'
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Password changed successfully!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Change password error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
