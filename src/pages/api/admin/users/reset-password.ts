export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import bcrypt from 'bcryptjs';

export const PUT: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    // Verify admin session
    const sessions = await sql`
      SELECT * FROM admin_sessions 
      WHERE token = ${token} AND expires_at > NOW()
    `;
    
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { userId, newPassword, sendEmail } = body;

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID and new password are required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user details
    const user = await sql`
      SELECT id, full_name, email FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User not found' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the new password
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

    // Create notification for the user
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
        '🔐 Password Reset',
        'Your password has been reset by an administrator. If you did not request this, please contact support immediately.',
        '/dashboard/profile'
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Password reset successfully!',
      user: {
        id: user[0].id,
        full_name: user[0].full_name,
        email: user[0].email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin reset password error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
