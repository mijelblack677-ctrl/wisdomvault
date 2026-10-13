export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';  // ✅ Use @db alias instead of relative path

export const GET: APIRoute = async ({ request }) => {
  const sql = client;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('📚 Library request for user:', userId);

    // ✅ Check which columns exist in content_items
    let hasLinkType = false;
    let hasIsPremium = false;
    let hasPrice = false;
    try {
      const colCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'content_items' 
        AND column_name IN ('link_type', 'is_premium', 'price')
      `;
      const existingCols = colCheck.map((c: any) => c.column_name);
      hasLinkType = existingCols.includes('link_type');
      hasIsPremium = existingCols.includes('is_premium');
      hasPrice = existingCols.includes('price');
    } catch (e) {
      console.log('⚠️ Could not check content_items columns');
    }

    // Build query based on available columns
    let items;
    if (hasLinkType && hasIsPremium && hasPrice) {
      items = await sql`
        SELECT 
          ci.id, ci.category_id, ci.title, ci.slug, ci.description,
          ci.content_type, ci.file_url, ci.thumbnail_url, ci.author,
          ci.is_featured, ci.is_published, ci.created_at,
          ci.link_type, ci.is_premium, ci.price,
          cc.name as category_name, cc.slug as category_slug
        FROM content_items ci
        JOIN content_categories cc ON ci.category_id = cc.id
        WHERE ci.is_published = true AND ci.content_type != 'guide'
        ORDER BY cc.display_order, ci.is_featured DESC, ci.created_at DESC
      `;
    } else {
      items = await sql`
        SELECT 
          ci.id, ci.category_id, ci.title, ci.slug, ci.description,
          ci.content_type, ci.file_url, ci.thumbnail_url, ci.author,
          ci.is_featured, ci.is_published, ci.created_at,
          cc.name as category_name, cc.slug as category_slug
        FROM content_items ci
        JOIN content_categories cc ON ci.category_id = cc.id
        WHERE ci.is_published = true AND ci.content_type != 'guide'
        ORDER BY cc.display_order, ci.is_featured DESC, ci.created_at DESC
      `;
    }

    console.log('📚 Total items found:', items.length);

    // Get user's purchased content
    let purchasedContentIds: string[] = [];
    if (userId) {
      try {
        const purchased = await sql`
          SELECT content_id FROM user_content_purchases WHERE user_id = ${userId}
        `;
        purchasedContentIds = purchased.map((o: any) => o.content_id);
        console.log('📚 User purchased content IDs:', purchasedContentIds);
      } catch (e) {
        console.log('📚 Could not fetch purchases:', e);
      }
    }

    // Get categories with counts
    const categories = await sql`
      SELECT 
        cc.id,
        cc.name,
        cc.slug,
        cc.description,
        cc.icon_svg,
        cc.display_order,
        COUNT(ci.id) as item_count
      FROM content_categories cc
      LEFT JOIN content_items ci ON ci.category_id = cc.id AND ci.is_published = true AND ci.content_type != 'guide'
      WHERE cc.is_active = true
      GROUP BY cc.id
      ORDER BY cc.display_order
    `;

    // For each item, determine if user owns it
    const itemsWithAccess = items.map((item: any) => {
      const isPremium = hasIsPremium ? (item.is_premium || false) : false;
      const price = hasPrice ? (parseFloat(item.price || 0)) : 0;
      const linkType = hasLinkType ? (item.link_type || 'url') : 'url';
      // For free content, always owned. For premium, check if purchased.
      const isOwned = !isPremium || purchasedContentIds.includes(item.id);
      
      return {
        id: item.id,
        category_id: item.category_id,
        title: item.title,
        slug: item.slug,
        description: item.description || '',
        content_type: item.content_type,
        file_url: item.file_url || '',
        thumbnail_url: item.thumbnail_url || '',
        author: item.author || 'Unknown Author',
        is_featured: item.is_featured,
        is_published: item.is_published,
        created_at: item.created_at,
        link_type: linkType,
        is_premium: isPremium,
        price: price,
        is_owned: isOwned,
        category_name: item.category_name,
        category_slug: item.category_slug
      };
    });

    return new Response(JSON.stringify({
      success: true,
      items: itemsWithAccess,
      categories,
      totalItems: items.length,
      userId: userId || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Library API error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to fetch library',
      error: err.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
