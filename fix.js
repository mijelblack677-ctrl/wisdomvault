#!/usr/bin/env node

/**
 * Emergency CSS Fix - Fixes all syntax errors
 * Usage: node fix-now.js src/pages/dashboard.astro
 */

import fs from 'fs';

const filePath = process.argv[2] || 'src/pages/dashboard.astro';

console.log('🚑 Emergency CSS Fix');
console.log('📁 Processing:', filePath);
console.log('');

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Create backup
const backupPath = filePath + '.emergency-fix.backup.' + Date.now();
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created:', backupPath);

console.log('🔧 Fixing CSS syntax errors...');

// ============================================================
// FIX 1: Remove all malformed -webkit- properties
// ============================================================
// These are causing the main issues
content = content.replace(/-webkit-[^{}]*$/gm, '');
content = content.replace(/-webkit-\s*$/gm, '');
content = content.replace(/-webkit-background-clip\s*:\s*[^;]*;?/g, '');
content = content.replace(/-webkit-text-fill-color\s*:\s*[^;]*;?/g, '');

// ============================================================
// FIX 2: Fix the .ambient class (missing properties)
// ============================================================
content = content.replace(
  /\.ambient \{\s*inset:\s*0;\s*z-index:\s*0;\s*pointer-events:\s*none;\s*radial-gradient/g,
  `.ambient {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient`
);

// ============================================================
// FIX 3: Fix invalid selectors with commas
// ============================================================
content = content.replace(
  /\.sidebar:not\(\.sidebar--collapsed-mobile\):hover \.sidebar__brand-text,\.sidebar:not\(\.sidebar--collapsed-mobile\):hover \.sidebar__footer a span \{\s*\}/g,
  `.sidebar:not(.sidebar--collapsed-mobile):hover .sidebar__brand-text,
.sidebar:not(.sidebar--collapsed-mobile):hover .sidebar__footer a span {
  display: inline;
}`
);

content = content.replace(
  /\.sidebar--collapsed \.sidebar__link span: not\(\.sidebar__link-icon\),;/g,
  `.sidebar--collapsed .sidebar__link span:not(.sidebar__link-icon)`
);

// ============================================================
// FIX 4: Fix malformed @keyframes
// ============================================================
content = content.replace(
  /@keyframes floatOrb1keyframesfloatOrb2keyframesfloatOrb3 \{/g,
  `@keyframes floatOrb1 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  33% { transform: translate(-100px, 50px) scale(1.1); opacity: 0.6; }
  66% { transform: translate(50px, -30px) scale(0.9); opacity: 0.3; }
}

@keyframes floatOrb2 {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
  50% { transform: translate(80px, -60px) scale(1.2); opacity: 0.5; }
}

@keyframes floatOrb3 {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.2; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 0.4; }
}`
);

// ============================================================
// FIX 5: Fix missing closing braces in ambient::after
// ============================================================
content = content.replace(
  /\.ambient::after \{\s*content:\s*'';\s*background-image:\s*linear-gradient\(rgba\(255,255,255,0\.01\) 1px, transparent 1px\),;\s*linear-gradient\(90deg, rgba\(255,255,255,0\.01\) 1px, transparent 1px\);\s*background-size:\s*80px 80px;\s*\}/g,
  `.ambient::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
    background-size: 80px 80px;
    pointer-events: none;
  }`
);

// ============================================================
// FIX 6: Fix malformed CSS properties (empty/partial)
// ============================================================
// Remove empty property declarations
content = content.replace(/[a-zA-Z-]+\s*:\s*;+/g, '');
content = content.replace(/[a-zA-Z-]+\s*:\s*;\s*/g, '');

// Fix incomplete properties
content = content.replace(/text-shadow:\s*none\s*!\s*important;/g, 'text-shadow: none !important;');
content = content.replace(/animation:\s*spin/g, 'animation: spin');

// ============================================================
// FIX 7: Fix duplicate closing tags in HTML
// ============================================================
content = content.replace(
  /<span class="topbar__title" id="panel-title">Dashboard<\/span> Dashboard<\/span>/,
  '<span class="topbar__title" id="panel-title">Dashboard</span>'
);

// ============================================================
// FIX 8: Remove all invalid gradient text styles
// ============================================================
const gradientTextPatterns = [
  /background:\s*linear-gradient\([^)]+\)\s*-webkit-background-clip:\s*text\s*;/g,
  /background:\s*linear-gradient\([^)]+\);\s*-webkit-background-clip:\s*text\s*;/g,
  /-webkit-background-clip:\s*text;\s*-webkit-text-fill-color:\s*transparent;\s*background-clip:\s*text;/g,
];

gradientTextPatterns.forEach(pattern => {
  content = content.replace(pattern, '');
});

// ============================================================
// FIX 9: Fix the .ambient__orb classes
// ============================================================
content = content.replace(
  /\.ambient__orb--2 \{\s*bottom:\s*-100px;\s*left:\s*-100px;\s*\}/,
  `.ambient__orb--2 {
    display: block;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(139, 101, 74, 0.15), transparent 70%);
    bottom: -100px;
    left: -100px;
    animation: floatOrb2 25s ease-in-out infinite;
  }`
);

content = content.replace(
  /\.ambient__orb--3 \{\s*transform:\s*translateX\(-50%\);\s*\}/,
  `.ambient__orb--3 {
    display: block;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(245, 166, 35, 0.06), transparent 70%);
    top: 40%;
    left: 50%;
    transform: translateX(-50%);
    animation: floatOrb3 18s ease-in-out infinite;
  }`
);

// ============================================================
// FIX 10: Clean up extra closing braces
// ============================================================
// Remove empty blocks
content = content.replace(/[^{}]*\{\s*\}/g, '');

// Fix duplicate braces
content = content.replace(/\}\s*\}/g, '}');

// ============================================================
// FIX 11: Fix the topbar title
// ============================================================
content = content.replace(
  /<span class="topbar__title" id="panel-title">Dashboard<\/span> Dashboard<\/span>/,
  '<span class="topbar__title" id="panel-title">Dashboard</span>'
);

// ============================================================
// FIX 12: Remove the problematic .shimmer-text styles
// ============================================================
const shimmerFix = `
  .shimmer-text {
    animation: shimmerText 3s ease-in-out infinite;
  }
  
  .shimmer-text:hover {
    animation-duration: 1s;
  }
`;

// Replace the broken shimmer-text with fixed version
content = content.replace(
  /\.shimmer-text \{[\s\S]*?\}/,
  shimmerFix
);

// ============================================================
// Write the fixed file
// ============================================================
fs.writeFileSync(filePath, content);

console.log('');
console.log('✅ Emergency fixes applied!');
console.log('📁 Updated:', filePath);
console.log('💾 Backup saved:', backupPath);
console.log('');
console.log('📋 What was fixed:');
console.log('  1. Removed malformed -webkit- properties');
console.log('  2. Fixed .ambient class');
console.log('  3. Fixed invalid selectors with commas');
console.log('  4. Fixed malformed @keyframes');
console.log('  5. Fixed .ambient::after');
console.log('  6. Fixed empty/partial properties');
console.log('  7. Fixed duplicate HTML tags');
console.log('  8. Removed invalid gradient text styles');
console.log('  9. Fixed .ambient__orb classes');
console.log('  10. Cleaned up empty blocks');
console.log('  11. Fixed shimmer-text styles');
console.log('');
console.log('🚀 Now try deploying again!');
