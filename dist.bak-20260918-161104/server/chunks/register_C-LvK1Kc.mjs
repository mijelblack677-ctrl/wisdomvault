import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
//#region src/pages/api/auth/register.ts
var register_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const limit = checkRateLimit(`register:${clientIp(request)}`, 10, 6e4);
		if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
		const rawBody = await request.text();
		const { fullName, email, phone, password, referralCode, consent } = rawBody ? JSON.parse(rawBody) : {};
		if (!fullName || !email || !phone || !password) return new Response(JSON.stringify({
			success: false,
			message: "All fields are required: fullName, email, phone and password."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (consent !== true) return new Response(JSON.stringify({
			success: false,
			message: "You must agree to the consent and terms to create an account."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		if (email) {
			const emailTrim = String(email).trim();
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) return new Response(JSON.stringify({
				success: false,
				message: "Invalid email format"
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" }
			});
			if ((await sql`
        SELECT id FROM users WHERE email = ${emailTrim}
      `).length > 0) return new Response(JSON.stringify({
				success: false,
				message: "Email already registered"
			}), {
				status: 409,
				headers: { "Content-Type": "application/json" }
			});
		}
		let cleanPhone = null;
		if (phone) {
			cleanPhone = String(phone).replace(/\s/g, "");
			if (!cleanPhone.match(/^\+?[0-9]{10,15}$/)) return new Response(JSON.stringify({
				success: false,
				message: "Invalid phone number format"
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" }
			});
			if ((await sql`
        SELECT id FROM users WHERE phone = ${cleanPhone}
      `).length > 0) return new Response(JSON.stringify({
				success: false,
				message: "Phone number already registered"
			}), {
				status: 409,
				headers: { "Content-Type": "application/json" }
			});
		}
		const passwordHash = await bcrypt.hash(password, 10);
		const referralCodeGen = Math.random().toString(36).substring(2, 8).toUpperCase();
		let referrerId = null;
		let secondLevelReferrerId = null;
		let referrerIsFounding = false;
		if (referralCode) {
			const referrer = await sql`
        SELECT id, referred_by, is_founding_member FROM users WHERE referral_code = ${referralCode.toUpperCase()}
      `;
			if (referrer.length > 0) {
				referrerId = referrer[0].id;
				referrerIsFounding = referrer[0].is_founding_member || false;
				if (referrer[0].referred_by) secondLevelReferrerId = referrer[0].referred_by;
			}
		}
		const bonusConfig = await sql`
      SELECT config_key, config_value FROM platform_config
      WHERE config_key IN (
        'referral_bonus_standard',
        'referral_bonus_founding',
        'referral_bonus_renewal',
        'referral_bonus_second_level'
      )
    `;
		const bonusMap = {};
		for (const c of bonusConfig) bonusMap[c.config_key] = c.config_value;
		const standardBonus = parseFloat(bonusMap["referral_bonus_standard"] || "7000");
		const foundingBonus = parseFloat(bonusMap["referral_bonus_founding"] || "7000");
		const secondLevelBonus = parseFloat(bonusMap["referral_bonus_second_level"] || "1000");
		const level1Bonus = referrerIsFounding ? foundingBonus : standardBonus;
		const result = await sql.begin(async (tx) => {
			const user = (await tx`
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
          ${(/* @__PURE__ */ new Date()).getFullYear()},
          ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString()},
          'pending',
          true
        )
        RETURNING id, full_name, email, phone, referral_code
      `)[0];
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
            ${(/* @__PURE__ */ new Date()).getFullYear()},
            false,
            NOW()
          )
        `;
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
            ${"You referred " + fullName + "! Your bonus will be credited once they verify their account."},
            '/dashboard/invites'
          )
        `;
			}
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
            ${(/* @__PURE__ */ new Date()).getFullYear()},
            false,
            NOW()
          )
        `;
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
            ${"Someone referred by your referral (" + fullName + ") has joined! You'll earn MWK " + secondLevelBonus.toLocaleString() + " once they verify."},
            '/dashboard/invites'
          )
        `;
			}
			return user;
		});
		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 10080 * 60 * 1e3);
		await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${result.id}, ${token}, ${expiresAt})
    `;
		try {
			await sql`UPDATE users SET consent_given_at = NOW() WHERE id = ${result.id}`;
		} catch (err) {
			console.warn("Could not record consent timestamp:", err);
		}
		return new Response(JSON.stringify({
			success: true,
			message: "Registration successful! Please verify your account by completing payment.",
			user: {
				id: result.id,
				fullName: result.full_name,
				email: result.email,
				phone: result.phone,
				referralCode: result.referral_code
			},
			token
		}), {
			status: 201,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Registration error:", err);
		if (err.message && err.message.includes("duplicate key value")) {
			if (err.message.includes("wallets_user_id_unique")) return new Response(JSON.stringify({
				success: false,
				message: "Account already exists. Please login."
			}), {
				status: 409,
				headers: { "Content-Type": "application/json" }
			});
		}
		return new Response(JSON.stringify({
			success: false,
			message: err.message || "Registration failed. Please try again."
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/register@_@ts
var page = () => register_exports;
//#endregion
export { page };
