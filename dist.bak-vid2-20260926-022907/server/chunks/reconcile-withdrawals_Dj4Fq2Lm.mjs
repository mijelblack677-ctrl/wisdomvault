import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as reconcileStuckWithdrawals } from "./withdrawalReconcile_BnVthpFs.mjs";
//#region src/pages/api/cron/reconcile-withdrawals.ts
var reconcile_withdrawals_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
/**
* GET /api/cron/reconcile-withdrawals
*
* Scheduled by Vercel Cron (vercel.json → crons). Sweeps any 'processing'
* PayChangu auto-withdrawals and reconciles them against PayChangu: confirmed
* paid → completed (no refund), explicit failure → failed + refund, ambiguous →
* left as processing. Fully idempotent, so missed or duplicate runs are safe.
*
* Auth: when CRON_SECRET is set on the project, Vercel sends it as an
* `Authorization: Bearer …` header — we require it. If CRON_SECRET is not
* configured, we fall back to requiring Vercel's cron schedule header so a
* random visitor can't trigger sweeps.
*/
var GET = async ({ request }) => {
	const authHeader = request.headers.get("Authorization") || "";
	const cronSecret = process.env.CRON_SECRET;
	const isVercelCron = Boolean(request.headers.get("x-vercel-cron-schedule"));
	if (cronSecret) {
		if (authHeader !== `Bearer ${cronSecret}`) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
	} else if (!isVercelCron) return new Response(JSON.stringify({
		success: false,
		message: "Unauthorized"
	}), {
		status: 401,
		headers: { "Content-Type": "application/json" }
	});
	try {
		const summary = await reconcileStuckWithdrawals();
		return new Response(JSON.stringify({
			success: true,
			...summary
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (err) {
		const e = err;
		console.error("Cron reconcile error:", e);
		return new Response(JSON.stringify({
			success: false,
			message: e.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/cron/reconcile-withdrawals@_@ts
var page = () => reconcile_withdrawals_exports;
//#endregion
export { page };
