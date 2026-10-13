#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing watch.ts column names...\n');

const filePath = 'src/pages/api/earn/watch.ts';

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Create backup
const backupPath = filePath + '.backup.' + Date.now();
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created:', backupPath);

console.log('📝 Fixing column names...');

// Fix 1: Replace viewed_at with watched_at (your database has watched_at and watched_date)
content = content.replace(/viewed_at/g, 'watched_at');

// Fix 2: Also ensure we're using the right columns
content = content.replace(/watched_at > NOW\(\) - INTERVAL '24 hours'/g, 'watched_date > CURRENT_DATE - INTERVAL \'1 day\'');

// Fix 3: Make sure we're selecting the right columns
content = content.replace(/SELECT \* FROM sponsored_content/g, 'SELECT id, title, description, content_type, sponsor_name, reward_amount, duration_seconds, external_link, file_url, is_active FROM sponsored_content');

console.log('✅ Fixed column names: viewed_at → watched_at');

// Write the file
fs.writeFileSync(filePath, content);

console.log('\n✅ watch.ts fixed!');
console.log('📁 Updated:', filePath);
console.log('💾 Backup saved:', backupPath);
console.log('\n📋 Changes made:');
console.log('  1. ✅ viewed_at → watched_at');
console.log('  2. ✅ Fixed date comparison');
console.log('  3. ✅ Optimized SELECT query');
console.log('\n🚀 Done!');
