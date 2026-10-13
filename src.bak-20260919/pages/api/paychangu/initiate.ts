export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

/**
 * POST /api/paychangu/initiate
 * 
 * Initiates a PayChangu Standard Checkout payment for the registration fee.
 * Returns a checkout_url the user should be redirected to.
 * 
 * Body: { userId: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit per client IP — each call can create a PayChangu checkout.
    const limit = checkRateLimit(`paychangu-initiate:${clientIp(request)}`, 10, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the session token belongs to the claimed user
    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Get user details
    const users = await sql`
      SELECT id, full_name, email, phone, payment_status
      FROM users WHERE id = ${userId}
    `;

    if (users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.payment_status === 'verified') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Your account is already verified!'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for any pending PayChangu transaction
    const pendingTx = await sql`
      SELECT id, tx_ref, status, checkout_url, created_at
      FROM paychangu_transactions
      WHERE user_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `;

    if (pendingTx.length > 0) {
      // Still valid if created within the last 30 minutes (compare against
      // created_at — previously the UUID id was parsed as a date → NaN → the
      // reuse never fired and every Pay click created a duplicate checkout).
      const txCreated = new Date(pendingTx[0].created_at).getTime();
      const txAge = Date.now() - txCreated;
      if (txAge < 30 * 60 * 1000 && pendingTx[0].checkout_url) {
        return new Response(JSON.stringify({
          success: true,
          checkoutUrl: pendingTx[0].checkout_url,
          txRef: pendingTx[0].tx_ref,
          message: 'You have a pending payment. Redirecting to checkout...'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate unique transaction reference
    const txRef = `WV-${userId.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Registration fee: MWK 10,000 + MWK 800 agent fee = MWK 10,800
    const amount = 10800;
    const currency = 'MWK';

    // Build URLs
    const baseUrl = new URL(request.url).origin;
    const callbackUrl = `${baseUrl}/api/paychangu/callback`;
    const returnUrl = `${baseUrl}/billing?status=return&tx_ref=${txRef}`;

    // Get user's name parts
    const nameParts = (user.full_name || '').split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Initiate PayChangu payment
    const paychanguResponse = await fetch('https://api.paychangu.com/payment', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        callback_url: callbackUrl,
        return_url: returnUrl,
        tx_ref: txRef,
        customization: {
          title: 'Wisdom Vault - Registration',
          description: 'Registration MWK 10,000 + Agent fee MWK 800 = MWK 10,800 (one-time)'
        },
        meta: {
          userId: user.id,
          type: 'registration'
        }
      })
    });

    const paychanguData = await paychanguResponse.json();

    console.log('PayChangu initiate response:', JSON.stringify(paychanguData, null, 2));

    if (paychanguData.status === 'success' && paychanguData.data?.checkout_url) {
      // Store transaction reference in database
      await sql`
        INSERT INTO paychangu_transactions (
          user_id, tx_ref, amount, currency, status, checkout_url
        ) VALUES (
          ${userId}, ${txRef}, ${amount}, ${currency}, 'pending', ${paychanguData.data.checkout_url}
        )
      `;

      return new Response(JSON.stringify({
        success: true,
        checkoutUrl: paychanguData.data.checkout_url,
        txRef,
        message: 'Payment session created successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('PayChangu initiation failed:', paychanguData);
      return new Response(JSON.stringify({
        success: false,
        message: paychanguData.message || 'Failed to create payment session. Please try again.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const err = error as Error;
    console.error('PayChangu initiate error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message || 'Payment initiation failed. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
