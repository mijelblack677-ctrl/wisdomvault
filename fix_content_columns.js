#!/usr/bin/env node
/**
 * Fix Content Columns Migration
 * Run this script to add missing columns to the database
 * Usage: node fix_content_columns.js
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const migrations = [
  // content_items missing columns
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS link_type varchar(30) DEFAULT 'url'`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS price numeric(10, 2) DEFAULT 0`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS steps text`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tips text`,
  `ALTER TABLE content_items ADD COLUMN IF NOT EXISTS external_link text`,

  // sponsored_content missing column
  `ALTER TABLE sponsored_content ADD COLUMN IF NOT EXISTS video_platform varchar(50) DEFAULT 'youtube'`,

  // sponsored_content CHECK constraint - drop and recreate to allow 'article'
  `ALTER TABLE sponsored_content DROP CONSTRAINT IF EXISTS sponsored_content_content_type_check`,
  `ALTER TABLE sponsored_content ADD CONSTRAINT sponsored_content_content_type_check CHECK (content_type::text = ANY (ARRAY['video'::character varying, 'audio'::character varying, 'article'::character varying]))`,

  // premium_content_items missing column
  `ALTER TABLE premium_content_items ADD COLUMN IF NOT EXISTS link_type varchar(30) DEFAULT 'url'`,

  // wallets missing columns
  `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS store_credit numeric(12, 2) DEFAULT 0.00`,
  `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS gross_earnings_total numeric(12, 2) DEFAULT 0.00`,

  // users missing columns
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_gross_earnings numeric(12, 2) DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_net_earnings numeric(12, 2) DEFAULT 0`,
];

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i];
      console.log(`\n[${ i + 1}/${migrations.length}] Running: ${sql.substring(0, 80)}...`);
      try {
        await client.query(sql);
        console.log('  ✅ Success');
      } catch (err) {
        // "already exists" errors are fine
        if (err.message.includes('already exists') || err.message.includes('does not exist')) {
          console.log('  ⏭️  Skipped (already applied)');
        } else {
          console.error('  ❌ Error:', err.message);
        }
      }
    }

    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
