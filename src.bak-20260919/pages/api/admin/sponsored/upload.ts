export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '../../../../lib/db/connection';
import fs from 'fs';
import path from 'path';

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const sql = client;

    const sessions = await sql`SELECT * FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
    if (sessions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sponsoredId = formData.get('sponsoredId') as string;

    if (!file || !sponsoredId) {
      return new Response(JSON.stringify({ success: false, message: 'File and sponsored ID required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save file
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `sponsored_${timestamp}_${safeName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${filename}`;

    // Update the sponsored content with file URL
    await sql`
      UPDATE sponsored_content SET file_url = ${fileUrl} WHERE id = ${sponsoredId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Media file uploaded',
      fileUrl,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
