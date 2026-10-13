export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../../lib/db/connection';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Rate limit per client IP — registration is the cheapest endpoint for a
    // scripted flood to burn CPU on (bcrypt hashing + referral writes per hit).
    const limit = checkRateLimit(`register:${clientIp(request)}`, 10, 60_000);
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfterSeconds);
    }

    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const { fullName, email, phone, password, referralCode, consent } = body;

    // Require fullName, email, phone and password (restore original behavior)
    if (!fullName || !email || !phone || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'All fields are required: fullName, email, phone and password.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Minimum length, enforced on the server.
    //
    // The register form checks this too, but that is only a convenience for the
    // honest user — the endpoint is reachable directly, and it previously
    // accepted "x" as a password. Every other password path in the app
    // (change-password, admin reset, vaultpro) already enforces 6; this brings
    // registration in line with them.
    if (typeof password !== 'string' || password.length < 6) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Password must be at least 6 characters long'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Require explicit consent — reject registrations that didn't agree to the
    // consent/terms popup (legal record for the platform).
    if (consent !== true) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You must agree to the consent and terms to create an account.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Validate email
    if (email) {
      const emailTrim = String(email).trim();
      // basic email regex
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(emailTrim)) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid email format' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      // Check if email already exists
      const existingEmail = await sql`
        SELECT id FROM users WHERE email = ${emailTrim}
      `;
      if (existingEmail.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Email already registered' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate phone
    let cleanPhone: string | null = null;
    if (phone) {
      cleanPhone = String(phone).replace(/\s/g, '');
      if (!cleanPhone.match(/^\+?[0-9]{10,15}$/)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid phone number format' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if phone already exists
      const existingPhone = await sql`
        SELECT id FROM users WHERE phone = ${cleanPhone}
      `;
      if (existingPhone.length > 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Phone number already registered' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate referral code
    const referralCodeGen = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Process referral if provided
    let referrerId = null;
    let secondLevelReferrerId = null;
    let referrerIsFounding = false;

    // Normalise before lookup: codes are stored upper-case, and one copied by
    // hand (or pasted out of WhatsApp) often carries stray whitespace.
    const submittedCode = typeof referralCode === 'string' ? referralCode.trim().toUpperCase() : '';

    // The cookie set by src/middleware.ts when the invite link was opened wins
    // over whatever the form posted. It is httpOnly and written by the server,
    // so the person being referred cannot delete or swap the code to deny their
    // referrer — that is the whole point of keeping it here rather than in the
    // form field, which is only a display convenience. The submitted value is
    // still honoured for direct signups that never followed a link.
    const cookieCode = (cookies.get('wv_ref')?.value || '').trim().toUpperCase();
    const incomingCode = cookieCode || submittedCode;

    if (incomingCode) {
      const referrer = await sql`
        SELECT id, referred_by, is_founding_member, phone, email, is_active
        FROM users WHERE referral_code = ${incomingCode}
      `;

      if (referrer.length === 0) {
        // A stale or mistyped code must not block a signup, but it must not pass
        // silently either — otherwise the referral is lost with no trace to
        // investigate when a referrer asks why they were not credited.
        console.warn('Registration: unknown referral code supplied:', incomingCode);
      } else {
        const referrerRow = referrer[0];

        // ── SELF-REFERRAL GUARD ──────────────────────────────────────────────
        // The bonus exists to reward bringing somebody *else* in. Comparing the
        // signup's own phone and email against the referrer's stops a user from
        // opening their own invite link with a second account and paying
        // themselves (and skimming the level-2 bonus on top).
        //
        // Email is compared case-insensitively because the unique index on
        // users(email) is case-sensitive under this database's C.UTF-8
        // collation, so "A@x.com" and "a@x.com" are two separate rows.
        // Phone is compared with punctuation stripped, since "+265991234567",
        // "0991234567" and "265991234567" are all distinct strings to Postgres
        // but the same subscriber.
        const digits = (v: unknown) => String(v ?? '').replace(/[^0-9]/g, '');
        const selfPhone = !!cleanPhone && !!referrerRow.phone && digits(referrerRow.phone) === digits(cleanPhone);
        const selfEmail = !!email && !!referrerRow.email &&
          String(referrerRow.email).trim().toLowerCase() === String(email).trim().toLowerCase();

        if (selfPhone || selfEmail) {
          console.warn('Registration: blocked self-referral attempt with code', incomingCode);
          return new Response(JSON.stringify({
            success: false,
            message: 'You cannot use your own referral code to register.'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (referrerRow.is_active === false) {
          // Never attribute a signup to a deactivated account — that would keep
          // paying bonuses to someone who can no longer use the platform.
          console.warn('Registration: referral code belongs to an inactive account:', incomingCode);
        } else {
          referrerId = referrerRow.id;
          referrerIsFounding = referrerRow.is_founding_member || false;
          // Level 2: credit whoever referred the referrer.
          if (referrerRow.referred_by) {
            secondLevelReferrerId = referrerRow.referred_by;
          }
        }
      }
    }

    // Read referral bonus amounts from platform_config (fallbacks)
    const bonusConfig = await sql`
      SELECT config_key, config_value FROM platform_config
      WHERE config_key IN (
        'referral_bonus_standard',
        'referral_bonus_founding',
        'referral_bonus_renewal',
        'referral_bonus_second_level'
      )
    `;
    const bonusMap: Record<string, string> = {};
    for (const c of bonusConfig) {
      bonusMap[c.config_key] = c.config_value;
    }
    const standardBonus = parseFloat(bonusMap['referral_bonus_standard'] || '7000');
    const foundingBonus = parseFloat(bonusMap['referral_bonus_founding'] || '7000');
    const secondLevelBonus = parseFloat(bonusMap['referral_bonus_second_level'] || '1000');
    const level1Bonus = referrerIsFounding ? foundingBonus : standardBonus;

    // Use a transaction
    const result = await sql.begin(async (tx: any) => {
      // 1. Insert user
      const userResult = await tx`
        INSERT INTO users (
          full_name,
          email,
          phone,
          password_hash,
          referral_code,
          referred_by,
          registration_year,
          renewal_due_date,
          payment_status,
          is_active
        ) VALUES (
          ${fullName},
          ${email},
          ${cleanPhone},
          ${passwordHash},
          ${referralCodeGen},
          ${referrerId},
          ${new Date().getFullYear()},
          ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()},
          'pending',
          true
        )
        RETURNING id, full_name, email, phone, referral_code
      `;

      const user = userResult[0];

      // 2. Create wallet
      await tx`
        INSERT INTO wallets (
          user_id,
          balance_available,
          gross_earnings,
          gross_earnings_total,
          total_withdrawn,
          fees_paid,
          store_credit,
          updated_at
        ) VALUES (
          ${user.id},
          0,
          0,
          0,
          0,
          0,
          0,
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          updated_at = NOW()
      `;

      // 3. Create Level 1 referral (direct referrer)
      if (referrerId) {
        await tx`
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
            ${user.id},
            'first_level',
            ${level1Bonus},
            0,
            ${level1Bonus},
            ${new Date().getFullYear()},
            false,
            NOW()
          )
        `;

        // Notify Level 1 referrer
        await tx`
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link
          ) VALUES (
            ${referrerId},
            'referral_created',
            '🎉 New Referral!',
            ${'You referred ' + fullName + '! Your bonus will be credited once they verify their account.'},
            '/dashboard/invites'
          )
        `;
      }

      // 4. Create Level 2 referral
      if (secondLevelReferrerId) {
        await tx`
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
            ${secondLevelReferrerId},
            ${user.id},
            'second_level',
            ${secondLevelBonus},
            0,
            ${secondLevelBonus},
            ${new Date().getFullYear()},
            false,
            NOW()
          )
        `;

        // Notify Level 2 referrer
        await tx`
          INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link
          ) VALUES (
            ${secondLevelReferrerId},
            'second_level_referral_created',
            '🌟 New Second-Level Referral!',
            ${'Someone referred by your referral (' + fullName + ') has joined! You\'ll earn MWK ' + secondLevelBonus.toLocaleString() + ' once they verify.'},
            '/dashboard/invites'
          )
        `;
      }

      return user;
    });

    // Create a session token right away (mirrors login) so the new user can
    // use authenticated endpoints without having to log in separately.
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${result.id}, ${token}, ${expiresAt})
    `;

    // Record the moment consent was given for legal/audit purposes.
    // Best-effort: if the consent_given_at column hasn't been migrated yet,
    // log a warning instead of failing the whole registration.
    try {
      await sql`UPDATE users SET consent_given_at = NOW() WHERE id = ${result.id}`;
    } catch (err) {
      console.warn('Could not record consent timestamp:', err);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Registration successful! Please verify your account by completing payment.',
      user: {
        id: result.id,
        fullName: result.full_name,
        email: result.email,
        phone: result.phone,
        referralCode: result.referral_code
      },
      token: token,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Registration error:', err);
    
    if (err.message && err.message.includes('duplicate key value')) {
      if (err.message.includes('wallets_user_id_unique')) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Account already exists. Please login.' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message || 'Registration failed. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
