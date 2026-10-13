export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import { checkRateLimit, clientIp, rateLimitResponse } from '@lib/rate-limit';
import { createNotification } from '@lib/notifications';
import {
  ADVERT_TEMPLATES,
  ADVERT_LIMITS,
  TEMPLATE_IDS,
  parseImageUrls,
} from '@lib/advertTemplates';

/** Naive but effective tag stripper for free-text advert fields (defense-in-depth). */
function stripTags(s: string): string {
  return s.replace(/<[^>]*>?/g, '');
}

// ============================================================
// GET — templates + the user's own adverts + today's submission state
// /api/user/adverts
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

    const mine = await sql`
      SELECT id, template, headline, business_name, description,
             contact_phone, location, whatsapp, image_urls,
             status, rejection_reason, created_at, view_count,
             is_official, sold
      FROM user_business_adverts
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `;

    const todayRow = await sql`
      SELECT COUNT(*)::int AS c
      FROM user_business_adverts
      WHERE user_id = ${user.id} AND created_date = CURRENT_DATE
        AND is_official = false
    `;

    const adverts = (mine || []).map((a: any) => ({
      id: a.id,
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
      isOfficial: a.is_official || false,
      sold: a.sold || false,
    }));

    return new Response(JSON.stringify({
      success: true,
      templates: ADVERT_TEMPLATES,
      limits: ADVERT_LIMITS,
      submittedToday: (todayRow[0]?.c || 0) > 0,
      adverts,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('User adverts GET error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to load adverts' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// POST — submit today's advert (multipart: fields + up to 3 images)
// ============================================================
export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit: 5 submissions per hour per IP (the daily limit is the real cap,
    // this just blunts scripted abuse)
    const ip = clientIp(request);
    const rl = checkRateLimit(`adverts:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;

    // ── One per day (pre-check for a friendly message; unique index is the hard stop)
    const todayCheck = await sql`
      SELECT id FROM user_business_adverts
      WHERE user_id = ${user.id} AND created_date = CURRENT_DATE
      LIMIT 1
    `;
    if (todayCheck.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'You already submitted an advert today. Come back tomorrow — one advert per day.',
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // ── Parse multipart form
    const form = await request.formData();
    // Defense-in-depth: strip HTML tags from free-text fields server-side.
    // The dashboard escapes on render, but sanitizing at rest protects any
    // future consumer that forgets to.
    const template = String(form.get('template') || '').trim();
    const headline = stripTags(String(form.get('headline') || '').trim()).slice(0, 120);
    const businessName = stripTags(String(form.get('businessName') || '').trim()).slice(0, 100);
    const description = stripTags(String(form.get('description') || '').trim());
    const contactPhone = stripTags(String(form.get('contactPhone') || '').trim()).slice(0, 40);
    const whatsapp = stripTags(String(form.get('whatsapp') || '').trim()).slice(0, 40);
    const location = stripTags(String(form.get('location') || '').trim()).slice(0, 150);

    if (!TEMPLATE_IDS.includes(template)) {
      return new Response(JSON.stringify({ success: false, message: 'Please choose a valid template' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!headline || !businessName) {
      return new Response(JSON.stringify({ success: false, message: 'Headline and business name are required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    // ── Images: 0–3, each ≤5MB, type sniffed from magic bytes (not the client MIME)
    const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > ADVERT_LIMITS.maxImages) {
      console.warn(`Advert rejected: ${files.length} images (max ${ADVERT_LIMITS.maxImages})`);
      return new Response(JSON.stringify({ success: false, message: `Maximum ${ADVERT_LIMITS.maxImages} images` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'adverts');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Two-pass: validate EVERY image (size + magic bytes) before anything
    // touches disk, so a rejected upload can never leave orphan files.
    const accepted: { buf: Buffer; kind: string }[] = [];
    for (const file of files) {
      if (file.size > ADVERT_LIMITS.maxImageBytes) {
        console.warn(`Advert image rejected: ${file.size} bytes (${file.type || 'unknown type'}, name: ${file.name?.slice(0, 60)})`);
        return new Response(JSON.stringify({ success: false, message: 'Each image must be under 5MB' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }

      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniffImageType(buf);
      if (!kind) {
        console.warn(`Advert image rejected: bad magic bytes (claimed type: ${file.type || 'unknown'}, name: ${file.name?.slice(0, 60)})`);
        return new Response(JSON.stringify({ success: false, message: 'Only JPG, PNG or WebP images are allowed' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      accepted.push({ buf, kind });
    }

    // Only now write to disk.
    const imageUrls: string[] = [];
    const written: string[] = [];
    try {
      for (const { buf, kind } of accepted) {
        const filename = `ad_${user.id.slice(0, 8)}_${Date.now()}_${imageUrls.length}.${kind}`;
        fs.writeFileSync(path.join(uploadDir, filename), buf);
        written.push(filename);
        imageUrls.push(`/uploads/adverts/${filename}`);
      }
    } catch {
      for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* already gone */ } }
      return new Response(JSON.stringify({ success: false, message: 'Could not save images' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Insert (unique index on user_id+created_date is the race-proof stop)
    try {
      const inserted = await sql`
        INSERT INTO user_business_adverts
          (user_id, template, headline, business_name, description,
           contact_phone, location, whatsapp, image_urls, status, created_date)
        VALUES
          (${user.id}, ${template}, ${headline}, ${businessName}, ${description || null},
           ${contactPhone || null}, ${location || null}, ${whatsapp || null},
           ${JSON.stringify(imageUrls)}, 'pending', CURRENT_DATE)
        RETURNING id
      `;

      await createNotification({
        userId: user.id,
        type: 'advert_submitted',
        title: 'Advert submitted for review',
        message: 'Your business advert was received and is waiting for admin approval. You will be notified once it is reviewed.',
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Advert submitted! It will be reviewed by admin before appearing to other users.',
        id: inserted[0]?.id,
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
      // Insert failed — nothing is stored, so don't leave orphan image files.
      for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* already gone */ } }
      if (String(e?.message || '').includes('user_adverts_one_per_day_idx')) {
        return new Response(JSON.stringify({
          success: false, message: 'You already submitted an advert today.',
        }), { status: 429, headers: { 'Content-Type': 'application/json' } });
      }
      throw e;
    }
  } catch (error) {
    console.error('User adverts POST error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to submit advert' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** Sniff image type from magic bytes — never trust the client-supplied MIME. */
function sniffImageType(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  // WebP: RIFF....WEBP
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

// ============================================================
// PATCH /api/user/adverts — owner actions on their own advert.
// Body (JSON): { id, action: 'delete' | 'mark-sold' | 'mark-available' }
//   delete          — removes the advert row + its uploaded images
//   mark-sold       — sets sold = true (stays listed with a SOLD banner)
//   mark-available  — sets sold = false (undo)
// ============================================================
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === 'string' ? body.id : '';
    const action = typeof body?.action === 'string' ? body.action : '';

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
        !['delete', 'mark-sold', 'mark-available'].includes(action)) {
      return new Response(JSON.stringify({ success: false, message: 'Valid id and action required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;

    // Ownership check — only the owner may touch their advert.
    const rows = await sql`
      SELECT id, image_urls, sold, user_id FROM user_business_adverts
      WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0 || rows[0].user_id !== user.id) {
      return new Response(JSON.stringify({ success: false, message: 'Advert not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    const advert = rows[0];

    if (action === 'delete') {
      await sql`DELETE FROM user_business_adverts WHERE id = ${id}`;
      // Best-effort disk cleanup (server-generated filenames only).
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'adverts');
      for (const u of parseImageUrls(advert.image_urls)) {
        const fname = path.basename(u);
        if (/^ad_[a-f0-9]{8}_[0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i.test(fname)) {
          try { fs.unlinkSync(path.join(uploadDir, fname)); } catch { /* already gone */ }
        }
      }
      return new Response(JSON.stringify({ success: true, message: 'Advert deleted' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sold = action === 'mark-sold';
    if (advert.sold === sold) {
      return new Response(JSON.stringify({ success: true, message: sold ? 'Already marked sold' : 'Already marked available' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    await sql`UPDATE user_business_adverts SET sold = ${sold} WHERE id = ${id}`;
    return new Response(JSON.stringify({ success: true, message: sold ? 'Advert marked as sold' : 'Advert marked as available' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('User adverts PATCH error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update advert' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
