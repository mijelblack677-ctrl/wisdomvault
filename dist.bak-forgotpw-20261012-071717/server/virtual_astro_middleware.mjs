import { k as defineMiddleware, t as sequence } from "./chunks/sequence_QRo3ktsJ.mjs";
//#region src/middleware.ts
var CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://platform.twitter.com https://www.tiktok.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
	"font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com",
	"img-src 'self' data: blob: https:",
	"media-src 'self' blob: data: https:",
	"connect-src 'self' https://api.paychangu.co.mw https://vault-of-wisdom.com https://www.vault-of-wisdom.com https://www.tiktok.com",
	"form-action 'self' https://api.paychangu.co.mw https://paychangu.co.mw",
	`frame-src 'self' ${[
		"https://www.youtube.com",
		"https://www.youtube-nocookie.com",
		"https://player.vimeo.com",
		"https://player.cloudinary.com",
		"https://res.cloudinary.com",
		"https://www.tiktok.com",
		"https://www.instagram.com",
		"https://www.facebook.com",
		"https://web.facebook.com",
		"https://platform.twitter.com",
		"https://rumble.com",
		"https://www.dailymotion.com",
		"https://player.twitch.tv",
		"https://clips.twitch.tv",
		"https://w.soundcloud.com",
		"https://audiomack.com",
		"https://www.mixcloud.com",
		"https://drive.google.com",
		"https://docs.google.com"
	].join(" ")}`,
	"frame-ancestors 'self'",
	"object-src 'none'",
	"base-uri 'self'"
].join("; ");
//#endregion
//#region \0virtual:astro:middleware
var onRequest = sequence(defineMiddleware((context, next) => {
	const refFromLink = (context.url.searchParams.get("ref") || "").trim().toUpperCase();
	if (refFromLink && /^[A-Z0-9]{4,12}$/.test(refFromLink) && !context.cookies.has("wv_ref")) context.cookies.set("wv_ref", refFromLink, {
		httpOnly: true,
		sameSite: "lax",
		secure: context.url.protocol === "https:",
		path: "/",
		maxAge: 3600 * 24 * 30
	});
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
