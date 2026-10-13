export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, contentId, price } = body;

    if (!userId || !contentId || !price) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID, Content ID, and price required' 
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

    // Check if content exists and is premium
    const content = await sql`
      SELECT id, title, is_premium, price FROM content_items 
      WHERE id = ${contentId} AND is_premium = true
    `;

    if (content.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Content not found or not premium' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already purchased
    const existing = await sql`
      SELECT id FROM user_content_purchases 
      WHERE user_id = ${userId} AND content_id = ${contentId}
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You already own this content' 
      }), {
        status: 409, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get wallet
    const wallet = await sql`
      SELECT id, store_credit FROM wallets WHERE user_id = ${userId}
    `;

    if (wallet.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Wallet not found' 
      }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const priceNum = parseFloat(price);
    const storeCredit = parseFloat(wallet[0].store_credit || 0);

    if (storeCredit < priceNum) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Insufficient Learning Wallet balance. You need MWK ${priceNum.toLocaleString()}` 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process purchase - EXACT same pattern as course purchase
    await sql.begin(async (tx: any) => {
      const newStoreCredit = storeCredit - priceNum;

      // Update wallet - deduct from store_credit
      await tx`
        UPDATE wallets 
        SET store_credit = ${newStoreCredit},
            updated_at = NOW()
        WHERE id = ${wallet[0].id}
      `;

      // Record purchase
      await tx`
        INSERT INTO user_content_purchases (user_id, content_id, amount_paid)
        VALUES (${userId}, ${contentId}, ${priceNum})
      `;

      // Record transaction
      await tx`
        INSERT INTO transactions (
          wallet_id,
          transaction_type,
          amount,
          balance_before,
          balance_after,
          description
        ) VALUES (
          ${wallet[0].id},
          'content_purchase',
          ${priceNum},
          ${storeCredit},
          ${newStoreCredit},
          ${'Book Purchase: ' + content[0].title}
        )
      `;

      // Notification
      await tx`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'content_purchased',
          '📚 Book Purchased!',
          ${'You have successfully purchased "' + content[0].title + '" for MWK ' + priceNum.toLocaleString() + ' from your Learning Wallet.'},
          '/dashboard/library'
        )
      `;
    });

    return new Response(JSON.stringify({
      success: true,
      message: `✅ Book purchased! MWK ${priceNum.toLocaleString()} deducted.`,
      newStoreCredit: storeCredit - priceNum
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Purchase book error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
