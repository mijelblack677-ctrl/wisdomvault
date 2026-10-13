export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { client } from '@db';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { filename } = params;
    
    if (!filename) {
      return new Response('File not found', { status: 404 });
    }

    // Get user from query param
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }

    const sql = client;

    // Check free content
    const freeContent = await sql`
      SELECT id FROM content_items 
      WHERE file_url = ${'/uploads/' + filename} AND is_published = true
    `;

    if (freeContent.length > 0) {
      if (userId) {
        const userCheck = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = true`;
        if (userCheck.length > 0) {
          return serveFile(filePath, filename);
        }
      }
      return new Response('Login required to access files', { status: 401 });
    }

    // Check premium pack content
    const packContent = await sql`
      SELECT pci.pack_id 
      FROM premium_content_items pci
      WHERE pci.file_url = ${'/uploads/' + filename}
    `;

    if (packContent.length > 0) {
      if (!userId) {
        return new Response('Login required', { status: 401 });
      }

      const packId = packContent[0].pack_id;
      const ownership = await sql`
        SELECT id FROM user_premium_packs 
        WHERE user_id = ${userId} AND pack_id = ${packId}
      `;

      if (ownership.length > 0) {
        return serveFile(filePath, filename);
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
