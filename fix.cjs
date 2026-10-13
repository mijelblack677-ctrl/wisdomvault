// save as fix-invites.cjs
const fs = require('fs');

const filePath = 'src/scripts/dashboard.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the invites case
const invitesStart = content.indexOf('case \'invites\':');
if (invitesStart === -1) {
  console.log('❌ Could not find invites case');
  process.exit(1);
}

// Find where the invites case ends (next case or end of switch)
const nextCase = content.indexOf('case', invitesStart + 10);
const endOfSwitch = content.indexOf('}', invitesStart + 10);
const endIndex = nextCase !== -1 ? nextCase : endOfSwitch;

// The new invites case content
const newInvitesCase = `      case 'invites':
        // Show loading state
        c.innerHTML = \`
          <div style="text-align:center;padding:60px;color:var(--muted);">
            <div style="width:32px;height:32px;border:2px solid var(--gold);border-top-color:transparent;border-radius:50%;animation: spin 0.8s linear infinite;margin:0 auto 12px;"></div>
            <p>Loading referral data...</p>
          </div>
        \`;

        fetch('/api/referral/stats?userId=' + user.id)
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.success) {
              const stats = data.stats;
              const refs = data.firstLevelReferrals || [];
              const referralLink = data.referralLink || user.referralLink || '';

              let html = '';
              
              // Stats summary card
              html += \`
                <div class="page__section">
                  <div class="section-header">
                    <div class="section-header__left">
                      <div class="section-header__title gold-underline">Referral Dashboard</div>
                      <div class="section-header__sub">Track your referral earnings and growth</div>
                    </div>
                  </div>

                  <div class="invites-summary-card">
                    <div class="invites-summary-grid">
                      <div class="invites-summary-item">
                        <span class="label">Total Referrals</span>
                        <span class="value gold">\${stats.firstLevelCount + stats.secondLevelCount}</span>
                        <span class="sub">Active members</span>
                      </div>
                      <div class="invites-summary-item">
                        <span class="label">First Level</span>
                        <span class="value">\${stats.firstLevelCount}</span>
                        <span class="sub">Direct referrals</span>
                      </div>
                      <div class="invites-summary-item">
                        <span class="label">Second Level</span>
                        <span class="value">\${stats.secondLevelCount}</span>
                        <span class="sub">Indirect referrals</span>
                      </div>
                      <div class="invites-summary-item">
                        <span class="label">Total Earnings</span>
                        <span class="value green">MWK \${(stats.firstLevelGross + stats.secondLevelGross).toLocaleString()}</span>
                        <span class="sub">Lifetime referral income</span>
                      </div>
                    </div>
                  </div>

                  <div class="invites-stats-grid">
                    <div class="invites-stat-card invites-stat-card--gold">
                      <div class="invites-stat-icon">📊</div>
                      <div class="invites-stat-label">Gross Earnings</div>
                      <div class="invites-stat-value invites-stat-value--gold">MWK \${(stats.firstLevelGross + stats.secondLevelGross).toLocaleString()}</div>
                      <div class="invites-stat-sub">Before fees</div>
                    </div>
                    <div class="invites-stat-card">
                      <div class="invites-stat-icon">💳</div>
                      <div class="invites-stat-label">Net Earnings</div>
                      <div class="invites-stat-value invites-stat-value--green">MWK \${((stats.firstLevelGross + stats.secondLevelGross) - stats.totalFees).toLocaleString()}</div>
                      <div class="invites-stat-sub">After fees</div>
                    </div>
                    <div class="invites-stat-card">
                      <div class="invites-stat-icon">📈</div>
                      <div class="invites-stat-label">Total Fees Paid</div>
                      <div class="invites-stat-value" style="color: var(--red);">MWK \${stats.totalFees.toLocaleString()}</div>
                      <div class="invites-stat-sub">Processing fees</div>
                    </div>
                    <div class="invites-stat-card">
                      <div class="invites-stat-icon">🎯</div>
                      <div class="invites-stat-label">Conversion Rate</div>
                      <div class="invites-stat-value">\${stats.firstLevelCount > 0 ? Math.round((stats.firstLevelCount / (stats.firstLevelCount + stats.secondLevelCount)) * 100) : 0}%</div>
                      <div class="invites-stat-sub">Referral to active</div>
                    </div>
                  </div>

                  <div class="invites-fee-breakdown">
                    <div class="invites-fee-item">
                      <span class="label">First Level Bonus</span>
                      <span class="amount gold">MWK \${stats.firstLevelGross.toLocaleString()}</span>
                    </div>
                    <div class="invites-fee-item">
                      <span class="label">Second Level Bonus</span>
                      <span class="amount gold">MWK \${stats.secondLevelGross.toLocaleString()}</span>
                    </div>
                    <div class="invites-fee-item">
                      <span class="label">Total Fees Deducted</span>
                      <span class="amount red">MWK \${stats.totalFees.toLocaleString()}</span>
                    </div>
                  </div>

                  <div class="invites-link-card">
                    <div class="link-info">
                      <div class="label">Your Referral Link</div>
                      <code class="code" id="ref-link">\${referralLink || 'No link available'}</code>
                    </div>
                    <div class="link-actions">
                      <button class="btn btn--gold" onclick="window._copyRef('\${referralLink || ''}', this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <rect x="9" y="9" width="13" height="13" rx="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy Link
                      </button>
                      <span class="invites-status-badge invites-status-badge--active">Active</span>
                    </div>
                  </div>

                  <div class="invites-referral-list">
                    <div class="invites-referral-list-header">
                      <span>Name</span>
                      <span>Date</span>
                      <span>Bonus</span>
                      <span class="hide-mobile">Fee</span>
                    </div>
              \`;

              if (refs.length > 0) {
                for (const ref of refs) {
                  html += \`
                    <div class="invites-referral-item">
                      <span class="name">\${ref.referred_name || 'Anonymous'}</span>
                      <span class="date">\${new Date(ref.created_at).toLocaleDateString()}</span>
                      <span class="bonus">+MWK \${parseFloat(ref.bonus_amount || 0).toLocaleString()}</span>
                      <span class="fee hide-mobile">-\${parseFloat(ref.fee_deducted || 0).toLocaleString()}</span>
                    </div>
                  \`;
                }
              } else {
                html += \`
                  <div class="invites-empty">
                    <div class="icon">👥</div>
                    <h3>No referrals yet</h3>
                    <p>Share your referral link to start earning</p>
                  </div>
                \`;
              }

              html += \`
                  </div>
                </div>
              \`;
              
              c.innerHTML = html;
            } else {
              c.innerHTML = \`
                <div class="invites-empty">
                  <div class="icon">⚠️</div>
                  <h3>Error Loading Data</h3>
                  <p>\${data.message || 'Please refresh the page to try again'}</p>
                </div>
              \`;
            }
          })
          .catch(function(err) {
            console.error('Referral fetch error:', err);
            c.innerHTML = \`
              <div class="invites-empty">
                <div class="icon">⚠️</div>
                <h3>Network Error</h3>
                <p>Please check your connection and refresh the page</p>
              </div>
            \`;
          });
        break;`;

// Replace the invites case
const startPos = content.indexOf('case \'invites\':');
let endPos = content.indexOf('break;', startPos) + 6;
content = content.substring(0, startPos) + newInvitesCase + content.substring(endPos);

// Save the file
fs.writeFileSync(filePath, content);
console.log('✅ Invites case updated successfully!');
