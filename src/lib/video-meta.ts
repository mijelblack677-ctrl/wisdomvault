/**
 * Video metadata helpers — fetch title + thumbnail from YouTube, TikTok, or
 * Vimeo via their public oEmbed endpoints (no API key required).
 *
 * Used by:
 *  - Admin manual "Watch & Earn" upload (auto-fill title/thumbnail)
 *  - Auto-content fallback (YouTube/TikTok/Vimeo links auto-populate tasks)
 *  - Admin meta preview endpoint (/api/admin/sponsored/meta)
 */

interface VideoMeta {
  title: string;
  thumbnail: string;
  platform: 'youtube' | 'tiktok' | 'vimeo' | 'unknown';
}

// ── Platform detection ────────────────────────────────────────────────

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === 'youtu.be';
  } catch { return false; }
}

export function isTikTokUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /(^|\.)tiktok\.com$/.test(u.hostname);
  } catch { return false; }
}

export function isVimeoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return /(^|\.)vimeo\.com$/.test(u.hostname);
  } catch { return false; }
}

/** Detect platform from a URL. Returns 'unknown' if not recognised. */
export function detectVideoPlatform(url: string): VideoMeta['platform'] {
  if (isYouTubeUrl(url)) return 'youtube';
  if (isTikTokUrl(url)) return 'tiktok';
  if (isVimeoUrl(url)) return 'vimeo';
  return 'unknown';
}

// ── oEmbed fetchers (platform-specific) ───────────────────────────────

async function fetchYouTubeMeta(url: string): Promise<VideoMeta | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return {
        title: (data.title || '').toString().slice(0, 150),
        thumbnail: data.thumbnail_url || '',
        platform: 'youtube',
      };
    }
  } catch { /* oEmbed is best-effort */ }
  return null;
}

async function fetchTikTokMeta(url: string): Promise<VideoMeta | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return {
        title: (data.title || '').toString().slice(0, 150),
        thumbnail: data.thumbnail_url || '',
        platform: 'tiktok',
      };
    }
  } catch { /* oEmbed is best-effort */ }
  return null;
}

async function fetchVimeoMeta(url: string): Promise<VideoMeta | null> {
  // Attempt 1: standard oEmbed endpoint
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const thumbnail =
        data.thumbnail_url_with_play_button ||
        data.thumbnail_url || '';
      return {
        title: (data.title || '').toString().slice(0, 150),
        thumbnail,
        platform: 'vimeo',
      };
    }
  } catch { /* fall through to page scrape */ }

  // Attempt 2: scrape og:title + og:image from the video page.
  // Works when oEmbed is geo-restricted or returns 404.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VideoMetaBot/1.0)' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)
        || html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:title"/i)
        || html.match(/<title>([^<]+)<\/title>/i);
      const imageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i)
        || html.match(/<meta[^>]+content="([^"]*)"[^>]+property="og:image"/i);
      if (titleMatch?.[1] || imageMatch?.[1]) {
        return {
          title: (titleMatch?.[1] || 'Vimeo Video').replace(/\s*[|\-–].*$/, '').trim().slice(0, 150),
          thumbnail: imageMatch?.[1] || '',
          platform: 'vimeo',
        };
      }
    }
  } catch { /* best-effort */ }
  return null;
}

// ── Unified helper ────────────────────────────────────────────────────

/**
 * Fetch video metadata from any supported platform.
 * Auto-detects the platform from the URL, or accepts an explicit platform
 * override (useful when the admin selects "TikTok" in the dropdown).
 *
 * Returns null when the URL is unrecognised or the oEmbed call fails —
 * callers should fall back to a generic title / empty thumbnail.
 */
export async function fetchVideoMeta(
  url: string,
  platform?: 'youtube' | 'tiktok' | 'vimeo'
): Promise<VideoMeta | null> {
  const p = platform || detectVideoPlatform(url);
  switch (p) {
    case 'youtube': return fetchYouTubeMeta(url);
    case 'tiktok':  return fetchTikTokMeta(url);
    case 'vimeo':   return fetchVimeoMeta(url);
    default:        return null;
  }
}

/**
 * Legacy alias — kept so existing call-sites that import `fetchYouTubeMeta`
 * directly still compile without changes. New code should use `fetchVideoMeta`.
 */
export { fetchYouTubeMeta };
