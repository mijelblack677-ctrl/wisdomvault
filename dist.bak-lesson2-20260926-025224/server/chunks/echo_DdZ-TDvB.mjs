import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { n as unauthorized, t as requireAdmin } from "./adminAuth_Dr_-tb6j.mjs";
//#region src/pages/api/echo.ts
var echo_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	const limit = checkRateLimit(`echo:${clientIp(request)}`, 10, 6e4);
	if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);
	if (!await requireAdmin(request)) return unauthorized();
	try {
		const body = await request.text();
		return new Response(JSON.stringify({
			success: true,
			received: body,
			contentType: request.headers.get("content-type")
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		return new Response(JSON.stringify({
			success: false,
			error: error.message
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/echo@_@ts
var page = () => echo_exports;
//#endregion
export { page };
