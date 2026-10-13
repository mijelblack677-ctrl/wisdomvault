-- Add missing columns to content_items table
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS link_type varchar(30) DEFAULT 'url';
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS price numeric(10, 2) DEFAULT 0;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS steps text;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tips text;

-- Add missing column to sponsored_content table
ALTER TABLE sponsored_content ADD COLUMN IF NOT EXISTS video_platform varchar(50) DEFAULT 'youtube';

-- Expand sponsored_content CHECK constraint to allow 'article' type
ALTER TABLE sponsored_content DROP CONSTRAINT IF EXISTS sponsored_content_content_type_check;
ALTER TABLE sponsored_content ADD CONSTRAINT sponsored_content_content_type_check 
  CHECK (content_type::text = ANY (ARRAY['video'::character varying, 'audio'::character varying, 'article'::character varying]));

-- Add missing column to premium_content_items table
ALTER TABLE premium_content_items ADD COLUMN IF NOT EXISTS link_type varchar(30) DEFAULT 'url';

-- Add missing column to wallets for store_credit
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS store_credit numeric(12, 2) DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS gross_earnings_total numeric(12, 2) DEFAULT 0.00;

-- Add missing columns to users for earnings tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_gross_earnings numeric(12, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_net_earnings numeric(12, 2) DEFAULT 0;

-- Add missing columns for content_items if they don't exist
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS external_link text;
