export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
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
    const contentId = formData.get('contentId') as string;
    const packItemId = formData.get('packItemId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const packId = formData.get('packId') as string;

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'No file uploaded' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ No file size limit - accept any size
    // Note: Vercel serverless has a 4.5MB body limit by default for API routes
    // For larger files, consider using cloud storage (S3, Cloudflare R2, etc.)

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${filename}`;

    // Determine file type from extension
    const ext = path.extname(filename).toLowerCase();
    const typeMap: Record<string, string> = {
      '.pdf': 'pdf', '.doc': 'pdf', '.docx': 'pdf',
      '.mp4': 'video', '.mov': 'video', '.avi': 'video', '.webm': 'video',
      '.mp3': 'audio', '.wav': 'audio', '.m4a': 'audio',
      '.epub': 'ebook', '.mobi': 'ebook',
      '.jpg': 'guide', '.jpeg': 'guide', '.png': 'guide',
    };
    const contentType = typeMap[ext] || 'guide';

    // If packId is provided, create a NEW premium content item in that pack
    if (packId) {
      // ✅ Check if link_type column exists before using it
      let hasLinkType = false;
      try {
        const colCheck = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'premium_content_items' 
          AND column_name = 'link_type'
        `;
        hasLinkType = colCheck.length > 0;
      } catch (e) {
        console.log('⚠️ Could not check link_type column');
      }

      let newItem;
      if (hasLinkType) {
        newItem = await sql`
          INSERT INTO premium_content_items (pack_id, title, description, content_type, file_url, link_type)
          VALUES (${packId}, ${title || file.name}, ${description || ''}, ${contentType}, ${fileUrl}, ${contentType})
          RETURNING *
        `;
      } else {
        newItem = await sql`
          INSERT INTO premium_content_items (pack_id, title, description, content_type, file_url)
          VALUES (${packId}, ${title || file.name}, ${description || ''}, ${contentType}, ${fileUrl})
          RETURNING *
        `;
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'File uploaded and added to pack as new resource',
        fileUrl,
        item: newItem[0],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // If packItemId, update existing pack item
    if (packItemId) {
      await sql`
        UPDATE premium_content_items SET file_url = ${fileUrl} WHERE id = ${packItemId}
      `;
      return new Response(JSON.stringify({
        success: true,
        message: 'File uploaded and linked to pack item',
        fileUrl,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // If contentId, update free content item
    if (contentId) {
      await sql`
        UPDATE content_items SET file_url = ${fileUrl} WHERE id = ${contentId}
      `;
      return new Response(JSON.stringify({
        success: true,
        message: 'File uploaded and linked to content',
        fileUrl,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // If no target specified, just return the uploaded URL
    return new Response(JSON.stringify({
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
      contentType,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    const err = error as Error;
    console.error('Upload error:', err);
    
    // Provide more helpful error messages
    let message = err.message;
    if (message.includes('PayloadTooLarge') || message.includes('too large')) {
      message = 'File is too large. Maximum file size is 4.5MB for API routes. Consider using cloud storage for larger files.';
    } else if (message.includes('ENOENT')) {
      message = 'Upload directory not found. Please try again.';
    } else if (message.includes('EACCES')) {
      message = 'Permission denied. Cannot write to upload directory.';
    }
    
    return new Response(JSON.stringify({ success: false, message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
