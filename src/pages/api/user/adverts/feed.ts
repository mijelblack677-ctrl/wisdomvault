export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import { parseImageUrls } from '@lib/advertTemplates';

// ============================================================
// GET /api/user/adverts/feed — approved adverts for the Earn & Watch feed.
// Any authenticated user sees other members' approved ads (no reward —
// these are exposure placements, not earning tasks).
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;

    // Approved + active ads, newest first, capped. Any authenticated user may
    // view; own pending ads are intentionally excluded (they stay in My Advert).
    const rows = await sql`
      SELECT id, user_id, template, headline, business_name, description,
             contact_phone, location, whatsapp, image_urls, created_at, view_count,
             is_official, sold
      FROM user_business_adverts
      WHERE status = 'approved' AND is_active = true
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const adverts = (rows || []).map((a: any) => ({
      id: a.id,
      isMine: a.user_id === user.id,
      isOfficial: a.is_official || false,
      sold: a.sold || false,
      template: a.template,
      headline: a.headline,
      businessName: a.business_name,
      description: a.description || '',
      contactPhone: a.contact_phone || '',
      location: a.location || '',
      whatsapp: a.whatsapp || '',
      images: parseImageUrls(a.image_urls),
      createdAt: a.created_at,
      viewCount: a.view_count || 0,
    }));

    return new Response(JSON.stringify({ success: true, adverts }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Advert feed GET error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to load adverts' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// POST /api/user/adverts/feed — fire-and-forget view counter.
// Body: { id } — increments view_count once per call. Best-effort only.
// ============================================================
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id : '';
    // Cheap UUID shape check — no DB roundtrip for garbage
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid id' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;
    await sql`
      UPDATE user_business_adverts
      SET view_count = view_count + 1
      WHERE id = ${id} AND status = 'approved' AND is_active = true
    `;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // View counting must never break the UI
    return new Response(JSON.stringify({ success: false }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
};
