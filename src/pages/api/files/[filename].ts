export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { client } from '@db';
import { getAuthUser } from '@lib/auth';

// GET /api/files/[filename]?userId=...
//
// Serves uploaded content behind access rules. SECURITY:
//  - `filename` is sanitized: any path traversal (../, absolute paths, NUL,
//    hidden dot-files) is rejected and the resolved path must stay inside
//    public/uploads. Previously ../ could escape into arbitrary server files.
//  - Access is checked against the AUTHENTICATED session user (Bearer token).
//    The old ?userId= check let anyone read premium files by guessing ids.
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { filename } = params;

    if (!filename) {
      return new Response('File not found', { status: 404 });
    }

    // ── Path-traversal protection ─────────────────────────────────────
    const safeName = path.basename(filename);
    if (
      !safeName ||
      safeName !== filename ||
      safeName.startsWith('.') ||
      safeName.includes('/') ||
      safeName.includes('\\') ||
      safeName.includes('..') ||
      safeName.includes('\0')
    ) {
      return new Response('Invalid filename', { status: 400 });
    }

    const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
    const filePath = path.resolve(uploadsRoot, safeName);
    if (!filePath.startsWith(uploadsRoot + path.sep)) {
      return new Response('Invalid filename', { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }

    // ── Authentication: real session required ─────────────────────────
    const sessionUser = await getAuthUser(request);
    if (!sessionUser) {
      return new Response('Login required to access files', { status: 401 });
    }
    const userId = sessionUser.id;

    const sql = client;

    // Check free content
    const freeContent = await sql`
      SELECT id FROM content_items
      WHERE file_url = ${'/uploads/' + safeName} AND is_published = true
    `;

    if (freeContent.length > 0) {
      return serveFile(filePath, safeName);
    }

    // Check premium pack content
    const packContent = await sql`
      SELECT pci.pack_id
      FROM premium_content_items pci
      WHERE pci.file_url = ${'/uploads/' + safeName}
    `;

    if (packContent.length > 0) {
      const packId = packContent[0].pack_id;
      const ownership = await sql`
        SELECT id FROM user_premium_packs
        WHERE user_id = ${userId} AND pack_id = ${packId}
      `;

      if (ownership.length > 0) {
        return serveFile(filePath, safeName);
      }

      return new Response('Purchase required to access this file', { status: 403 });
    }

    return new Response('File not available', { status: 404 });

  } catch (error) {
    return new Response('Error serving file', { status: 500 });
  }
};

function serveFile(filePath: string, filename: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();

  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
  };

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
