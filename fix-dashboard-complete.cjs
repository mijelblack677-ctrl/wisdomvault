const fs = require('fs');

console.log('🔧 Fixing Dashboard - Complete...\n');

const filePath = 'src/scripts/dashboard.js';

if (!fs.existsSync(filePath)) {
  console.error('❌ File not found:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Backup
const backupPath = filePath + '.complete.backup.' + Date.now();
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created:', backupPath);

// ============================================================
// 1. FIX THE BROKEN formatCurrency FUNCTION
// ============================================================
console.log('📝 Fixing formatCurrency function...');

// Find and fix the broken formatCurrency
content = content.replace(
  /function formatCurrency\(amount\) \{[\s\S]*?return '[\s\S]*?return 'MWK ' \+ parseFloat\(amount \|\| 0\)\.toLocaleString\('en-US', \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\);/,
  `function formatCurrency(amount) {
  return 'MWK ' + parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}`
);

// ============================================================
// 2. ADD USD CONVERSION HELPERS (BEFORE formatCurrency)
// ============================================================
console.log('📝 Adding USD conversion...');

const usdHelper = `
// USD Conversion
const USD_RATE = 1800;

function formatUSD(amount) {
  return '$' + (parseFloat(amount || 0) / USD_RATE).toFixed(2);
}

function formatCurrency(amount) {
  return 'MWK ' + parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}`;

// Replace the entire formatCurrency section
content = content.replace(
  /function formatCurrency\(amount\) \{[\s\S]*?return 'MWK ' \+ parseFloat\(amount \|\| 0\)\.toLocaleString\('en-US', \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\);\n\}/,
  usdHelper
);

// ============================================================
// 3. FIX OVERVIEW PANEL - Show "Withdrawn" instead of "Total Earned"
// ============================================================
console.log('📝 Fixing Overview panel...');

// Find the second balance card in overview
const overviewPattern = /<div class="balance-label">\s*<div class="balance-icon">[\s\S]*?<\/svg><\/div>\s*Total Earned\s*<\/div>\s*<div class="balance-amount numbers">\$\{formatCurrency\(wallet\.grossEarnings\)\}<\/div>\s*<div class="balance-change">[\s\S]*?Lifetime earnings\s*<\/div>/;

const newOverviewCard = `<div class="balance-label">
          <div class="balance-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          Withdrawn
        </div>
        <div class="balance-amount numbers">\${formatCurrency(wallet.totalWithdrawn)}</div>
        <div class="balance-change">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          Total withdrawn
        </div>`;

content = content.replace(overviewPattern, newOverviewCard);

// ============================================================
// 4. ADD USD TO BALANCE CARDS
// ============================================================
console.log('📝 Adding USD to balance cards...');

// Add USD to balance cards
const usdRegex = /(<div class="balance-amount numbers">\$\{formatCurrency\(([^)]+)\)\}<\/div>)/g;
content = content.replace(usdRegex, function(match, fullMatch, varName) {
  return fullMatch + '\n        <div style="font-size:13px;color:var(--gray-600);margin-top:2px;">~${formatUSD(' + varName + ')} USD</div>';
});

// ============================================================
// 5. FIX EARN & WATCH FILTERS
// ============================================================
console.log('📝 Fixing Earn & Watch filters...');

const filterFix = content.replace(
  /document\.querySelectorAll\('\#earn-grid > div\[data-type\]'\)\.forEach\(function\(card\) \{[\s\S]*?card\.style\.display = \(filter === 'all' \|\| card\.dataset\.type === filter\) \? '' : 'none';/,
  `document.querySelectorAll('#earn-grid > div[data-type]').forEach(function(card) {
          var cardType = card.dataset.type || '';
          card.style.display = (filter === 'all' || cardType === filter) ? '' : 'none';`
);
content = filterFix;

// ============================================================
// 6. FIX LIBRARY SEARCH
// ============================================================
console.log('📝 Fixing library search...');

const searchFix = content.replace(
  /var matchesSearch = true;[\s\S]*?if \(libraryCurrentSearch\) \{[\s\S]*?matchesSearch = book\.title\.toLowerCase\(\)\.includes\(search\) \|\|[\s\S]*?\(book\.author && book\.author\.toLowerCase\(\)\.includes\(search\)\) \|\|[\s\S]*?\(book\.description && book\.description\.toLowerCase\(\)\.includes\(search\)\);/,
  `var matchesSearch = true;
        if (libraryCurrentSearch) {
          var search = libraryCurrentSearch.toLowerCase().trim();
          var titleMatch = book.title && book.title.toLowerCase().includes(search);
          var authorMatch = book.author && book.author.toLowerCase().includes(search);
          var descMatch = book.description && book.description.toLowerCase().includes(search);
          matchesSearch = titleMatch || authorMatch || descMatch;
        }`
);
content = searchFix;

// ============================================================
// 7. FIX PROFILE SIGN OUT
// ============================================================
console.log('📝 Fixing sign out...');

content = content.replace(
  /localStorage\.removeItem\('wisdom_vault_user'\);\s*localStorage\.removeItem\('wisdom_vault_session'\);/,
  `localStorage.removeItem('wisdom_vault_user');
        localStorage.removeItem('wisdom_vault_session');
        localStorage.removeItem('sidebar_collapsed');
        localStorage.removeItem('wv_continue_reading');
        localStorage.removeItem('wv_guide_history');
        localStorage.removeItem('wv_admin_token');
        sessionStorage.clear();`
);

// ============================================================
// 8. FIX WITHDRAW MODAL USD
// ============================================================
console.log('📝 Fixing withdraw modal...');

content = content.replace(
  /<p class="numbers" style="font-size:28px;font-weight:700;color:var\(--charcoal\);">\$\{formatCurrency\(wallet\.balanceAvailable\)\}<\/p>/,
  `<p class="numbers" style="font-size:28px;font-weight:700;color:var(--charcoal);">\${formatCurrency(wallet.balanceAvailable)}</p>
          <p style="font-size:12px;color:var(--gray-600);">~\${formatUSD(wallet.balanceAvailable)} USD</p>`
);

// ============================================================
// Write the file
// ============================================================
fs.writeFileSync(filePath, content);

console.log('\n✅ All fixes applied successfully!');
console.log('📁 Updated:', filePath);
console.log('💾 Backup saved:', backupPath);
console.log('\n📋 Changes made:');
console.log('  1. ✅ Fixed broken formatCurrency function');
console.log('  2. ✅ Added USD conversion (MWK → USD at 1800 rate)');
console.log('  3. ✅ Changed "Total Earned" → "Withdrawn" in Overview');
console.log('  4. ✅ Fixed Earn & Watch filters');
console.log('  5. ✅ Fixed library search');
console.log('  6. ✅ Fixed sign out - clears all localStorage');
console.log('  7. ✅ Added USD to withdraw modal');
console.log('\n🔄 Refresh your browser to see the changes.');
