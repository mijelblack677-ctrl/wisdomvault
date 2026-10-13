export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async () => {
  const sql = client;

  try {
    // ✅ Get ALL published guides
    const items = await sql`
      SELECT 
        ci.id,
        ci.title,
        ci.description,
        ci.content_type,
        ci.file_url,
        ci.thumbnail_url,
        ci.author,
        ci.created_at,
        ci.link_type,
        ci.is_published,
        ci.steps,
        ci.tips,
        cc.name as category_name,
        cc.slug as category_slug
      FROM content_items ci
      JOIN content_categories cc ON ci.category_id = cc.id
      WHERE ci.content_type = 'guide' AND ci.is_published = true
      ORDER BY ci.created_at DESC
    `;

    console.log('📚 Found guides:', items.length);

    // Get categories
    const categories = await sql`
      SELECT * FROM content_categories WHERE is_active = true ORDER BY display_order
    `;

    return new Response(JSON.stringify({
      success: true,
      items: items || [],
      categories: categories || [],
      totalItems: items.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('How-to guides error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
