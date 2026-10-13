import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
//#region src/pages/api/admin/financial-overview.ts
var financial_overview_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
/**
* GET /api/admin/financial-overview
* 
* Returns comprehensive financial data:
* - Revenue (registration fees, premium sales)
* - Expenditure (withdrawals paid, referral bonuses paid, fees absorbed)
* - Profit calculation
* - PayChangu wallet balance
*/
var GET = async ({ request }) => {
	try {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const token = authHeader.replace("Bearer ", "");
		const sql = client;
		if ((await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`).length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Session expired"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const regRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_reg_revenue,
        COUNT(*) FILTER (WHERE status = 'success') as total_reg_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= CURRENT_DATE), 0) as today_reg_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as month_reg_revenue
      FROM paychangu_transactions
    `;
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
		const verifiedPaychanguCount = await sql`
      SELECT COUNT(DISTINCT u.id) as verified_count
      FROM users u
      JOIN paychangu_transactions pt ON pt.user_id = u.id
      WHERE u.payment_status = 'verified'
        AND pt.status = 'success'
    `;
		const premiumRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as total_premium_revenue,
        COUNT(*) as total_premium_count
      FROM user_premium_packs
    `;
		const courseRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount_paid), 0) as total_course_revenue,
        COUNT(*) as total_course_count
      FROM course_purchases
    `;
		const withdrawalExpenditure = await sql`
      SELECT 
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed'), 0) as total_withdrawn,
        COALESCE(SUM(withdrawal_fee) FILTER (WHERE status = 'completed'), 0) as total_fees_collected,
        COUNT(*) FILTER (WHERE status = 'completed') as total_withdrawal_count,
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed' AND processed_at >= CURRENT_DATE), 0) as today_withdrawn,
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'completed' AND processed_at >= date_trunc('month', CURRENT_DATE)), 0) as month_withdrawn
      FROM withdrawals
    `;
		const referralExpenditure = await sql`
      SELECT 
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true), 0) as total_referral_bonuses,
        COUNT(*) FILTER (WHERE is_paid = true) as total_referral_count,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true AND referral_type = 'first_level'), 0) as first_level_bonuses,
        COALESCE(SUM(bonus_amount) FILTER (WHERE is_paid = true AND referral_type = 'second_level'), 0) as second_level_bonuses
      FROM referrals
    `;
		const adminDeposits = await sql`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'admin_deposit'), 0) as total_admin_deposits,
        COUNT(*) FILTER (WHERE transaction_type = 'admin_deposit') as deposit_count
      FROM transactions
    `;
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
			totalFeesPaidByUsers: parseFloat(walletSummary[0].total_fees_paid_by_users)
		};
		let paychanguBalance = null;
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 1e4);
			const res = await fetch("https://api.paychangu.com/wallet-balance?currency=MWK", {
				method: "GET",
				headers: {
					"Accept": "application/json",
					"Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`
				},
				signal: controller.signal
			});
			clearTimeout(timeout);
			const data = await res.json();
			if (data.status === "success" && data.data) paychanguBalance = {
				mainBalance: parseFloat(data.data.main_balance || "0"),
				collectionBalance: parseFloat(data.data.collection_balance || "0")
			};
		} catch (e) {
			console.error("PayChangu balance fetch error:", e);
		}
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
		const regRev = parseFloat(regRevenue[0].total_reg_revenue);
		const premRev = parseFloat(premiumRevenue[0].total_premium_revenue);
		const courseRev = parseFloat(courseRevenue[0].total_course_revenue);
		const totalRevenue = regRev;
		const withdrawn = parseFloat(withdrawalExpenditure[0].total_withdrawn);
		const referralBonuses = parseFloat(referralExpenditure[0].total_referral_bonuses);
		const adminDep = parseFloat(adminDeposits[0].total_admin_deposits);
		const totalExpenditure = withdrawn + referralBonuses;
		const feesCollected = parseFloat(withdrawalExpenditure[0].total_fees_collected);
		const profit = totalRevenue - totalExpenditure;
		const vpTotalBalance = parseFloat(verifiedPaychanguWallets[0].verified_paychangu_total_balance);
		parseFloat(verifiedPaychanguWallets[0].verified_paychangu_withdrawable);
		parseFloat(verifiedPaychanguWallets[0].verified_paychangu_gross);
		const afterFifteenPercent = vpTotalBalance - vpTotalBalance * .15;
		const profitFromVerified = wallets.totalUserBalances - afterFifteenPercent;
		const displayRevenue = profitFromVerified * .75;
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
				paychanguProfit: profitFromVerified,
				displayRevenue,
				verifiedCount: parseInt(verifiedPaychanguCount[0].verified_count)
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
				thisMonthWithdrawn: parseFloat(withdrawalExpenditure[0].month_withdrawn)
			},
			profit: {
				net: profit,
				margin: totalRevenue > 0 ? (profit / totalRevenue * 100).toFixed(1) : "0",
				feesCollected,
				adminDeposits: adminDep,
				profitFromVerifiedPaychangu: profitFromVerified
			},
			wallets: {
				totalUserBalances: parseFloat(walletSummary[0].total_user_balances),
				totalGrossEarnings: parseFloat(walletSummary[0].total_gross_earnings),
				totalWithdrawnByUsers: parseFloat(walletSummary[0].total_withdrawn_by_users),
				totalFeesPaidByUsers: parseFloat(walletSummary[0].total_fees_paid_by_users)
			},
			paychangu: paychanguBalance,
			dailyTrend: dailyTrend.map((d) => ({
				date: d.date,
				revenue: parseFloat(d.revenue),
				payments: parseInt(d.payments)
			}))
		};
		return new Response(JSON.stringify({
			success: true,
			stats
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		console.error("Financial overview error:", err.message);
		console.error("Stack:", err.stack);
		return new Response(JSON.stringify({
			success: false,
			message: err.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/financial-overview@_@ts
var page = () => financial_overview_exports;
//#endregion
export { page };
