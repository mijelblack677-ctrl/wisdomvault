export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

/**
 * GET /api/admin/system-stats
 * 
 * Comprehensive platform statistics including:
 * - PayChangu wallet balance
 * - Registration revenue
 * - Withdrawal stats
 * - Referral payouts
 * - Platform health metrics
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const sql = client;

    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. PayChangu balance
    let paychanguBalance = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch('https://api.paychangu.com/wallet-balance?currency=MWK', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        paychanguBalance = {
          environment: data.data.environment,
          currency: data.data.currency,
          mainBalance: parseFloat(data.data.main_balance || '0'),
          collectionBalance: parseFloat(data.data.collection_balance || '0'),
        };
      }
    } catch (e) {
      console.error('PayChangu balance error:', e);
    }

    // 2. User stats
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE payment_status = 'verified') as verified_users,
        COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_registrations,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_registrations,
        COUNT(*) FILTER (WHERE is_founding_member = true) as founding_members
      FROM users
    `;

    // 3. Registration revenue (from PayChangu transactions)
    const registrationRevenue = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'success') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_collected,
        COUNT(*) FILTER (WHERE status = 'success' AND created_at >= CURRENT_DATE) as today_payments,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= CURRENT_DATE), 0) as today_collected
      FROM paychangu_transactions
    `;

    // 4. Withdrawal stats
    const withdrawalStats = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount_requested), 0) as total_requested,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(withdrawal_fee), 0) as total_fees
      FROM withdrawals
      GROUP BY status
    `;

    const wStats: Record<string, any> = {};
    for (const row of withdrawalStats) {
      wStats[row.status] = {
        count: parseInt(row.count),
        totalRequested: parseFloat(row.total_requested),
        totalPaid: parseFloat(row.total_paid),
        totalFees: parseFloat(row.total_fees)
      };
    }

    // 5. Referral stats
    const referralStats = await sql`
      SELECT 
        referral_type,
        COUNT(*) as count,
        COALESCE(SUM(bonus_amount), 0) as total_bonuses,
        COUNT(*) FILTER (WHERE is_paid = true) as paid_count,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true), 0) as total_paid
      FROM referrals
      GROUP BY referral_type
    `;

    // 6. Transaction summary
    const transactionSummary = await sql`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(fee_deducted), 0) as total_fees
      FROM transactions
      GROUP BY transaction_type
    `;

    // 7. Today's activity
    const todayActivity = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE table_name = 'users') as new_users,
        COUNT(*) FILTER (WHERE table_name = 'withdrawals') as withdrawals
      FROM (
        SELECT 'users' as table_name FROM users WHERE created_at >= CURRENT_DATE
        UNION ALL
        SELECT 'withdrawals' FROM withdrawals WHERE requested_at >= CURRENT_DATE
      ) t
    `;

    // 8. Wallet totals
    const walletTotals = await sql`
      SELECT 
        COALESCE(SUM(balance_available), 0) as total_user_balances,
        COALESCE(SUM(gross_earnings), 0) as total_gross_earnings,
        COALESCE(SUM(total_withdrawn), 0) as total_withdrawn,
        COALESCE(SUM(fees_paid), 0) as total_fees_paid,
        COUNT(*) as total_wallets
      FROM wallets
    `;

    // 9. Premium pack sales
    const premiumSales = await sql`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(amount_paid), 0) as total_revenue
      FROM user_premium_packs
    `;

    const courseSales = await sql`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(amount_paid), 0) as total_revenue
      FROM course_purchases
    `;

    // Build response
    const stats = {
      paychangu: paychanguBalance || { error: 'Unable to fetch balance' },
      
      users: {
        total: parseInt(userStats[0].total_users),
        verified: parseInt(userStats[0].verified_users),
        pending: parseInt(userStats[0].pending_users),
        todayRegistrations: parseInt(userStats[0].today_registrations),
        weekRegistrations: parseInt(userStats[0].week_registrations),
        foundingMembers: parseInt(userStats[0].founding_members),
      },

      revenue: {
        successfulPayments: parseInt(registrationRevenue[0].successful_payments),
        pendingPayments: parseInt(registrationRevenue[0].pending_payments),
        failedPayments: parseInt(registrationRevenue[0].failed_payments),
        totalCollected: parseFloat(registrationRevenue[0].total_collected),
        todayPayments: parseInt(registrationRevenue[0].today_payments),
        todayCollected: parseFloat(registrationRevenue[0].today_collected),
      },

      withdrawals: wStats,

      referrals: referralStats.map((r: any) => ({
        type: r.referral_type,
        count: parseInt(r.count),
        totalBonuses: parseFloat(r.total_bonuses),
        paidCount: parseInt(r.paid_count),
        totalPaid: parseFloat(r.total_paid),
      })),

      transactions: transactionSummary.map((t: any) => ({
        type: t.transaction_type,
        count: parseInt(t.count),
        totalAmount: parseFloat(t.total_amount),
        totalFees: parseFloat(t.total_fees),
      })),

      today: {
        newUsers: parseInt(todayActivity[0]?.new_users || '0'),
        withdrawals: parseInt(todayActivity[0]?.withdrawals || '0'),
      },

      wallets: {
        totalUserBalances: parseFloat(walletTotals[0].total_user_balances),
        totalGrossEarnings: parseFloat(walletTotals[0].total_gross_earnings),
        totalWithdrawn: parseFloat(walletTotals[0].total_withdrawn),
        totalFeesPaid: parseFloat(walletTotals[0].total_fees_paid),
        totalWallets: parseInt(walletTotals[0].total_wallets),
      },

      premium: {
        packSales: parseInt(premiumSales[0].total_sales),
        packRevenue: parseFloat(premiumSales[0].total_revenue),
        courseSales: parseInt(courseSales[0].total_sales),
        courseRevenue: parseFloat(courseSales[0].total_revenue),
      },
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('System stats error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
