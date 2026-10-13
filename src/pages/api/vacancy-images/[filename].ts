export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

// GET /api/vacancy-images/[filename]
//
// Serves admin-uploaded vacancy images from public/uploads/vacancies.
// Needed because the app runs in SSR (`output: 'server'`): Astro only serves
// files that existed in public/ at BUILD time, but vacancy images are uploaded
// at RUNTIME — so /uploads/vacancies/* would 404 in production.
// Same pattern as /api/advert-images/[filename].
//
// Public on purpose: live vacancies are shown to all logged-in users, and the
// images are inert photos (magic-byte sniffed at upload, no HTML/script
// content possible). Filenames are server-generated
// (vac_<adminid8>_<ts>_<n>.<ext>) and re-validated here.
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export const GET: APIRoute = async ({ params }) => {
  const raw = params.filename || '';

  // ── Path-traversal protection (same pattern as /api/advert-images) ──
  const safeName = path.basename(raw);
  if (!safeName || safeName !== raw || safeName.startsWith('.')) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const base = path.basename(safeName, ext);

  // Only ever serve our own server-generated vacancy images.
  if (!ALLOWED_EXT.has(ext.slice(1)) || !/^vac_[a-f0-9]{8}_[0-9]+_[0-9]+$/.test(base)) {
    return new Response('Not found', { status: 404 });
  }

  const vacanciesRoot = path.resolve(process.cwd(), 'public', 'uploads', 'vacancies');
  const filePath = path.resolve(vacanciesRoot, safeName);
  if (!filePath.startsWith(vacanciesRoot + path.sep)) {
    return new Response('Not found', { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = fs.readFileSync(filePath);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${safeName}"`,
      // Filenames are unique per upload — safe to cache aggressively.
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
