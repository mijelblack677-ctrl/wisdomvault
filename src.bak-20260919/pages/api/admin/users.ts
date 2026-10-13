export const prerender = false;
import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '0');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';

    // consent_given_at is added by migration 0003. Detect whether the column
    // exists so the users list keeps working before the migration is applied.
    let hasConsentColumn = true;
    try {
      await sql`SELECT consent_given_at FROM users LIMIT 1`;
    } catch {
      hasConsentColumn = false;
    }

    let query = hasConsentColumn
      ? sql`
          SELECT 
            id, full_name, email, phone, referral_code, 
            is_founding_member, founding_member_number,
            registration_year, payment_status, is_active,
            created_at, updated_at,
            total_gross_earnings, total_fees_paid, total_net_earnings,
            consent_given_at
          FROM users
          WHERE 1=1
        `
      : sql`
          SELECT 
            id, full_name, email, phone, referral_code, 
            is_founding_member, founding_member_number,
            registration_year, payment_status, is_active,
            created_at, updated_at,
            total_gross_earnings, total_fees_paid, total_net_earnings
          FROM users
          WHERE 1=1
        `;

    if (search) {
      query = sql`
        ${query} AND (
          full_name ILIKE ${'%' + search + '%'} OR 
          email ILIKE ${'%' + search + '%'} OR 
          phone ILIKE ${'%' + search + '%'}
        )
      `;
    }

    let users;
    if (limit > 0) {
      users = await sql`
        ${query}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      users = await sql`
        ${query}
        ORDER BY created_at DESC
      `;
    }

    const countResult = await sql`
      SELECT COUNT(*) as total FROM users
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      users,
      pagination: {
        total: parseInt(countResult[0]?.total || '0'),
        limit,
        offset
      }
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
