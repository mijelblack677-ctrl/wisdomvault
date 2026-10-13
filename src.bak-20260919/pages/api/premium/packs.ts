export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const sql = client;

    const packs = await sql`
      SELECT * FROM premium_packs WHERE is_active = true ORDER BY display_order
    `;

    let ownedPacks: string[] = [];
    if (userId) {
      const owned = await sql`
        SELECT pack_id FROM user_premium_packs WHERE user_id = ${userId}
      `;
      ownedPacks = owned.map((o: any) => o.pack_id);
    }

    const packsWithCounts = await Promise.all(packs.map(async (pack: any) => {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM premium_content_items WHERE pack_id = ${pack.id}
      `;
      return {
        ...pack,
        long_description: pack.long_description || pack.description,
        thumbnail_url: pack.thumbnail_url || '',
        itemCount: parseInt(countResult[0]?.count || '0'),
        isOwned: ownedPacks.includes(pack.id),
        price: parseFloat(pack.price),
      };
    }));

    return new Response(JSON.stringify({
      success: true,
      packs: packsWithCounts,
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
