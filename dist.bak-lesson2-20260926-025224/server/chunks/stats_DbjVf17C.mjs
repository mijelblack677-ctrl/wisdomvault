import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { t as getPublicStats } from "./publicStats_CwIwatJ5.mjs";
//#region src/pages/api/public/stats.ts
var stats_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	const limit = checkRateLimit(`public-stats:${clientIp(request)}`, 60, 6e4);
	if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
	const stats = await getPublicStats();
	if (!stats) return new Response(JSON.stringify({
		success: false,
		message: "Stats temporarily unavailable"
	}), {
		status: 503,
		headers: { "Content-Type": "application/json" }
	});
	return new Response(JSON.stringify({
		success: true,
		stats
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/public/stats@_@ts
var page = () => stats_exports;
//#endregion
export { page };
