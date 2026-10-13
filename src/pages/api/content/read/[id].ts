export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';
import {
  parseBookUrl,
  kindFromContentType,
  labelForKind,
  needsTextExtraction,
  contentTypeFor,
} from '@lib/bookSource';
import { verifyTicket, readCookie, issueTicket, ticketCookie, MEDIA_COOKIE } from '@lib/mediaTicket';
import { extractBookText } from '@lib/bookText';

// GET /api/content/read/[id]
//
// Serves a book to a signed-in reader. The upstream URL (usually a Google Drive
// link) is never sent to the browser: the server fetches the file and streams it
// back, so a member cannot copy the source link and share it.
//
//   ?mode=meta   → JSON describing the book, and installs the media ticket
//   ?mode=text   → JSON blocks of text (for .docx / .epub, which browsers can't render)
//   (default)    → the file itself, with Range support so a PDF can page as it loads
//
// Access: an authenticated session (Bearer) or a valid media ticket cookie, AND
// ownership of the item when it is premium. Both are checked here — the client
// hiding a purchase button is not a security control.

const MAX_META_BYTES = 2 * 1024 * 1024;   // ceiling for text extraction
const UPSTREAM_TIMEOUT_MS = 30_000;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', ...headers },
  });

/** Refuse anything that isn't a plain public http(s) address. */
function isPublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return false;
  // Block loopback / link-local / private ranges, including the cloud metadata IP.
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (host === '::1' || host.startsWith('[')) return false;
  return true;
}

/** Best-effort filename from an upstream Content-Disposition. */
function filenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const star = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    } catch {
      /* fall through */
    }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1].trim() : null;
}

/** Resolve a stored item to something we can actually fetch. */
function upstreamUrlFor(item: { file_url: string | null; link_type: string | null }) {
  const url = (item.file_url || '').trim();
  const src = parseBookUrl(url, item.link_type);

  if (src.driveId) {
    return {
      src,
      fetchUrl: `https://drive.usercontent.google.com/download?id=${src.driveId}&export=download`,
      localPath: null as string | null,
    };
  }

  // Files already on this server are read straight off disk.
  if (url.startsWith('/uploads/')) {
    const name = path.basename(url);
    const root = path.resolve(process.cwd(), 'public', 'uploads');
    const full = path.resolve(root, name);
    if (full.startsWith(root + path.sep) && fs.existsSync(full)) {
      return { src, fetchUrl: null as string | null, localPath: full };
    }
    return { src, fetchUrl: null, localPath: null };
  }

  if (isPublicHttpUrl(url)) {
    return { src, fetchUrl: url, localPath: null };
  }

  return { src, fetchUrl: null, localPath: null };
}

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id;
    if (!id) return json({ success: false, message: 'Missing book id' }, 400);

    // ── Authentication ────────────────────────────────────────────────
    // A Bearer token identifies the caller directly; the ticket cookie exists
    // only so an <iframe> (which sends no Authorization header) can be served.
    const sessionUser = await getAuthUser(request);
    let userId = sessionUser?.id ?? null;
    if (!userId) {
      userId = verifyTicket(readCookie(request.headers.get('cookie'), MEDIA_COOKIE));
    }
    if (!userId) return json({ success: false, message: 'Login required' }, 401);

    const sql = client;
    const rows = await sql`
      SELECT id, title, author, description, file_url, link_type, content_type, is_premium
      FROM content_items
      WHERE id = ${id} AND is_published = true
      LIMIT 1
    `;
    if (!rows.length) return json({ success: false, message: 'Book not found' }, 404);

    const item = rows[0] as any;

    // ── Ownership ─────────────────────────────────────────────────────
    if (item.is_premium) {
      const owned = await sql`
        SELECT id FROM user_content_purchases
        WHERE user_id = ${userId} AND content_id = ${item.id}
        LIMIT 1
      `;
      if (!owned.length) return json({ success: false, message: 'Purchase required' }, 403);
    }

    const { src, fetchUrl, localPath } = upstreamUrlFor(item);
    if (!fetchUrl && !localPath) {
      return json({ success: false, message: 'This book has no readable file' }, 404);
    }

    // ── mode=meta: describe the book and hand out a ticket ────────────
    if (new URL(request.url).searchParams.get('mode') === 'meta') {
      // Refine the format from the upstream response — Drive links carry no
      // extension, so this is the only way to tell a PDF from a Word file.
      let kind = src.kind;
      let ext = src.ext;
      let size: number | null = null;
      try {
        if (fetchUrl) {
          const head = await fetch(fetchUrl, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            signal: AbortSignal.timeout(10_000),
          });
          const name = filenameFromDisposition(head.headers.get('content-disposition'));
          const contentType = (head.headers.get('content-type') || '').split(';')[0];
          const refined = kindFromContentType(contentType, name ?? undefined);
          if (refined !== 'unknown') kind = refined;
          ext = name?.match(/\.([A-Za-z0-9]+)$/)?.[1]?.toLowerCase() ?? ext;
          const range = head.headers.get('content-range');
          size = range ? Number(range.split('/')[1]) || null : Number(head.headers.get('content-length')) || null;
        } else if (localPath) {
          size = fs.statSync(localPath).size;
        }
      } catch {
        // Non-fatal: fall back to whatever the URL alone told us.
      }

      const ticket = issueTicket(userId);
      return json(
        {
          success: true,
          id: item.id,
          title: item.title,
          author: item.author || '',
          description: item.description || '',
          kind,
          label: labelForKind(kind),
          ext,
          size,
          readable: kind !== 'unknown',
          textMode: needsTextExtraction(kind),
        },
        200,
        { 'Set-Cookie': ticketCookie(ticket) },
      );
    }

    // ── mode=text: extract .docx / .epub into blocks ──────────────────
    if (new URL(request.url).searchParams.get('mode') === 'text') {
      // Work out whether this is a .docx or an .epub: the URL may say, but for
      // a Drive link only the upstream filename gives it away.
      const guessExt =
        (src.ext && ['docx', 'epub'].includes(src.ext) ? src.ext : null) ||
        (await guessExtFromUpstream(fetchUrl)) ||
        (src.kind === 'epub' ? 'epub' : src.kind === 'word' ? 'docx' : null);

      if (!guessExt || !['docx', 'epub'].includes(guessExt)) {
        return json({ success: false, message: 'This book is not a readable document' }, 400);
      }

      const buf = await loadBuffer(fetchUrl, localPath);
      if (!buf) return json({ success: false, message: 'Could not read this file' }, 502);

      const blocks = extractBookText(buf, guessExt);
      if (!blocks.length) {
        return json({ success: false, message: 'No text could be extracted' }, 502);
      }
      return json({ success: true, kind: guessExt === 'epub' ? 'epub' : 'word', blocks });
    }

    // ── default: stream the file, passing Range through ───────────────
    return streamFile(request, fetchUrl, localPath, src.kind, src.ext);
  } catch (error) {
    const err = error as Error;
    console.error('Book read error:', err.message);
    return json({ success: false, message: 'Could not open this book' }, 500);
  }
};

async function guessExtFromUpstream(fetchUrl: string | null): Promise<string | null> {
  if (!fetchUrl) return null;
  try {
    const head = await fetch(fetchUrl, {
      headers: { Range: 'bytes=0-0' },
      signal: AbortSignal.timeout(10_000),
    });
    return filenameFromDisposition(head.headers.get('content-disposition'))
      ?.match(/\.([A-Za-z0-9]+)$/)?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

async function loadBuffer(fetchUrl: string | null, localPath: string | null): Promise<Buffer | null> {
  try {
    if (localPath) return fs.readFileSync(localPath);
    if (!fetchUrl) return null;
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 && buf.length <= MAX_META_BYTES * 20 ? buf : null;
  } catch {
    return null;
  }
}

async function streamFile(
  request: Request,
  fetchUrl: string | null,
  localPath: string | null,
  kind: string,
  ext: string | null,
): Promise<Response> {
  const range = request.headers.get('Range') || undefined;

  // Local file — serve it ourselves, honouring Range so PDFs can page.
  if (localPath) {
    const stat = fs.statSync(localPath);
    const headers = new Headers({
      'Content-Type': contentTypeFor(kind as any, ext),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=600',
    });

    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      const start = m?.[1] ? Number(m[1]) : 0;
      const end = m?.[2] ? Number(m[2]) : stat.size - 1;
      if (start >= stat.size) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${stat.size}` } });
      }
      const slice = fs.createReadStream(localPath, { start, end });
      headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      headers.set('Content-Length', String(end - start + 1));
      return new Response(slice as any, { status: 206, headers });
    }

    headers.set('Content-Length', String(stat.size));
    return new Response(fs.createReadStream(localPath) as any, { status: 200, headers });
  }

  if (!fetchUrl) return new Response('Not found', { status: 404 });

  const upstream = await fetch(fetchUrl, {
    headers: range ? { Range: range } : {},
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Upstream error', { status: 502 });
  }

  const name = filenameFromDisposition(upstream.headers.get('content-disposition'));
  const resolvedKind = kindFromContentType(upstream.headers.get('content-type') || '', name ?? undefined);
  const headers = new Headers({
    'Content-Type':
      resolvedKind !== 'unknown' ? contentTypeFor(resolvedKind, ext) : 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=600',
    // Inline so the browser views it rather than downloading it.
    'Content-Disposition': `inline${name ? `; filename="${name.replace(/"/g, '')}"` : ''}`,
  });
  for (const h of ['content-length', 'content-range']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(upstream.body as any, { status: upstream.status, headers });
}
