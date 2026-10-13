const fs = require('fs');

console.log('🔧 Fixing dashboard.js syntax errors...\n');

const filePath = 'src/scripts/dashboard.js';

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Backup
const backupPath = filePath + '.syntax.backup.' + Date.now();
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created:', backupPath);

// ============================================================
// FIX: Remove duplicate formatUSD and fix the broken function
// ============================================================
console.log('📝 Fixing formatCurrency and formatUSD functions...');

// Find and replace the entire helper section
const helperRegex = /\/\/ ============================================================\s*\/\/ HELPERS\s*\/\/ ============================================================[\s\S]*?function showToast\(message\) \{/;

const fixedHelpers = `// ============================================================
// HELPERS
// ============================================================

// USD Conversion
const USD_RATE = 1800;

function formatUSD(amount) {
  return '$' + (parseFloat(amount || 0) / USD_RATE).toFixed(2);
}

function formatCurrency(amount) {
  return 'MWK ' + parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getGreeting(name) {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';
  return \`\${greeting}, \${name || 'User'}\`;
}

function calculateFee(amount) {
  if (amount <= 0) return 0;
  const chunks = Math.floor(amount / 6000);
  return chunks * 1000;
}

function showToast(message) {`;

content = content.replace(helperRegex, fixedHelpers);

// ============================================================
// FIX: Remove duplicate USD lines in overview
// ============================================================
console.log('📝 Removing duplicate USD lines in overview...');

// Remove duplicate USD lines in the balance cards
content = content.replace(
  /<div style="font-size:13px;color:var\(--gray-600\);margin-top:2px;">~\\\$\\{formatUSD\([^}]+\)\} USD<\/div>\s*<div style="font-size:13px;color:var\(--gray-600\);margin-top:2px;">~\\\$\\{formatUSD\([^}]+\)\} USD<\/div>/g,
  '<div style="font-size:13px;color:var(--gray-600);margin-top:2px;">~${formatUSD($1)} USD</div>'
);

// ============================================================
// FIX: Fix the renderOverview function
// ============================================================
console.log('📝 Fixing renderOverview...');

// Find and replace the overview balance cards
const overviewRegex = /function renderOverview\(container\) \{[\s\S]*?container\.innerHTML = `([\s\S]*?)`;[\s\S]*?\}/;

if (overviewRegex.test(content)) {
  const match = content.match(overviewRegex);
  let overviewHTML = match[1];
  
  // Fix duplicate USD in the first card
  overviewHTML = overviewHTML.replace(
    /<div style="font-size:13px;color:var\(--gray-600\);margin-top:2px;">~\\\$\\{formatUSD\(wallet\.balanceAvailable\)\} USD<\/div>\s*<div style="font-size:13px;color:var\(--gray-600\);margin-top:2px;">~\\\$\\{formatUSD\(wallet\.balanceAvailable\)\} USD<\/div>/,
    '<div style="font-size:13px;color:var(--gray-600);margin-top:2px;">~${formatUSD(wallet.balanceAvailable)} USD</div>'
  );
  
  // Fix duplicate USD in the second card
  overviewHTML = overviewHTML.replace(
    /<div style="font-size:13px;color:var\(--gray-600\);margin-top:2px;">~\\\$\\{formatUSD\(wallet\.grossEarnings\)\} USD<\/div>\s*<div style="font-size:13px;color:var\(--gray-600\);margin-top:2px;">~\\\$\\{formatUSD\(wallet\.grossEarnings\)\} USD<\/div>/,
    '<div style="font-size:13px;color:var(--gray-600);margin-top:2px;">~${formatUSD(wallet.grossEarnings)} USD</div>'
  );
  
  // Fix the second card to show "Withdrawn" instead of "Total Earned"
  overviewHTML = overviewHTML.replace(
    /Total Earned/,
    'Withdrawn'
  );
  
  overviewHTML = overviewHTML.replace(
    /wallet\.grossEarnings/g,
    'wallet.totalWithdrawn'
  );
  
  // Reconstruct
  const newOverview = `function renderOverview(container) {
  const wallet = globalWallet || { balanceAvailable: 0, grossEarnings: 0, totalWithdrawn: 0 };

  container.innerHTML = \`${overviewHTML}\`;

  container.querySelectorAll('.ecosystem-card[data-nav]').forEach(function(card) {
    card.addEventListener('click', function(e) {
      e.stopPropagation();
      const panel = this.dataset.nav;
      const navBtn = document.querySelector('.user-bottom-nav__item[data-panel="' + panel + '"]');
      if (navBtn) navBtn.click();
    });
  });
}`;

  content = content.replace(overviewRegex, newOverview);
  console.log('✅ Fixed renderOverview');
}

// ============================================================
// FIX: Fix the renderWallet function duplicate USD
// ============================================================
console.log('📝 Fixing renderWallet...');

// Fix duplicate USD in wallet modal
content = content.replace(
  /<p style="font-size:12px;color:var\(--gray-600\);">~\\\$\\{formatUSD\(wallet\.balanceAvailable\)\} USD<\/p>\s*<p style="font-size:12px;color:var\(--gray-600\);">~\\\$\\{formatUSD\(wallet\.balanceAvailable\)\} USD<\/p>/,
  '<p style="font-size:12px;color:var(--gray-600);">~${formatUSD(wallet.balanceAvailable)} USD</p>'
);

// ============================================================
// Write the file
// ============================================================
fs.writeFileSync(filePath, content);

console.log('\n✅ All syntax errors fixed!');
console.log('📁 Updated:', filePath);
console.log('💾 Backup saved:', backupPath);
console.log('\n📋 Changes made:');
console.log('  1. ✅ Fixed duplicate formatUSD function');
console.log('  2. ✅ Removed duplicate USD lines in overview');
console.log('  3. ✅ Changed "Total Earned" to "Withdrawn" in overview');
console.log('  4. ✅ Fixed wallet modal duplicate USD');
console.log('\n🔄 Refresh your browser to see the changes.');
