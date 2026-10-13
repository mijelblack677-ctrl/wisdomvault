export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, packId } = body;

    if (!userId || !packId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID and Pack ID required' 
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

    const sql = client;

    // Get pack details
    const pack = await sql`
      SELECT id, name, price, is_free FROM premium_packs 
      WHERE id = ${packId} AND is_active = true
    `;

    if (pack.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Course not found' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already purchased
    const existing = await sql`
      SELECT id FROM course_purchases 
      WHERE user_id = ${userId} AND pack_id = ${packId}
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You already have access to this course' 
      }), {
        status: 409, headers: { 'Content-Type': 'application/json' }
      });
    }

    // If free course, grant immediate access
    if (pack[0].is_free) {
      await sql`
        INSERT INTO course_purchases (user_id, pack_id, is_free, amount_paid)
        VALUES (${userId}, ${packId}, true, 0)
      `;

      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'course_access',
          '📚 Free Course Access',
          ${'You now have access to "' + pack[0].name + '"! Start learning today.'},
          '/dashboard/courses'
        )
      `;

      return new Response(JSON.stringify({
        success: true,
        message: '✅ Course access granted! Start learning now.',
        isFree: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For paid courses, check wallet balance
    const wallet = await sql`
      SELECT id, balance_available FROM wallets WHERE user_id = ${userId}
    `;

    if (wallet.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Wallet not found' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const price = parseFloat(pack[0].price || 0);
    const balance = parseFloat(wallet[0].balance_available || 0);

    if (balance < price) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Insufficient balance. You need MWK ${price.toLocaleString()} but you have MWK ${balance.toLocaleString()}` 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process payment (deduct from wallet)
    await sql.begin(async (tx: any) => {
      // Deduct from wallet
      const newBalance = balance - price;
      await tx`
        UPDATE wallets 
        SET balance_available = ${newBalance},
            updated_at = NOW()
        WHERE id = ${wallet[0].id}
      `;

      // Record purchase
      await tx`
        INSERT INTO course_purchases (user_id, pack_id, is_free, amount_paid)
        VALUES (${userId}, ${packId}, false, ${price})
      `;

      // Record transaction
      await tx`
        INSERT INTO transactions (
          wallet_id,
          transaction_type,
          amount,
          fee_deducted,
          net_amount,
          balance_before,
          balance_after,
          description
        ) VALUES (
          ${wallet[0].id},
          'course_purchase',
          ${price},
          0,
          ${price},
          ${balance},
          ${newBalance},
          ${'Course Purchase: ' + pack[0].name}
        )
      `;

      // Notification
      await tx`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'course_purchased',
          '🎓 Course Purchased!',
          ${'You have successfully purchased "' + pack[0].name + '" for MWK ' + price.toLocaleString() + '. Start learning now!'},
          '/dashboard/courses'
        )
      `;
    });

    return new Response(JSON.stringify({
      success: true,
      message: `✅ Course purchased! MWK ${price.toLocaleString()} deducted from your wallet.`,
      price: price,
      newBalance: balance - price
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Purchase course error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
