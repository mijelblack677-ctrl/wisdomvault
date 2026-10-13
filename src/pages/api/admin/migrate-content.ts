export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireAdmin, unauthorized } from '@lib/adminAuth';

// ============================================================
// POST - Run database migration to add missing content columns
// ADMIN-ONLY: runs DDL. Call once with an admin Bearer token.
// ============================================================
export const POST: APIRoute = async ({ request }) => {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized('Admin authentication required');

  const sql = client;
  const results: string[] = [];

  const migrations = [
    // content_items missing columns
    { name: 'content_items.link_type', sql: `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS link_type varchar(30) DEFAULT 'url'` },
    { name: 'content_items.is_premium', sql: `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false` },
    { name: 'content_items.price', sql: `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS price numeric(10, 2) DEFAULT 0` },
    { name: 'content_items.steps', sql: `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS steps text` },
    { name: 'content_items.tips', sql: `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tips text` },
    { name: 'content_items.external_link', sql: `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS external_link text` },

    // sponsored_content missing column
    { name: 'sponsored_content.video_platform', sql: `ALTER TABLE sponsored_content ADD COLUMN IF NOT EXISTS video_platform varchar(50) DEFAULT 'youtube'` },

    // sponsored_content CHECK constraint - allow article type
    { name: 'sponsored_content.content_type_check', sql: `ALTER TABLE sponsored_content DROP CONSTRAINT IF EXISTS sponsored_content_content_type_check` },
    { name: 'sponsored_content.content_type_check (new)', sql: `ALTER TABLE sponsored_content ADD CONSTRAINT sponsored_content_content_type_check CHECK (content_type::text = ANY (ARRAY['video'::character varying, 'audio'::character varying, 'article'::character varying]))` },

    // premium_content_items missing column
    { name: 'premium_content_items.link_type', sql: `ALTER TABLE premium_content_items ADD COLUMN IF NOT EXISTS link_type varchar(30) DEFAULT 'url'` },

    // wallets missing columns
    { name: 'wallets.store_credit', sql: `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS store_credit numeric(12, 2) DEFAULT 0.00` },
    { name: 'wallets.gross_earnings_total', sql: `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS gross_earnings_total numeric(12, 2) DEFAULT 0.00` },

    // users missing columns
    { name: 'users.total_gross_earnings', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_gross_earnings numeric(12, 2) DEFAULT 0` },
    { name: 'users.total_net_earnings', sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_net_earnings numeric(12, 2) DEFAULT 0` },
  ];

  for (const m of migrations) {
    try {
      await sql.unsafe(m.sql);
      results.push(`✅ ${m.name}`);
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('does not exist')) {
        results.push(`⏭️ ${m.name} (already applied)`);
      } else {
        results.push(`❌ ${m.name}: ${err.message}`);
      }
    }
  }

  // Verify columns exist now
  try {
    const contentCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'content_items' AND column_name IN ('link_type', 'is_premium', 'price', 'file_url')
      ORDER BY column_name
    `;
    results.push(`\n📋 content_items columns: ${contentCols.map((c: any) => c.column_name).join(', ')}`);

    const sponsoredCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'sponsored_content' AND column_name IN ('video_platform', 'external_link', 'file_url')
      ORDER BY column_name
    `;
    results.push(`📋 sponsored_content columns: ${sponsoredCols.map((c: any) => c.column_name).join(', ')}`);

    const packCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'premium_content_items' AND column_name IN ('link_type', 'file_url')
      ORDER BY column_name
    `;
    results.push(`📋 premium_content_items columns: ${packCols.map((c: any) => c.column_name).join(', ')}`);

    const walletCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'wallets' AND column_name IN ('store_credit', 'gross_earnings_total', 'balance_available')
      ORDER BY column_name
    `;
    results.push(`📋 wallets columns: ${walletCols.map((c: any) => c.column_name).join(', ')}`);
  } catch (err: any) {
    results.push(`\n⚠️ Verification query failed: ${err.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Migration complete',
    results
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
