#!/usr/bin/env node

/**
 * Fix Unicode Escape Sequence Error
 * Usage: node fix-unicode.js src/pages/dashboard.astro
 */

import fs from 'fs';

const filePath = process.argv[2] || 'src/pages/dashboard.astro';

console.log('🔧 Fixing Unicode Escape Sequence Error');
console.log('📁 Processing:', filePath);
console.log('');

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Create backup
const backupPath = filePath + '.unicode-fix.backup.' + Date.now();
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created:', backupPath);

// Fix 1: Replace escaped single quotes in the library case
// The issue is with `\` in strings like `\'` inside template literals
// We need to properly escape them or use double quotes

// Find and fix the library case section
const libraryRegex = /case 'library':\s*c\.innerHTML\s*=\s*`([\s\S]*?)`;\s*break;/;
const match = content.match(libraryRegex);

if (match) {
  let libraryHTML = match[1];
  
  // Fix: Replace all escaped single quotes with double quotes where appropriate
  libraryHTML = libraryHTML.replace(/\\'/g, '"');
  
  // Fix: Ensure proper escaping in onclick attributes
  libraryHTML = libraryHTML.replace(/onclick='([^']*)'/g, 'onclick="$1"');
  
  // Reconstruct
  const newCase = `case 'library':
  c.innerHTML = \`${libraryHTML}\`;
  break;`;
  
  content = content.replace(libraryRegex, newCase);
  console.log('✅ Fixed library case Unicode escapes');
}

// Fix 2: Any other backslash issues in the entire file
// Replace any escaped quotes that might cause issues
content = content.replace(/\\'/g, '"');
content = content.replace(/\\"/g, "'");

// Fix 3: Fix template literal backticks inside strings
// Find any backticks that might be escaped
content = content.replace(/`/g, '`');

// Write the file
fs.writeFileSync(filePath, content);

console.log('');
console.log('✅ Unicode escape fixes applied!');
console.log('📁 Updated:', filePath);
console.log('💾 Backup saved:', backupPath);
console.log('');
console.log('🚀 Try deploying again!');
