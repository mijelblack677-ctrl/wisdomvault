export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { client } from '@db';

// ============================================================
// Admin vacancies API — mirrors /api/admin/adverts but for job
// vacancies published directly by the admin. No user submissions,
// no moderation lifecycle: a vacancy is live the moment it is
// published, and can be closed / reopened / deleted.
// Description is intentionally unlimited (TEXT column).
// ============================================================

const VACANCY_IMAGE_LIMITS = { maxImages: 3, maxImageBytes: 5 * 1024 * 1024 };

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
// GET /api/admin/vacancies — all vacancies, newest first, + counts
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;
    const rows = await sql`
      SELECT * FROM vacancies
      ORDER BY is_active DESC, created_at DESC
      LIMIT 200
    `;

    const counts = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active)::int AS active,
        COUNT(*) FILTER (WHERE NOT is_active)::int AS closed
      FROM vacancies
    `;
    const c = (counts && counts[0]) || { total: 0, active: 0, closed: 0 };

    const vacancies = (rows || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      company: v.company,
      description: v.description || '',
      location: v.location || '',
      contactPhone: v.contact_phone || '',
      whatsapp: v.whatsapp || '',
      images: parseImageUrls(v.image_urls),
      isActive: v.is_active || false,
      viewCount: v.view_count || 0,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }));

    return new Response(JSON.stringify({ success: true, vacancies, counts: c }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin vacancies GET error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to load vacancies' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// POST /api/admin/vacancies
//  - multipart/form-data → publish a vacancy (0–3 images)
//  - application/json with official:true → same, base64 compat path
//    (fetch-intercepting browser extensions re-encode FormData as JSON)
//  - application/json { id, action: 'close'|'reopen' } → toggle visibility
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
      return createVacancy(request, admin);
    }

    const body = await request.json().catch(() => ({})) as any;

    // Compatibility path for extensions that re-encode multipart as JSON.
    if (body && typeof body === 'object' && body.official === true) {
      return createVacancyFromJson(body, admin);
    }

    const { id, action } = body || {};

    if (!id || !['close', 'reopen'].includes(action)) {
      console.warn(`Admin vacancies toggle missing id/action (content-type: ${contentType || 'none'})`);
      return new Response(JSON.stringify({ success: false, message: 'id and action (close|reopen) required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const sql = client;
    const rows = await sql`
      SELECT id, is_active FROM vacancies WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Vacancy not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const newActive = action === 'reopen';
    if (rows[0].is_active === newActive) {
      return new Response(JSON.stringify({ success: true, message: newActive ? 'Already open' : 'Already closed' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`
      UPDATE vacancies
      SET is_active = ${newActive}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return new Response(JSON.stringify({ success: true, message: newActive ? 'Vacancy is live' : 'Vacancy closed' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin vacancies POST error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update vacancy' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ============================================================
// Vacancy persistence shared by the multipart and JSON paths.
// Images arrive pre-validated (magic bytes + size caps).
// ============================================================
async function saveVacancy(
  v: { title: string; company: string; description: string; location: string; contactPhone: string; whatsapp: string },
  accepted: { buf: Buffer; kind: string }[],
  admin: { id: string },
  fail: (status: number, payload: object) => Response
): Promise<Response> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vacancies');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const imageUrls: string[] = [];
    const written: string[] = [];
    try {
      for (const { buf, kind } of accepted) {
        const filename = `vac_${admin.id.slice(0, 8)}_${Date.now()}_${imageUrls.length}.${kind}`;
        fs.writeFileSync(path.join(uploadDir, filename), buf);
        written.push(filename);
        imageUrls.push(`/api/vacancy-images/${filename}`);
      }
    } catch {
      for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* gone */ } }
      return fail(500, { message: 'Could not save images' });
    }

    const sql = client;
    try {
      const inserted = await sql`
        INSERT INTO vacancies
          (title, company, description, location, contact_phone, whatsapp,
           image_urls, is_active, created_by, created_at, updated_at)
        VALUES
          (${v.title}, ${v.company}, ${v.description || null}, ${v.location || null},
           ${v.contactPhone || null}, ${v.whatsapp || null},
           ${JSON.stringify(imageUrls)}, true, ${admin.id}, NOW(), NOW())
        RETURNING id
      `;
      return fail(201, { message: 'Vacancy published', id: inserted[0]?.id });
    } catch (e) {
      // Nothing stored — don't leave orphan image files.
      for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* gone */ } }
      throw e;
    }
  } catch (error) {
    console.error('Admin vacancy create error:', error);
    return fail(500, { message: 'Failed to create vacancy' });
  }
}

// ============================================================
// Vacancy creation, multipart path (normal browsers).
// ============================================================
async function createVacancy(request: Request, admin: { id: string }): Promise<Response> {
  const json = (status: number, payload: object) =>
    new Response(JSON.stringify({ success: status < 400, ...payload }), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const form = await request.formData();

    const text = (k: string) => stripTags(String(form.get(k) || '').trim());
    const v = {
      title: text('title').slice(0, 120),
      company: text('company').slice(0, 100),
      description: text('description'), // unlimited by design
      location: text('location').slice(0, 150),
      contactPhone: text('contactPhone').slice(0, 40),
      whatsapp: text('whatsapp').slice(0, 40),
    };

    if (!v.title || !v.company) {
      return json(400, { message: 'Job title and company are required' });
    }

    const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > VACANCY_IMAGE_LIMITS.maxImages) {
      console.warn(`Vacancy rejected: ${files.length} images (max ${VACANCY_IMAGE_LIMITS.maxImages})`);
      return json(400, { message: `Maximum ${VACANCY_IMAGE_LIMITS.maxImages} images` });
    }

    // Two-pass: validate everything before anything touches disk.
    const accepted: { buf: Buffer; kind: string }[] = [];
    for (const file of files) {
      if (file.size > VACANCY_IMAGE_LIMITS.maxImageBytes) {
        console.warn(`Vacancy image rejected: ${file.size} bytes (${file.type || 'unknown type'}, name: ${file.name?.slice(0, 60)})`);
        return json(400, { message: 'Each image must be under 5MB' });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniffImageType(buf);
      if (!kind) {
        console.warn(`Vacancy image rejected: bad magic bytes (claimed type: ${file.type || 'unknown'}, name: ${file.name?.slice(0, 60)})`);
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      accepted.push({ buf, kind });
    }

    return saveVacancy(v, accepted, admin, json);
  } catch (error) {
    console.error('Admin vacancy create error:', error);
    return json(500, { message: 'Failed to create vacancy' });
  }
}

// ============================================================
// Vacancy creation, JSON + base64 path (see POST note).
// ============================================================
async function createVacancyFromJson(body: any, admin: { id: string }): Promise<Response> {
  const json = (status: number, payload: object) =>
    new Response(JSON.stringify({ success: status < 400, ...payload }), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const s = (val: unknown) => stripTags(String(val ?? '').trim());
    const v = {
      title: s(body.title).slice(0, 120),
      company: s(body.company).slice(0, 100),
      description: s(body.description), // unlimited by design
      location: s(body.location).slice(0, 150),
      contactPhone: s(body.contactPhone).slice(0, 40),
      whatsapp: s(body.whatsapp).slice(0, 40),
    };

    if (!v.title || !v.company) {
      return json(400, { message: 'Job title and company are required' });
    }

    const rawImages: any[] = Array.isArray(body.imagesBase64) ? body.imagesBase64 : [];
    if (rawImages.length > VACANCY_IMAGE_LIMITS.maxImages) {
      console.warn(`Vacancy rejected (json): ${rawImages.length} images (max ${VACANCY_IMAGE_LIMITS.maxImages})`);
      return json(400, { message: `Maximum ${VACANCY_IMAGE_LIMITS.maxImages} images` });
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
      if (buf.length > VACANCY_IMAGE_LIMITS.maxImageBytes) {
        console.warn(`Vacancy image rejected (json): ${buf.length} bytes after decode`);
        return json(400, { message: 'Each image must be under 5MB' });
      }
      const kind = sniffImageType(buf);
      if (!kind) {
        console.warn(`Vacancy image rejected (json): bad magic bytes (claimed type: ${item?.mime || 'unknown'})`);
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      accepted.push({ buf, kind });
    }

    return saveVacancy(v, accepted, admin, json);
  } catch (error) {
    console.error('Admin vacancy create (json) error:', error);
    return json(500, { message: 'Failed to create vacancy' });
  }
}

// ============================================================
// PUT /api/admin/vacancies — edit an existing vacancy.
//  - multipart/form-data → edit incl. new image upload. Fields:
//      id (required), title, company, description, location,
//      contactPhone, whatsapp, keepImages (JSON array of existing
//      image URLs to keep), images (0–3 new files).
//  - application/json { edit: true, ...same fields, imagesBase64? }
//    → compatibility path for fetch-intercepting browser extensions
//    that re-encode multipart bodies as JSON. Without the explicit
//    edit:true marker a mangled body is rejected with 400 so it can
//    never silently wipe a vacancy's images.
// Kept images survive; dropped/replaced files are removed from disk
// only after a successful DB update.
// ============================================================
export const PUT: APIRoute = async ({ request }) => {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      return updateVacancyMultipart(request, admin);
    }

    const body = await request.json().catch(() => ({})) as any;
    if (!(body && typeof body === 'object' && body.edit === true)) {
      console.warn(`Admin vacancies PUT missing edit flag (content-type: ${contentType || 'none'})`);
      return new Response(JSON.stringify({ success: false, message: 'edit flag required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    return updateVacancyFromJson(body, admin);
  } catch (error) {
    console.error('Admin vacancies PUT error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to update vacancy' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** Validate the keepImages list — only our own server-generated URLs. */
function parseKeepImages(raw: unknown): string[] | null {
  let arr: unknown = raw;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch { return null; }
  }
  if (!Array.isArray(arr)) return null;
  const out: string[] = [];
  for (const u of arr) {
    if (typeof u !== 'string') return null;
    if (!/^\/api\/vacancy-images\/vac_[a-f0-9]{8}_[0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i.test(u)) return null;
    out.push(u);
  }
  return out;
}

// ============================================================
// Shared update core: writes new images first, updates the row, then
// removes dropped image files. Nothing is lost if the DB update fails.
// ============================================================
async function applyVacancyUpdate(
  id: string,
  v: { title: string; company: string; description: string; location: string; contactPhone: string; whatsapp: string },
  keepImages: string[],
  accepted: { buf: Buffer; kind: string }[],
  admin: { id: string },
  fail: (status: number, payload: object) => Response
): Promise<Response> {
  if (keepImages.length + accepted.length > VACANCY_IMAGE_LIMITS.maxImages) {
    return fail(400, { message: `Maximum ${VACANCY_IMAGE_LIMITS.maxImages} images` });
  }

  const sql = client;
  const rows = await sql`
    SELECT image_urls FROM vacancies WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) {
    return fail(404, { message: 'Vacancy not found' });
  }
  const existing = parseImageUrls(rows[0].image_urls);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vacancies');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const written: string[] = [];
  const newUrls: string[] = [];
  try {
    for (const { buf, kind } of accepted) {
      const filename = `vac_${admin.id.slice(0, 8)}_${Date.now()}_${newUrls.length}.${kind}`;
      fs.writeFileSync(path.join(uploadDir, filename), buf);
      written.push(filename);
      newUrls.push(`/api/vacancy-images/${filename}`);
    }

    const finalUrls = [...keepImages, ...newUrls];
    await sql`
      UPDATE vacancies
      SET title = ${v.title},
          company = ${v.company},
          description = ${v.description || null},
          location = ${v.location || null},
          contact_phone = ${v.contactPhone || null},
          whatsapp = ${v.whatsapp || null},
          image_urls = ${JSON.stringify(finalUrls)},
          updated_at = NOW()
      WHERE id = ${id}
    `;
  } catch (e) {
    // Row not updated (or updated without new files) — clean up orphans.
    for (const f of written) { try { fs.unlinkSync(path.join(uploadDir, f)); } catch { /* gone */ } }
    throw e;
  }

  // Remove image files that were dropped (not kept, not freshly written).
  const keptSet = new Set(keepImages);
  for (const u of existing) {
    if (keptSet.has(u)) continue;
    const fname = path.basename(u);
    if (/^vac_[a-f0-9]{8}_[0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i.test(fname)) {
      try { fs.unlinkSync(path.join(uploadDir, fname)); } catch { /* already gone */ }
    }
  }

  return fail(200, { message: 'Vacancy updated' });
}

// ============================================================
// Edit, multipart path (normal browsers).
// ============================================================
async function updateVacancyMultipart(request: Request, admin: { id: string }): Promise<Response> {
  const json = (status: number, payload: object) =>
    new Response(JSON.stringify({ success: status < 400, ...payload }), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const form = await request.formData();

    const id = String(form.get('id') || '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return json(400, { message: 'Valid id required' });
    }

    const text = (k: string) => stripTags(String(form.get(k) || '').trim());
    const v = {
      title: text('title').slice(0, 120),
      company: text('company').slice(0, 100),
      description: text('description'), // unlimited by design
      location: text('location').slice(0, 150),
      contactPhone: text('contactPhone').slice(0, 40),
      whatsapp: text('whatsapp').slice(0, 40),
    };
    if (!v.title || !v.company) {
      return json(400, { message: 'Job title and company are required' });
    }

    const keepImages = parseKeepImages(form.get('keepImages'));
    if (keepImages === null) {
      return json(400, { message: 'keepImages must be a JSON array of valid image URLs' });
    }

    const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (keepImages.length + files.length > VACANCY_IMAGE_LIMITS.maxImages) {
      return json(400, { message: `Maximum ${VACANCY_IMAGE_LIMITS.maxImages} images` });
    }

    const accepted: { buf: Buffer; kind: string }[] = [];
    for (const file of files) {
      if (file.size > VACANCY_IMAGE_LIMITS.maxImageBytes) {
        return json(400, { message: 'Each image must be under 5MB' });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const kind = sniffImageType(buf);
      if (!kind) {
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      accepted.push({ buf, kind });
    }

    return applyVacancyUpdate(id, v, keepImages, accepted, admin, json);
  } catch (error) {
    console.error('Admin vacancy update error:', error);
    return json(500, { message: 'Failed to update vacancy' });
  }
}

// ============================================================
// Edit, JSON + base64 path (explicit edit:true marker only).
// ============================================================
async function updateVacancyFromJson(body: any, admin: { id: string }): Promise<Response> {
  const json = (status: number, payload: object) =>
    new Response(JSON.stringify({ success: status < 400, ...payload }), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return json(400, { message: 'Valid id required' });
    }

    const s = (val: unknown) => stripTags(String(val ?? '').trim());
    const v = {
      title: s(body.title).slice(0, 120),
      company: s(body.company).slice(0, 100),
      description: s(body.description), // unlimited by design
      location: s(body.location).slice(0, 150),
      contactPhone: s(body.contactPhone).slice(0, 40),
      whatsapp: s(body.whatsapp).slice(0, 40),
    };
    if (!v.title || !v.company) {
      return json(400, { message: 'Job title and company are required' });
    }

    const keepImages = parseKeepImages(body.keepImages);
    if (keepImages === null) {
      return json(400, { message: 'keepImages must be a JSON array of valid image URLs' });
    }

    const rawImages: any[] = Array.isArray(body.imagesBase64) ? body.imagesBase64 : [];
    if (keepImages.length + rawImages.length > VACANCY_IMAGE_LIMITS.maxImages) {
      return json(400, { message: `Maximum ${VACANCY_IMAGE_LIMITS.maxImages} images` });
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
      if (buf.length > VACANCY_IMAGE_LIMITS.maxImageBytes) {
        return json(400, { message: 'Each image must be under 5MB' });
      }
      const kind = sniffImageType(buf);
      if (!kind) {
        return json(400, { message: 'Only JPG, PNG or WebP images are allowed' });
      }
      accepted.push({ buf, kind });
    }

    return applyVacancyUpdate(id, v, keepImages, accepted, admin, json);
  } catch (error) {
    console.error('Admin vacancy update (json) error:', error);
    return json(500, { message: 'Failed to update vacancy' });
  }
}

// ============================================================
// DELETE /api/admin/vacancies — { id } (JSON body)
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
      SELECT id, image_urls FROM vacancies WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Vacancy not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`DELETE FROM vacancies WHERE id = ${id}`;

    // Best-effort disk cleanup of this vacancy's images (server-generated
    // names only — never trust stored paths beyond the vacancies dir).
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vacancies');
    for (const u of parseImageUrls(rows[0].image_urls)) {
      const fname = path.basename(u);
      if (/^vac_[a-f0-9]{8}_[0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i.test(fname)) {
        try { fs.unlinkSync(path.join(uploadDir, fname)); } catch { /* already gone */ }
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Vacancy deleted' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin vacancies DELETE error:', error);
    return new Response(JSON.stringify({ success: false, message: 'Failed to delete vacancy' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
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
