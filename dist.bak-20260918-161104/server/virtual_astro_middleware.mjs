import { k as defineMiddleware, t as sequence } from "./chunks/sequence_DvkkRzsk.mjs";
//#region src/middleware.ts
var CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
	"font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com",
	"img-src 'self' data: blob: https:",
	"media-src 'self' data: blob:",
	"frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com",
	"connect-src 'self' https://api.paychangu.co.mw https://vault-of-wisdom.com https://www.vault-of-wisdom.com",
	"form-action 'self' https://api.paychangu.co.mw https://paychangu.co.mw",
	"frame-ancestors 'self'",
	"object-src 'none'",
	"base-uri 'self'"
].join("; ");
//#endregion
//#region \0virtual:astro:middleware
var onRequest = sequence(defineMiddleware((context, next) => {
	return next().then((res) => {
		res.headers.set("X-Content-Type-Options", "nosniff");
		res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
		res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
		if ((res.headers.get("Content-Type") || "").startsWith("text/html")) {
			res.headers.set("X-Frame-Options", "SAMEORIGIN");
			res.headers.set("Content-Security-Policy", CSP);
		}
		return res;
	});
}));
//#endregion
export { onRequest };
