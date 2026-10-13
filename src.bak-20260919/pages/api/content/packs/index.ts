export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const sql = client;

    // Get all active premium packs
    const packs = await sql`
      SELECT 
        id,
        name,
        slug,
        description,
        long_description,
        price,
        is_free,
        icon_svg,
        thumbnail_url,
        category,
        is_active,
        display_order,
        created_at
      FROM premium_packs 
      WHERE is_active = true 
      ORDER BY display_order
    `;

    // Get user's purchased packs (both free and paid)
    let purchasedPackIds: string[] = [];
    if (userId) {
      const purchased = await sql`
        SELECT pack_id FROM course_purchases WHERE user_id = ${userId}
      `;
      purchasedPackIds = purchased.map((o: any) => o.pack_id);
    }

    // Get item counts and format response
    const packsWithData = await Promise.all(packs.map(async (pack: any) => {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM premium_content_items WHERE pack_id = ${pack.id}
      `;
      
      const previewItems = await sql`
        SELECT id, title, content_type, file_url, link_type
        FROM premium_content_items 
        WHERE pack_id = ${pack.id} 
        ORDER BY display_order
      `;

      // Check if user owns this pack (free or purchased)
      const isOwned = pack.is_free || purchasedPackIds.includes(pack.id);

      return {
        id: pack.id,
        name: pack.name,
        slug: pack.slug,
        description: pack.description || '',
        longDescription: pack.long_description || pack.description || '',
        price: parseFloat(pack.price || 0),
        isFree: pack.is_free || false,
        iconSvg: pack.icon_svg || '',
        thumbnailUrl: pack.thumbnail_url || '',
        category: pack.category || 'General',
        isActive: pack.is_active,
        displayOrder: pack.display_order,
        createdAt: pack.created_at,
        itemCount: parseInt(countResult[0]?.count || '0'),
        isOwned: isOwned,
        previewItems: previewItems || []
      };
    }));

    return new Response(JSON.stringify({
      success: true,
      packs: packsWithData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Packs API error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: err.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
