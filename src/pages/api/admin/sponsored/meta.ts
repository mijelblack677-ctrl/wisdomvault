export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { fetchVideoMeta, detectVideoPlatform } from '@lib/video-meta';

// GET /api/admin/sponsored/meta?url=...&platform=youtube|tiktok|vimeo
// Fetch a video's title + thumbnail for the manual task form so the admin
// can paste just a URL and see the card data fill in automatically.
// Supports YouTube, TikTok, and Vimeo via their public oEmbed endpoints.
export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const sql = client;

  try {
    const sessions = await sql`
      SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()
    `;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const videoUrl = (url.searchParams.get('url') || '').trim();
    const platformHint = (url.searchParams.get('platform') || '').trim();

    if (!videoUrl) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Enter a video URL first.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const detected = detectVideoPlatform(videoUrl);
    const platform = (platformHint || detected) as 'youtube' | 'tiktok' | 'vimeo' | 'unknown';

    if (platform === 'unknown') {
      return new Response(JSON.stringify({
        success: false,
        message: 'Enter a valid YouTube, TikTok, or Vimeo video URL.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const meta = await fetchVideoMeta(videoUrl, platform);
    if (!meta) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Could not fetch video details. The URL may be invalid or the video is unavailable.',
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      title: meta.title,
      thumbnail: meta.thumbnail,
      platform: meta.platform,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Admin sponsored meta error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
