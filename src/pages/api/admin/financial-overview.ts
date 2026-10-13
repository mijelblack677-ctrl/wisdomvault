export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

/**
 * GET /api/admin/financial-overview
 * 
 * Returns comprehensive financial data:
 * - Revenue (registration fees, premium sales)
 * - Expenditure (withdrawals paid, referral bonuses paid, fees absorbed)
 * - Profit calculation
 * - PayChangu wallet balance
 */
export const GET: APIRoute = async ({ request }) => {
  try {
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

    // 1. REVENUE
    // Registration fees collected via PayChangu
    const regRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_reg_revenue,
        COUNT(*) FILTER (WHERE status = 'success') as total_reg_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= CURRENT_DATE), 0) as today_reg_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as month_reg_revenue
      FROM paychangu_transactions
    `;

    // Verified users via PayChangu: wallets of users who paid via PayChangu successfully
    const verifiedPaychanguWallets = await sql`
      SELECT 
        COALESCE(SUM(w.balance_available), 0) as verified_paychangu_withdrawable,
        COALESCE(SUM(w.gross_earnings), 0) as verified_paychangu_gross,
        COALESCE(SUM(w.balance_available + w.gross_earnings), 0) as verified_paychangu_total_balance
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      JOIN paychangu_transactions pt ON pt.user_id = u.id
      WHERE u.payment_status = 'verified'
        AND pt.status = 'success'
    `;

    // Count of verified users via PayChangu
    const verifiedPaychanguCount = await sql`
      SELECT COUNT(DISTINCT u.id) as verified_count
      FROM users u
      JOIN paychangu_transactions pt ON pt.user_id = u.id
      WHERE u.payment_status = 'verified'
        AND pt.status = 'success'
    `;

    // Premium pack sales
    const premiumRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as total_premium_revenue,
        COUNT(*) as total_premium_count
      FROM user_premium_packs
    `;

    // Course purchases
    const courseRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as total_course_revenue,
        COUNT(*) as total_course_count
      FROM course_purchases
    `;

    // 2. EXPENDITURE
    // Withdrawals paid out
    const withdrawalExpenditure = await sql`
      SELECT 
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed'), 0) as total_withdrawn,
        COALESCE(SUM(withdrawal_fee) FILTER (WHERE status = 'completed'), 0) as total_fees_collected,
        COUNT(*) FILTER (WHERE status = 'completed') as total_withdrawal_count,
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed' AND processed_at >= CURRENT_DATE), 0) as today_withdrawn,
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed' AND processed_at >= date_trunc('month', CURRENT_DATE)), 0) as month_withdrawn
      FROM withdrawals
    `;

    // Referral bonuses paid
    const referralExpenditure = await sql`
      SELECT 
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true), 0) as total_referral_bonuses,
        COUNT(*) FILTER (WHERE is_paid = true) as total_referral_count,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true AND referral_type = 'first_level'), 0) as first_level_bonuses,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true AND referral_type = 'second_level'), 0) as second_level_bonuses
      FROM referrals
    `;

    // Admin deposits (expenditure from admin wallet)
    const adminDeposits = await sql`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'admin_deposit'), 0) as total_admin_deposits,
        COUNT(*) FILTER (WHERE transaction_type = 'admin_deposit') as deposit_count
      FROM transactions
    `;

    // 3. WALLET SUMMARY
    const walletSummary = await sql`
      SELECT 
        COALESCE(SUM(balance_available), 0) as total_user_balances,
        COALESCE(SUM(gross_earnings), 0) as total_gross_earnings,
        COALESCE(SUM(total_withdrawn), 0) as total_withdrawn_by_users,
        COALESCE(SUM(fees_paid), 0) as total_fees_paid_by_users
      FROM wallets
    `;

    const wallets = {
      totalUserBalances: parseFloat(walletSummary[0].total_user_balances),
      totalGrossEarnings: parseFloat(walletSummary[0].total_gross_earnings),
      totalWithdrawnByUsers: parseFloat(walletSummary[0].total_withdrawn_by_users),
      totalFeesPaidByUsers: parseFloat(walletSummary[0].total_fees_paid_by_users),
    };

    // 4. PAYCHANGU WALLET BALANCE
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
          mainBalance: parseFloat(data.data.main_balance || '0'),
          collectionBalance: parseFloat(data.data.collection_balance || '0'),
        };
      }
    } catch (e) {
      console.error('PayChangu balance fetch error:', e);
    }

    // 5. DAILY REVENUE TREND (last 30 days)
    const dailyTrend = await sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as revenue,
        COUNT(*) FILTER (WHERE status = 'success') as payments
      FROM paychangu_transactions
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Build response
    const regRev = parseFloat(regRevenue[0].total_reg_revenue);
    const premRev = parseFloat(premiumRevenue[0].total_premium_revenue);
    const courseRev = parseFloat(courseRevenue[0].total_course_revenue);

    // Revenue = Registration fees collected (what users paid to register)
    const totalRevenue = regRev;

    // Expenditure = Referral bonuses paid out + Withdrawals paid out
    const withdrawn = parseFloat(withdrawalExpenditure[0].total_withdrawn);
    const referralBonuses = parseFloat(referralExpenditure[0].total_referral_bonuses);
    const adminDep = parseFloat(adminDeposits[0].total_admin_deposits);
    const totalExpenditure = withdrawn + referralBonuses;

    // Profit = Revenue - Expenditure (what we keep)
    const feesCollected = parseFloat(withdrawalExpenditure[0].total_fees_collected);
    const profit = totalRevenue - totalExpenditure;

    // Verified PayChangu user balances
    const vpTotalBalance = parseFloat(verifiedPaychanguWallets[0].verified_paychangu_total_balance);
    const vpWithdrawable = parseFloat(verifiedPaychanguWallets[0].verified_paychangu_withdrawable);
    const vpGross = parseFloat(verifiedPaychanguWallets[0].verified_paychangu_gross);

    // 15% subtracted from verified PayChangu user total balance
    const fifteenPercent = vpTotalBalance * 0.15;
    const afterFifteenPercent = vpTotalBalance - fifteenPercent;

    // Profit = withdrawable balance - (verified PayChangu total - 15%)
    const profitFromVerified = wallets.totalUserBalances - afterFifteenPercent;

    // Displayed revenue = 75% of profit
    const displayRevenue = profitFromVerified * 0.75;

    const stats = {
      revenue: {
        total: totalRevenue,
        registrations: regRev,
        registrationCount: parseInt(regRevenue[0].total_reg_count),
        premiumSales: premRev,
        premiumCount: parseInt(premiumRevenue[0].total_premium_count),
        courseSales: courseRev,
        courseCount: parseInt(courseRevenue[0].total_course_count),
        today: parseFloat(regRevenue[0].today_reg_revenue),
        thisMonth: parseFloat(regRevenue[0].month_reg_revenue),
        // Profit from verified PayChangu users only
        paychanguProfit: profitFromVerified,
        displayRevenue: displayRevenue,
        verifiedCount: parseInt(verifiedPaychanguCount[0].verified_count),
      },
      expenditure: {
        total: totalExpenditure,
        withdrawalsPaid: withdrawn,
        withdrawalCount: parseInt(withdrawalExpenditure[0].total_withdrawal_count),
        referralBonusesPaid: referralBonuses,
        referralCount: parseInt(referralExpenditure[0].total_referral_count),
        firstLevelBonuses: parseFloat(referralExpenditure[0].first_level_bonuses),
        secondLevelBonuses: parseFloat(referralExpenditure[0].second_level_bonuses),
        todayWithdrawn: parseFloat(withdrawalExpenditure[0].today_withdrawn),
        thisMonthWithdrawn: parseFloat(withdrawalExpenditure[0].month_withdrawn),
      },
      profit: {
        net: profit,
        margin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0',
        feesCollected: feesCollected,
        adminDeposits: adminDep,
        // New profit metric
        profitFromVerifiedPaychangu: profitFromVerified,
      },
      wallets: {
        totalUserBalances: parseFloat(walletSummary[0].total_user_balances),
        totalGrossEarnings: parseFloat(walletSummary[0].total_gross_earnings),
        totalWithdrawnByUsers: parseFloat(walletSummary[0].total_withdrawn_by_users),
        totalFeesPaidByUsers: parseFloat(walletSummary[0].total_fees_paid_by_users),
      },
      paychangu: paychanguBalance,
      dailyTrend: dailyTrend.map((d: any) => ({
        date: d.date,
        revenue: parseFloat(d.revenue),
        payments: parseInt(d.payments),
      })),
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Financial overview error:', err.message);
    console.error('Stack:', err.stack);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
