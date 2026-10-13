export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';

// ============================================================
// GET /api/user/vacancies — active vacancies published by the admin.
// Any authenticated user can browse them from the More panel.
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
    const rows = await sql`
      SELECT id, title, company, description, location,
             contact_phone, whatsapp, image_urls, created_at, view_count
      FROM vacancies
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const vacancies = (rows || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      company: v.company,
      description: v.description || '',
      location: v.location || '',
      contactPhone: v.contact_phone || '',
      whatsapp: v.whatsapp || '',
      images: parseImageUrls(v.image_urls),
      createdAt: v.created_at,
      viewCount: v.view_count || 0,
    }));

    return new Response(JSON.stringify({ success: true, vacancies }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Vacancies GET error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to load vacancies' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// POST /api/user/vacancies — fire-and-forget view counter.
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
      UPDATE vacancies
      SET view_count = view_count + 1
      WHERE id = ${id} AND is_active = true
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

// ============================================================
// Shared helper — image_urls is stored as a JSON array string.
// ============================================================
function parseImageUrls(raw: unknown): string[] {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}
