//#region src/lib/video-meta.ts
function isYouTubeUrl(url) {
	if (!url) return false;
	try {
		const u = new URL(url);
		return /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === "youtu.be";
	} catch {
		return false;
	}
}
function isTikTokUrl(url) {
	if (!url) return false;
	try {
		const u = new URL(url);
		return /(^|\.)tiktok\.com$/.test(u.hostname);
	} catch {
		return false;
	}
}
function isVimeoUrl(url) {
	if (!url) return false;
	try {
		const u = new URL(url);
		return /(^|\.)vimeo\.com$/.test(u.hostname);
	} catch {
		return false;
	}
}
/** Detect platform from a URL. Returns 'unknown' if not recognised. */
function detectVideoPlatform(url) {
	if (isYouTubeUrl(url)) return "youtube";
	if (isTikTokUrl(url)) return "tiktok";
	if (isVimeoUrl(url)) return "vimeo";
	return "unknown";
}
async function fetchYouTubeMeta(url) {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5e3);
		const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { signal: controller.signal });
		clearTimeout(timeout);
		if (res.ok) {
			const data = await res.json();
			return {
				title: (data.title || "").toString().slice(0, 150),
				thumbnail: data.thumbnail_url || "",
				platform: "youtube"
			};
		}
	} catch {}
	return null;
}
async function fetchTikTokMeta(url) {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5e3);
		const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, { signal: controller.signal });
		clearTimeout(timeout);
		if (res.ok) {
			const data = await res.json();
			return {
				title: (data.title || "").toString().slice(0, 150),
				thumbnail: data.thumbnail_url || "",
				platform: "tiktok"
			};
		}
	} catch {}
	return null;
}
async function fetchVimeoMeta(url) {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5e3);
		const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`, { signal: controller.signal });
		clearTimeout(timeout);
		if (res.ok) {
			const data = await res.json();
			const thumbnail = data.thumbnail_url_with_play_button || data.thumbnail_url || "";
			return {
				title: (data.title || "").toString().slice(0, 150),
				thumbnail,
				platform: "vimeo"
			};
		}
	} catch {}
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 8e3);
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { "User-Agent": "Mozilla/5.0 (compatible; VideoMetaBot/1.0)" }
		});
		clearTimeout(timeout);
		if (res.ok) {
			const html = await res.text();
			const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i) || html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:title"/i) || html.match(/<title>([^<]+)<\/title>/i);
			const imageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i) || html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:image"/i);
			if (titleMatch?.[1] || imageMatch?.[1]) return {
				title: (titleMatch?.[1] || "Vimeo Video").replace(/\s*[|\-–].*$/, "").trim().slice(0, 150),
				thumbnail: imageMatch?.[1] || "",
				platform: "vimeo"
			};
		}
	} catch {}
	return null;
}
/**
* Fetch video metadata from any supported platform.
* Auto-detects the platform from the URL, or accepts an explicit platform
* override (useful when the admin selects "TikTok" in the dropdown).
*
* Returns null when the URL is unrecognised or the oEmbed call fails —
* callers should fall back to a generic title / empty thumbnail.
*/
async function fetchVideoMeta(url, platform) {
	switch (platform || detectVideoPlatform(url)) {
		case "youtube": return fetchYouTubeMeta(url);
		case "tiktok": return fetchTikTokMeta(url);
		case "vimeo": return fetchVimeoMeta(url);
		default: return null;
	}
}
//#endregion
export { fetchVideoMeta as n, detectVideoPlatform as t };
