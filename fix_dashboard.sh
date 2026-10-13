#!/bin/bash

cd ~/wisdom-vault

# ============================================================
# FIX 1: Add Greeting Message
# ============================================================
# Find the line after topbar and add greeting
sed -i '/<header class="topbar">/,/<\/header>/ {
  s/<\/header>/<\/header>\n        <!-- Greeting Message -->\n        <div class="greeting">\n          <h2>Welcome back, <span class="greeting__name">${user.fullName.split('\'' '"'"' '"'"')"[0]}</span> 👋</h2>\n          <p class="greeting__sub">Here'\''s what'\''s happening with your Vault today.</p>\n        <\/div>/
}' src/pages/dashboard.astro

# ============================================================
# FIX 2: Add Total Withdrawn to Stats
# ============================================================
# Add a stat card for total withdrawn
sed -i '/<div class="quick-stat">/a\
                <div class="quick-stat">\
                  <div class="quick-stat-wrapper">\
                    <div class="quick-stat-inner">\
                      <div class="quick-stat-icon-wrapper">\
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>\
                          <line x1="1" y1="10" x2="23" y2="10"/>\
                        <\/svg>\
                      <\/div>\
                      <div class="quick-stat__content">\
                        <div class="quick-stat__value">MWK ${parseFloat(w.totalWithdrawn).toLocaleString()}<\/div>\
                        <div class="quick-stat__label">Total Withdrawn<\/div>\
                      <\/div>\
                    <\/div>\
                  <\/div>\
                <\/div>' src/pages/dashboard.astro

# ============================================================
# FIX 3: Add Cardholder Name and Phone to Withdrawal
# ============================================================
# Update the withdrawal form in dashboard
sed -i '/<div class="withdraw-row">/i\
                  <div class="form-group">\
                    <label style="font-size:12px;color:var(--muted);margin-bottom:4px;display:block;">Full Name (as on card)</label>\
                    <input type="text" id="withdraw-name" class="input" placeholder="Enter cardholder name" required style="width:100%;"/>\
                  <\/div>\
                  <div class="form-group" style="margin-top:8px;">\
                    <label style="font-size:12px;color:var(--muted);margin-bottom:4px;display:block;">Phone Number</label>\
                    <input type="tel" id="withdraw-phone" class="input" placeholder="Enter phone number" required style="width:100%;"/>\
                  <\/div>\
' src/pages/dashboard.astro

# Update the withdraw function to include name and phone
sed -i '/const { userId, amount } = body;/a\    const { cardholderName, phoneNumber } = body;' src/pages/api/wallet/withdraw.ts

# Update the API to save name and phone
sed -i '/INSERT INTO withdrawals (wallet_id, amount_requested, withdrawal_fee, amount_paid, status, payment_method, requested_at)/ {
  s/requested_at)/requested_at, cardholder_name, phone_number)/
  s/NOW()/NOW(), ${cardholderName}, ${phoneNumber})/
}' src/pages/api/wallet/withdraw.ts

# Update the dashboard withdraw function to send name and phone
sed -i '/body: JSON.stringify({ userId: userId, amount: amount })/ {
  s/}/, cardholderName: document.getElementById('\''withdraw-name'\'').value, phoneNumber: document.getElementById('\''withdraw-phone'\'').value }/
}' src/pages/dashboard.astro

# ============================================================
# FIX 4: Add greeting CSS
# ============================================================
cat >> src/pages/dashboard.astro << 'EOF'

/* ============ GREETING ============ */
.greeting {
  padding: 24px 36px 0;
  animation: fadeUp 0.5s ease-out;
}
.greeting h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}
.greeting__name {
  color: var(--gold);
}
.greeting__sub {
  font-size: 14px;
  color: var(--muted);
  margin-top: 4px;
}
@media (max-width: 768px) {
  .greeting { padding: 16px 20px 0; }
  .greeting h2 { font-size: 20px; }
}
