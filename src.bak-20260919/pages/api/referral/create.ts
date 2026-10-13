export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { referrerId, referredId } = body;

    if (!referrerId || !referredId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Referrer ID and Referred ID required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent self-referral
    if (referrerId === referredId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Cannot refer yourself' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Check if referral already exists
    const existing = await sql`
      SELECT id FROM referrals 
      WHERE referrer_id = ${referrerId} AND referred_id = ${referredId}
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Referral already recorded' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if referrer exists (also fetch founding member status)
    const referrerCheck = await sql`
      SELECT id, is_founding_member FROM users WHERE id = ${referrerId}
    `;

    if (referrerCheck.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Referrer not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Read the Level 1 bonus from platform_config (founding members earn more)
    const bonusConfig = await sql`
      SELECT config_key, config_value FROM platform_config
      WHERE config_key IN ('referral_bonus_standard', 'referral_bonus_founding')
    `;
    const bonusMap: Record<string, string> = {};
    for (const c of bonusConfig) {
      bonusMap[c.config_key] = c.config_value;
    }
    const standardBonus = parseFloat(bonusMap['referral_bonus_standard'] || '7000');
    const foundingBonus = parseFloat(bonusMap['referral_bonus_founding'] || '7000');
    const level1Bonus = referrerCheck[0].is_founding_member ? foundingBonus : standardBonus;

    // ✅ Create referral with correct type and bonus amount
    const referralResult = await sql`
      INSERT INTO referrals (
        referrer_id, 
        referred_id, 
        referral_type, 
        bonus_amount, 
        fee_deducted, 
        net_amount, 
        registration_year, 
        is_paid,
        created_at
      ) VALUES (
        ${referrerId}, 
        ${referredId}, 
        'first_level',  -- ✅ Use 'first_level' not 'registration'
        ${level1Bonus},  -- ✅ Bonus from platform_config
        0, 
        ${level1Bonus}, 
        ${new Date().getFullYear()}, 
        false,
        NOW()
      )
      RETURNING id
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Referral recorded. Bonus will be credited after user verification.',
      referralId: referralResult[0].id,
      status: 'pending_verification'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Referral creation error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
