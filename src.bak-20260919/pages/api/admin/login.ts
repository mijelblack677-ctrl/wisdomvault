export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../../lib/db/connection';
import bcrypt from 'bcryptjs';

export const POST: APIRoute = async ({ request }) => {
  const sql = client;

  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // ✅ Support both 'identifier' and 'email' for backward compatibility
    const identifier = body.identifier || body.email;
    const password = body.password;

    if (!identifier || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email/Phone and password required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Check if identifier is email or phone
    const isEmail = identifier.includes('@') && identifier.includes('.');
    
    let admins;
    if (isEmail) {
      admins = await sql`
        SELECT * FROM admin_users 
        WHERE email = ${identifier} AND is_active = true
      `;
    } else {
      // Search by username (admin_users table doesn't have phone column)
      admins = await sql`
        SELECT * FROM admin_users 
        WHERE username = ${identifier} AND is_active = true
      `;
    }
    
    if (admins.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid credentials' 
      }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const admin = admins[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    
    if (!valid) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid credentials' 
      }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO admin_sessions (admin_id, token, expires_at)
      VALUES (${admin.id}, ${token}, ${expiresAt.toISOString()})
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      admin: { 
        id: admin.id, 
        username: admin.username, 
        email: admin.email
      },
      token,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin login error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
