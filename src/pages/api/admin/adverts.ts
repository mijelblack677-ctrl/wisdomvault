export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { client } from '@db';
import { createNotification } from '@lib/notifications';
import {
  ADVERT_LIMITS,
  OFFICIAL_FIELDS,
  parseImageUrls,
  type OfficialAdInput,
} from '@lib/advertTemplates';

/** Naive tag stripper (defense-in-depth; UI also escapes on render). */
function stripTags(s: string): string {
  return s.replace(/<[^>]*>?/g, '');
}

/** Sniff image type from magic bytes — never trust the client-supplied MIME. */
function sniffImageType(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

// ============================================================
// Admin auth: Bearer token -> admin_sessions (same pattern as the other
// /api/admin/* endpoints in this project).
// ============================================================
async function requireAdmin(request: Request): Promise<{ id: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');

  const sql = client;
  const sessions = await sql`
    SELECT admin_id FROM admin_sessions
    WHERE token = ${token} AND expires_at > NOW()
    LIMIT 1
  `;
  if (sessions.length === 0) return null;
  return { id: sessions[0].admin_id };
}

// ============================================================
// GET /api/admin/adverts?status=pending|approved|rejected|all
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    const sql = client;
    // LEFT JOIN: official (admin-created) ads have no user row.
    let rows: any[];
    if (status === 'all') {
      rows = await sql`
        SELECT a.*, u.full_name, u.email, u.phone
        FROM user_business_adverts a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY (a.status = 'pending') DESC, a.created_at DESC
        LIMIT 200
      `;
    } else {
      rows = await sql`
        SELECT a.*, u.full_name, u.email, u.phone
        FROM user_business_adverts a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.status = ${status}
        ORDER BY a.created_at DESC
        LIMIT 200
      `;
    }

    const counts = await sql`
      SELECT status, COUNT(*)::int AS c
      FROM user_business_adverts
      GROUP BY status
    `;
    const countMap: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
    for (const r of counts || []) countMap[r.status] = r.c;

    const adverts = (rows || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id || null,
      userName: a.is_official ? 'Official (admin)' : (a.full_name || '—'),
      userEmail: a.email || '',
      userPhone: a.phone || '',
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
      status: a.status,
      rejectionReason: a.rejection_reason || '',
      createdAt: a.created_at,
      viewCount: a.view_count || 0,
    }));

    return new Response(JSON.stringify({ success: true, adverts, counts: countMap }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin adverts GET error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to load adverts' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// POST /api/admin/adverts
//  - multipart/form-data → create an OFFICIAL ad (auto-approved, exempt
//    from the daily limit, labeled OFFICIAL in the feed). 0–3 images.
//  - application/json     → moderate: { id, action: 'approve'|'reject', reason? }
// ============================================================
export const POST: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      return createOfficialAd(request, admin);
    }

    const body = await request.json().catch(() => ({})) as any;

    // Compatibility path: some fetch-intercepting browser extensions re-encode
    // FormData uploads as JSON, stripping the multipart content-type. Without
    // this branch such uploads would fall into the moderation parser below and
    // fail with a confusing "id and action required".
    if (body && typeof body === 'object' && body.official === true) {
      return createOfficialAdFromJson(body, admin);
    }

    const { id, action, reason } = body || {};

    if (!id || !['approve', 'reject'].includes(action)) {
      console.warn(`Admin adverts moderation request missing id/action (content-type: ${contentType || 'none'})`);
      return new Response(JSON.stringify({ success: false, message: 'id and action (approve|reject) required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (action === 'reject' && !String(reason || '').trim()) {
      return new Response(JSON.stringify({ success: false, message: 'A rejection reason is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;

    const rows = await sql`
      SELECT id, user_id, business_name, status FROM user_business_adverts
      WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Advert not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    const advert = rows[0];

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    if (advert.status === newStatus) {
      return new Response(JSON.stringify({ success: true, message: `Already ${newStatus}` }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql.begin(async (tx: any) => {
      await tx`
        UPDATE user_business_adverts
        SET status = ${newStatus},
            reviewed_by = ${admin.id},
            reviewed_at = NOW(),
            rejection_reason = ${action === 'reject' ? String(reason).trim().slice(0, 500) : null},
            is_active = ${action === 'approve'}
        WHERE id = ${id}
      `;

      if (action === 'approve' && advert.user_id) {
        await createNotification({
          userId: advert.user_id,
          type: 'advert_approved',
          title: 'Your advert is live! 🎉',
          message: `Your "${advert.business_name}" advert was approved and is now visible to other users in the Earn & Watch section.`,
        });
      } else if (action === 'reject' && advert.user_id) {
        await createNotification({
          userId: advert.user_id,
          type: 'advert_rejected',
          title: 'Your advert was not approved',
          message: `Your "${advert.business_name}" advert was not approved. Reason: ${String(reason).trim().slice(0, 300)} You can submit a corrected advert tomorrow.`,
        });
      }
    });

    return new Response(JSON.stringify({ success: true, message: `Advert ${newStatus}` }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin adverts POST error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update advert' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// Official ad persistence shared by the multipart and JSON paths.
// No daily limit (partial index excludes official rows), no notification,
// auto-approved. Images arrive pre-validated.
// ============================================================
async function saveOfficialAd(
  ad: OfficialAdInput,
  accepted: { buf: Buffer; kind: string }[],
  admin: { id: string },
  fail: (status: number, payload: object) => Response
): Promise<Response> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'adverts');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const imageUrls: string[] = [];
    const written: string[] = [];
    try {
      for (const { buf, kind } of accepted) {
        const filename = `ad_${admin.id.slice(0, 8)}_${Date.now()}_${imageUrls.length}.${kind}`;
        fs.writeFileSync(path.join(uploadDir, filename), buf);
        written.push(filename);
        imageUrls.push(`/uploads/adverts/${filename}`);
      }
    } catch {
      for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* gone */ } }
      return fail(500, { message: 'Could not save images' });
    }

    const sql = client;
    try {
      const inserted = await sql`
        INSERT INTO user_business_adverts
          (user_id, template, headline, business_name, description,
           contact_phone, location, whatsapp, image_urls, status,
           reviewed_by, reviewed_at, is_active, is_official, created_date)
        VALUES
          (NULL, 'official', ${ad.headline}, ${ad.businessName}, ${ad.description || null},
           ${ad.contactPhone || null}, ${ad.location || null}, ${ad.whatsapp || null},
           ${JSON.stringify(imageUrls)}, 'approved',
           ${admin.id}, NOW(), true, true, CURRENT_DATE)
        RETURNING id
      `;
      return fail(201, { message: 'Official ad published', id: inserted[0]?.id });
    } catch (e) {
      // Nothing stored — don't leave orphan image files.
      for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* gone */ } }
      throw e;
    }
  } catch (error) {
    console.error('Admin official-ad create error:', error);
    return fail(500, { message: 'Failed to create official ad' });
  }
}

// ============================================================
// Official ad creation, multipart path (normal browsers).
// ============================================================
async function createOfficialAd(request: Request, admin: { id: string }): Promise<Response> {
  const json = (status: number, payload: object) =>
    new Response(JSON.stringify({ success: status < 400, ...payload }), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const form = await request.formData();

    const text = (k: string) => stripTags(String(form.get(k) || '').trim());
    const ad: OfficialAdInput = {
      headline: text('headline').slice(0, 120),
      businessName: text('businessName').slice(0, 100),
      description: text('description'),
      contactPhone: text('contactPhone').slice(0, 40),
      location: text('location').slice(0, 150),
      whatsapp: text('whatsapp').slice(0, 40),
    };

    if (!ad.headline || !ad.businessName) {
      return json(400, { message: 'Headline and business name are required' });
    }
    for (const k of OFFICIAL_FIELDS) {
      if (k === 'description') continue; // optional, length-capped above
      if ((ad as any)[k] && String((ad as any)[k]).length === 0) delete (ad as any)[k];
    }

    const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > ADVERT_LIMITS.maxImages) {
      console.warn(`Official ad rejected: ${files.length} images (max ${ADVERT_LIMITS.maxImages})`);
      return json(400, { message: `Maximum ${ADVERT_LIMITS.maxImages} images` });
    }

    // Two-pass: validate everything before anything touches disk.
    const accepted: { buf: Buffer; kind: string }[] = [];
    for (const file of files) {
      if (file.size > ADVERT_LIMITS.maxImageBytes) {
        console.warn(`Official ad image rejected: ${file.size} bytes (${file.type || 'unknown type'}, name: ${file.name?.slice(0, 60)})`);
        return json(400, { message: 'Each image must be under 5MB' });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniffImageType(buf);
      if (!kind) {
        console.warn(`Official ad image rejected: bad magic bytes (claimed type: ${file.type || 'unknown'}, name: ${file.name?.slice(0, 60)})`);
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      accepted.push({ buf, kind });
    }

    return saveOfficialAd(ad, accepted, admin, json);
  } catch (error) {
    console.error('Admin official-ad create error:', error);
    return json(500, { message: 'Failed to create official ad' });
  }
}

// ============================================================
// Official ad creation, JSON + base64 path. Serves fetch-intercepting
// browser extensions that re-encode FormData uploads as JSON (see the note
// in POST). Same validation, same storage, same response shapes.
// ============================================================
async function createOfficialAdFromJson(body: any, admin: { id: string }): Promise<Response> {
  const json = (status: number, payload: object) =>
    new Response(JSON.stringify({ success: status < 400, ...payload }), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const s = (v: unknown) => stripTags(String(v ?? '').trim());
    const ad: OfficialAdInput = {
      headline: s(body.headline).slice(0, 120),
      businessName: s(body.businessName).slice(0, 100),
      description: s(body.description),
      contactPhone: s(body.contactPhone).slice(0, 40),
      location: s(body.location).slice(0, 150),
      whatsapp: s(body.whatsapp).slice(0, 40),
    };

    if (!ad.headline || !ad.businessName) {
      return json(400, { message: 'Headline and business name are required' });
    }

    const rawImages: any[] = Array.isArray(body.imagesBase64) ? body.imagesBase64 : [];
    if (rawImages.length > ADVERT_LIMITS.maxImages) {
      console.warn(`Official ad rejected (json): ${rawImages.length} images (max ${ADVERT_LIMITS.maxImages})`);
      return json(400, { message: `Maximum ${ADVERT_LIMITS.maxImages} images` });
    }

    const accepted: { buf: Buffer; kind: string }[] = [];
    for (const item of rawImages) {
      const data = typeof item?.data === 'string' ? item.data : '';
      if (!data) {
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      const buf = Buffer.from(data, 'base64');
      if (buf.length === 0) {
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      if (buf.length > ADVERT_LIMITS.maxImageBytes) {
        console.warn(`Official ad image rejected (json): ${buf.length} bytes after decode`);
        return json(400, { message: 'Each image must be under 5MB' });
      }
      const kind = sniffImageType(buf);
      if (!kind) {
        console.warn(`Official ad image rejected (json): bad magic bytes (claimed type: ${item?.mime || 'unknown'})`);
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      accepted.push({ buf, kind });
    }

    return saveOfficialAd(ad, accepted, admin, json);
  } catch (error) {
    console.error('Admin official-ad create (json) error:', error);
    return json(500, { message: 'Failed to create official ad' });
  }
}

// ============================================================
// DELETE /api/admin/adverts — { id } (JSON body)
// Removes the row and its uploaded image files from disk.
// ============================================================
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return new Response(JSON.stringify({ success: false, message: 'Valid id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;
    const rows = await sql`
      SELECT id, image_urls FROM user_business_adverts WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Advert not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`DELETE FROM user_business_adverts WHERE id = ${id}`;

    // Best-effort disk cleanup of this advert's images (server-generated
    // names only — never trust stored paths beyond the adverts dir).
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'adverts');
    for (const u of parseImageUrls(rows[0].image_urls)) {
      const fname = path.basename(u);
      if (/^ad_[a-f0-9]{8}_[0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i.test(fname)) {
        try { fs.unlinkSync(path.join(uploadDir, fname)); } catch { /* already gone */ }
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Advert deleted' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin adverts DELETE error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to delete advert' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
