import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { n as readJson, r as requireVaultPro, t as jsonResponse } from "./vaultproAuth_q5zMPqoV.mjs";
import bcrypt from "bcryptjs";
//#region src/pages/api/vaultpro/user-actions.ts
var user_actions_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* POST /api/vaultpro/user-actions
*
* Body: { action, ... }
*   action = 'add_funds'        | { userId, amount, notes? }         → balance_available
*   action = 'add_store_credit' | { userId, amount, notes? }         → store_credit
*   action = 'verify'           | { userId }
*   action = 'unverify'         | { userId }
*   action = 'toggle_active'    | { userId }
*   action = 'reset_password'   | { userId, newPassword }
*   action = 'notify'           | { userId, title, message, link? }
*   action = 'create_user'      | { fullName, email, phone, password, referralCode? }
*   action = 'delete_user'      | { userId }
*/
var POST = async ({ request }) => {
	try {
		const admin = await requireVaultPro(request);
		const sql = client;
		const body = await readJson(request);
		const { action } = body;
		if (!action) return jsonResponse({
			success: false,
			message: "action required"
		}, 400);
		if (action === "add_funds") {
			const { userId, amount, notes } = body;
			if (!userId || !amount || amount <= 0) return jsonResponse({
				success: false,
				message: "userId and positive amount required"
			}, 400);
			const amt = parseFloat(amount);
			const walletRows = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`;
			if (walletRows.length === 0) return jsonResponse({
				success: false,
				message: "Wallet not found"
			}, 404);
			const wallet = walletRows[0];
			const before = parseFloat(wallet.balance_available || 0);
			const after = before + amt;
			await sql`
        UPDATE wallets
        SET balance_available = ${after},
            gross_earnings = ${parseFloat(wallet.gross_earnings || 0) + amt},
            gross_earnings_total = ${parseFloat(wallet.gross_earnings_total || 0) + amt},
            updated_at = NOW()
        WHERE id = ${wallet.id}
      `;
			await sql`
        UPDATE users
        SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + ${amt},
            total_net_earnings = COALESCE(total_net_earnings, 0) + ${amt}
        WHERE id = ${userId}
      `;
			await sql`
        INSERT INTO transactions (wallet_id, transaction_type, amount, fee_deducted, net_amount,
                                  balance_before, balance_after, description)
        VALUES (${wallet.id}, 'admin_deposit', ${amt}, 0, ${amt}, ${before}, ${after},
                ${"Admin deposit: MWK " + amt.toLocaleString() + (notes ? " - " + notes : "")})
      `;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'wallet_credit', '💰 Admin Deposit!',
                ${"MWK " + amt.toLocaleString() + " has been credited to your wallet by admin." + (notes ? " Note: " + notes : "")},
                '/dashboard/wallet')
      `;
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_add_funds',
                ${JSON.stringify({
				userId,
				amount: amt,
				notes,
				newBalance: after
			})}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: `MWK ${amt.toLocaleString()} added`,
				newBalance: after
			});
		}
		if (action === "add_store_credit") {
			const { userId, amount, notes } = body;
			if (!userId || !amount || amount <= 0) return jsonResponse({
				success: false,
				message: "userId and positive amount required"
			}, 400);
			const amt = parseFloat(amount);
			const walletRows = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`;
			if (walletRows.length === 0) return jsonResponse({
				success: false,
				message: "Wallet not found"
			}, 404);
			const wallet = walletRows[0];
			const before = parseFloat(wallet.store_credit || 0);
			const after = before + amt;
			await sql`
        UPDATE wallets
        SET store_credit = ${after}, updated_at = NOW()
        WHERE id = ${wallet.id}
      `;
			await sql`
        INSERT INTO transactions (wallet_id, transaction_type, amount, fee_deducted, net_amount,
                                  balance_before, balance_after, description)
        VALUES (${wallet.id}, 'store_credit', ${amt}, 0, ${amt}, ${before}, ${after},
                ${"Store credit added: MWK " + amt.toLocaleString() + (notes ? " - " + notes : "")})
      `;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'store_credit', '📚 Store Credit Added!',
                ${"MWK " + amt.toLocaleString() + " store credit has been added to your account." + (notes ? " Note: " + notes : "")},
                '/dashboard')
      `;
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_add_store_credit',
                ${JSON.stringify({
				userId,
				amount: amt,
				notes,
				newStoreCredit: after
			})}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: `MWK ${amt.toLocaleString()} store credit added`,
				newStoreCredit: after
			});
		}
		if (action === "verify" || action === "unverify") {
			const { userId } = body;
			if (!userId) return jsonResponse({
				success: false,
				message: "userId required"
			}, 400);
			const newStatus = action === "verify" ? "verified" : "pending";
			await sql`UPDATE users SET payment_status = ${newStatus}, updated_at = NOW() WHERE id = ${userId}`;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'verification',
                ${action === "verify" ? "✅ Account Verified!" : "⏸️ Verification Reverted"},
                ${action === "verify" ? "Congratulations! Your account has been verified by the SuperAdmin." : "Your account verification status was reverted by the SuperAdmin."},
                '/dashboard')
      `;
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_' + ${action}, ${JSON.stringify({ userId })}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: `User ${newStatus}`
			});
		}
		if (action === "toggle_active") {
			const { userId } = body;
			if (!userId) return jsonResponse({
				success: false,
				message: "userId required"
			}, 400);
			const rows = await sql`SELECT is_active FROM users WHERE id = ${userId}`;
			if (rows.length === 0) return jsonResponse({
				success: false,
				message: "User not found"
			}, 404);
			const newActive = !rows[0].is_active;
			await sql`UPDATE users SET is_active = ${newActive}, updated_at = NOW() WHERE id = ${userId}`;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'account_status',
                ${newActive ? "✅ Account Re-activated" : "⛔ Account Deactivated"},
                ${newActive ? "Your account has been re-activated by the SuperAdmin." : "Your account has been deactivated by the SuperAdmin."},
                '/dashboard')
      `;
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_toggle_active', ${JSON.stringify({
				userId,
				isActive: newActive
			})}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: `User is now ${newActive ? "active" : "inactive"}`,
				isActive: newActive
			});
		}
		if (action === "reset_password") {
			const { userId, newPassword } = body;
			if (!userId || !newPassword) return jsonResponse({
				success: false,
				message: "userId and newPassword required"
			}, 400);
			if (newPassword.length < 6) return jsonResponse({
				success: false,
				message: "Password must be at least 6 characters"
			}, 400);
			await sql`UPDATE users SET password_hash = ${await bcrypt.hash(newPassword, 10)}, updated_at = NOW() WHERE id = ${userId}`;
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'system', '🔐 Password Reset',
                'Your password has been reset by the SuperAdmin. If you did not request this, contact support immediately.',
                '/dashboard/profile')
      `;
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_reset_password', ${JSON.stringify({ userId })}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: "Password reset successfully"
			});
		}
		if (action === "notify") {
			const { userId, title, message, link } = body;
			if (!userId || !title || !message) return jsonResponse({
				success: false,
				message: "userId, title and message required"
			}, 400);
			await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (${userId}, 'admin_message', ${title}, ${message}, ${link || "/dashboard"})
      `;
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_notify', ${JSON.stringify({
				userId,
				title
			})}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: "Notification sent"
			});
		}
		if (action === "create_user") {
			const { fullName, email, phone, password, referralCode } = body;
			if (!fullName || !email || !phone || !password) return jsonResponse({
				success: false,
				message: "fullName, email, phone and password required"
			}, 400);
			if (password.length < 6) return jsonResponse({
				success: false,
				message: "Password must be at least 6 characters"
			}, 400);
			if ((await sql`SELECT id FROM users WHERE email = ${email}`).length > 0) return jsonResponse({
				success: false,
				message: "Email already registered"
			}, 409);
			if ((await sql`SELECT id FROM users WHERE phone = ${phone}`).length > 0) return jsonResponse({
				success: false,
				message: "Phone already registered"
			}, 409);
			const passwordHash = await bcrypt.hash(password, 10);
			const referralCodeGen = Math.random().toString(36).substring(2, 8).toUpperCase();
			let referrerId = null;
			if (referralCode) {
				const ref = await sql`SELECT id FROM users WHERE referral_code = ${referralCode.toUpperCase()}`;
				if (ref.length > 0) referrerId = ref[0].id;
			}
			const result = await sql.begin(async (tx) => {
				const inserted = await tx`
          INSERT INTO users (
            full_name, email, phone, password_hash, referral_code, referred_by,
            registration_year, renewal_due_date, payment_status, is_active
          ) VALUES (
            ${fullName}, ${email}, ${phone}, ${passwordHash}, ${referralCodeGen}, ${referrerId},
            ${(/* @__PURE__ */ new Date()).getFullYear()},
            ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString()},
            'pending', true
          )
          RETURNING id, full_name, email, phone, referral_code
        `;
				await tx`
          INSERT INTO wallets (user_id, balance_available, gross_earnings, gross_earnings_total, total_withdrawn, fees_paid, store_credit, updated_at)
          VALUES (${inserted[0].id}, 0, 0, 0, 0, 0, 0, NOW())
          ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
        `;
				if (referrerId) await tx`
            INSERT INTO referrals (referrer_id, referred_id, referral_type, bonus_amount, fee_deducted, net_amount, registration_year, is_paid, created_at)
            VALUES (${referrerId}, ${inserted[0].id}, 'first_level', 7000, 0, 7000, ${(/* @__PURE__ */ new Date()).getFullYear()}, false, NOW())
          `;
				return inserted[0];
			});
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_create_user', ${JSON.stringify({
				email,
				phone
			})}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: "User created",
				user: result
			}, 201);
		}
		if (action === "delete_user") {
			const { userId } = body;
			if (!userId) return jsonResponse({
				success: false,
				message: "userId required"
			}, 400);
			const userRows = await sql`SELECT id, full_name, email FROM users WHERE id = ${userId}`;
			if (userRows.length === 0) return jsonResponse({
				success: false,
				message: "User not found"
			}, 404);
			const tables = await sql`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
			const existing = new Set(tables.map((t) => t.tablename));
			const dependent = [
				["course_progress", "user_id"],
				["user_sponsored_views", "user_id"],
				["user_content_purchases", "user_id"],
				["user_premium_packs", "user_id"],
				["course_purchases", "user_id"],
				["notifications", "user_id"],
				["referral_earnings", "user_id"],
				["fee_chunks", "user_id"],
				["payment_proofs", "user_id"],
				["audit_logs", "user_id"],
				["earn_content_views", "user_id"],
				["password_reset_tokens", "user_id"],
				["user_sessions", "user_id"]
			];
			await sql.begin(async (tx) => {
				for (const [table, col] of dependent) if (existing.has(table)) try {
					await tx`DELETE FROM ${tx(table)} WHERE ${tx(col)} = ${userId}`;
				} catch {}
				try {
					await tx`
            DELETE FROM transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ${userId})
          `;
				} catch {}
				try {
					await tx`
            DELETE FROM withdrawals WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ${userId})
          `;
				} catch {}
				try {
					await tx`DELETE FROM referrals WHERE referrer_id = ${userId} OR referred_id = ${userId}`;
				} catch {}
				try {
					await tx`DELETE FROM wallets WHERE user_id = ${userId}`;
				} catch {}
				await tx`DELETE FROM users WHERE id = ${userId}`;
			});
			await sql`
        INSERT INTO audit_logs (admin_id, action, details)
        VALUES (${admin.id}, 'vaultpro_delete_user', ${JSON.stringify({
				userId,
				email: userRows[0].email
			})}::jsonb)
      `;
			return jsonResponse({
				success: true,
				message: `User deleted: ${userRows[0].full_name}`
			});
		}
		return jsonResponse({
			success: false,
			message: "Unknown action: " + action
		}, 400);
	} catch (error) {
		if (error instanceof Response) return error;
		console.error("VaultPro user-actions error:", error);
		return jsonResponse({
			success: false,
			message: error.message
		}, 500);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vaultpro/user-actions@_@ts
var page = () => user_actions_exports;
//#endregion
export { page };
