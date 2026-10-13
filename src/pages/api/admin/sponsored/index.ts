export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { fetchVideoMeta, detectVideoPlatform } from '@lib/video-meta';

// ============================================================
// GET - List all sponsored content
// ============================================================
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

    const items = await sql`
      SELECT * FROM sponsored_content 
      ORDER BY display_order, created_at DESC
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      items: items || [] 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin sponsored GET error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ============================================================
// POST - Create sponsored content (robust: handles missing columns)
// ============================================================
export const POST: APIRoute = async ({ request }) => {
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

    const body = await request.json();
    const { 
      title: _title, 
      description: _description, 
      content_type, 
      sponsor_name, 
      reward_amount, 
      duration_seconds, 
      external_link,
      video_platform,
      thumbnail_url: _thumbnail_url
    } = body;

    if (!content_type) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Content type is required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── Auto-fetch YouTube metadata (title/thumbnail) like the auto-content
    //    fallback does. Lets the admin paste only a video URL + reward and get
    //    a complete task card when the platform is YouTube.
    let title = (_title || '').trim();
    let description = (_description || '').trim();
    let thumbnail_url = (_thumbnail_url || '').trim();
    const platform = video_platform || 'youtube';

    // ── Auto-fetch video metadata (title/thumbnail) for any supported
    //    platform (YouTube, TikTok, Vimeo). Lets the admin paste only a
    //    video URL + reward and get a complete task card.
    const detectedPlatform = (video_platform as string) || detectVideoPlatform(external_link || '');
    const isVideoPlatform = ['youtube', 'tiktok', 'vimeo'].includes(detectedPlatform);

    if (isVideoPlatform && (!title || !thumbnail_url || !description)) {
      try {
        const meta = await fetchVideoMeta(external_link || '', detectedPlatform as 'youtube' | 'tiktok' | 'vimeo');
        if (meta) {
          title = title || meta.title;
          thumbnail_url = thumbnail_url || meta.thumbnail;
          description = description || `Watch "${meta.title}" and earn rewards.`;
        }
      } catch (e) {
        // best-effort — fall through to generic defaults below
      }
    }

    // A bare video link must still produce a usable task card.
    if (isVideoPlatform) {
      if (!title) title = 'Watch & Earn Video';
      if (!description) description = title;
      // YouTube fallback thumbnail from video ID
      if (!thumbnail_url && external_link && detectedPlatform === 'youtube') {
        const ytMatch = String(external_link).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([^&\n?#]+)/);
        if (ytMatch?.[1]) thumbnail_url = `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }

    if (!title) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Title is required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ Check if video_platform column exists
    let hasVideoPlatform = false;
    try {
      const colCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sponsored_content' 
        AND column_name = 'video_platform'
      `;
      hasVideoPlatform = colCheck.length > 0;
    } catch (e) {
      console.log('⚠️ Could not check video_platform column');
    }

    let result;
    if (hasVideoPlatform) {
      result = await sql`
        INSERT INTO sponsored_content (
          title, 
          description, 
          content_type, 
          sponsor_name, 
          reward_amount, 
          duration_seconds, 
          external_link,
          video_platform,
          thumbnail_url,
          is_active
        ) VALUES (
          ${title},
          ${description || ''},
          ${content_type},
          ${sponsor_name || ''},
          ${parseFloat(reward_amount) || 50},
          ${parseInt(duration_seconds) || 30},
          ${external_link || ''},
          ${video_platform || 'youtube'},
          ${thumbnail_url || ''},
          true
        )
        RETURNING id
      `;
    } else {
      result = await sql`
        INSERT INTO sponsored_content (
          title, 
          description, 
          content_type, 
          sponsor_name, 
          reward_amount, 
          duration_seconds, 
          external_link,
          thumbnail_url,
          is_active
        ) VALUES (
          ${title},
          ${description || ''},
          ${content_type},
          ${sponsor_name || ''},
          ${parseFloat(reward_amount) || 50},
          ${parseInt(duration_seconds) || 30},
          ${external_link || ''},
          ${thumbnail_url || ''},
          true
        )
        RETURNING id
      `;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sponsored task created successfully!',
      id: result[0]?.id 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin sponsored POST error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ============================================================
// DELETE - Remove sponsored content
// ============================================================
export const DELETE: APIRoute = async ({ request }) => {
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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Content ID required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the content. If it has user view records and the FK isn't
    // cascading (legacy DB), remove the view records first, then retry.
    try {
      await sql`
        DELETE FROM sponsored_content WHERE id = ${id}
      `;
    } catch (deleteErr) {
      const msg = (deleteErr as Error).message || '';
      const isFkViolation = msg.includes('foreign key') || msg.includes('violates') || msg.includes('user_sponsored_views_content_id_fkey');
      if (!isFkViolation) throw deleteErr;

      await sql.begin(async (tx: any) => {
        await tx`DELETE FROM user_sponsored_views WHERE content_id = ${id}`;
        await tx`DELETE FROM sponsored_content WHERE id = ${id}`;
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Sponsored content deleted successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Admin sponsored DELETE error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
