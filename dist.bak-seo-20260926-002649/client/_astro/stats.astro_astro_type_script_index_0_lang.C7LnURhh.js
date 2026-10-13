var e=document.getElementById(`stats-container`),t=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`),n=localStorage.getItem(`admin_token`)||``;t.id?r():e.innerHTML=`<div style="text-align:center;padding:60px 20px;color:#6a6a8a;">
      <p>Please log in as admin to view stats.</p>
      <a href="/admin" style="color:#a78bfa;">Go to Admin Login</a>
    </div>`;async function r(){e.innerHTML=`
      <div style="text-align:center;padding:60px 20px;">
        <div class="spinner"></div>
        <div class="loading-text">Loading system stats...</div>
      </div>
    `;try{let t=await(await fetch(`/api/admin/system-stats`,{headers:{Authorization:`Bearer ${n}`}})).json();if(!t.success){e.innerHTML=`<div style="text-align:center;padding:60px;color:#ef4444;">
          ${t.message||`Failed to load stats`}
        </div>`;return}a(t.stats)}catch(t){e.innerHTML=`<div style="text-align:center;padding:60px;color:#ef4444;">
        Network error: ${t.message}
      </div>`}}function i(e){return`MWK `+e.toLocaleString(`en-US`,{minimumFractionDigits:0,maximumFractionDigits:0})}function a(t){let n=t.paychangu||{},a=n.mainBalance||0,o=n.collectionBalance||0,s=a+o,c=t.withdrawals?.pending||{count:0,totalRequested:0},l=t.withdrawals?.processing||{count:0,totalRequested:0},u=t.withdrawals?.completed||{count:0,totalPaid:0,totalFees:0},d=c.totalRequested+l.totalRequested,f=s-d;e.innerHTML=`
      <!-- Header -->
      <div class="stats-header">
        <div>
          <div class="stats-title">System Stats</div>
          <div class="stats-subtitle">PayChangu Balance & Platform Metrics</div>
        </div>
        <button class="refresh-btn" onclick="loadStats()" id="refresh-btn">
          ↻ Refresh
        </button>
      </div>

      <!-- PayChangu Balance -->
      <div class="balance-card" style="margin-bottom:24px;">
        <div class="balance-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          PayChangu Wallet Balance
          ${n.environment?`<span class="badge badge--green" style="margin-left:8px;">${n.environment}</span>`:``}
        </div>
        <div class="balance-amount">${i(s)}</div>
        <div class="balance-sub">
          Main: ${i(a)} • Collection: ${i(o)}
        </div>
      </div>

      <!-- Net Position -->
      <div class="card" style="margin-bottom:24px; border-color: ${f>=0?`rgba(16,185,129,0.2)`:`rgba(239,68,68,0.2)`};">
        <div class="card-label">Platform Net Position</div>
        <div class="card-value ${f>=0?`card-value--green`:`card-value--red`}" style="font-size:24px;">
          ${i(f)}
        </div>
        <div class="card-sub">
          PayChangu balance (${i(s)}) − Pending payouts (${i(d)})
          ${f>=0?` ✅`:` ⚠️ Insufficient funds for pending withdrawals`}
        </div>
      </div>

      <!-- Revenue & Users -->
      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Revenue & Users
      </div>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-label">Total Revenue</div>
          <div class="card-value card-value--green">${i(t.revenue?.totalCollected||0)}</div>
          <div class="card-sub">${t.revenue?.successfulPayments||0} successful payments</div>
        </div>
        <div class="card">
          <div class="card-label">Today's Revenue</div>
          <div class="card-value card-value--blue">${i(t.revenue?.todayCollected||0)}</div>
          <div class="card-sub">${t.revenue?.todayPayments||0} payments today</div>
        </div>
        <div class="card">
          <div class="card-label">Total Users</div>
          <div class="card-value card-value--purple">${t.users?.total||0}</div>
          <div class="card-sub">${t.users?.verified||0} verified • ${t.users?.pending||0} pending</div>
        </div>
        <div class="card">
          <div class="card-label">Today's Registrations</div>
          <div class="card-value card-value--amber">${t.users?.todayRegistrations||0}</div>
          <div class="card-sub">This week: ${t.users?.weekRegistrations||0}</div>
        </div>
      </div>

      <!-- Withdrawals -->
      <div class="section-title" style="margin-top:24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Withdrawals
      </div>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-label">Pending</div>
          <div class="card-value card-value--amber">${c.count}</div>
          <div class="card-sub">${i(c.totalRequested)}</div>
        </div>
        <div class="card">
          <div class="card-label">Processing</div>
          <div class="card-value card-value--blue">${l.count}</div>
          <div class="card-sub">${i(l.totalRequested)}</div>
        </div>
        <div class="card">
          <div class="card-label">Completed</div>
          <div class="card-value card-value--green">${u.count}</div>
          <div class="card-sub">Paid: ${i(u.totalPaid)}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Fees Earned</div>
          <div class="card-value card-value--purple">${i(u.totalFees||0)}</div>
          <div class="card-sub">From withdrawal fees</div>
        </div>
      </div>

      <!-- Wallet Health -->
      <div class="section-title" style="margin-top:24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Wallet Health
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-label">User Balances</div>
          <div class="card-value card-value--white">${i(t.wallets?.totalUserBalances||0)}</div>
          <div class="card-sub">${t.wallets?.totalWallets||0} wallets</div>
        </div>
        <div class="card">
          <div class="card-label">Total Withdrawn</div>
          <div class="card-value card-value--green">${i(t.wallets?.totalWithdrawn||0)}</div>
          <div class="card-sub">Fees paid: ${i(t.wallets?.totalFeesPaid||0)}</div>
        </div>
      </div>

      <!-- Referrals -->
      <div class="section-title" style="margin-top:24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Referral Program
      </div>
      <div class="grid grid-2">
        ${(t.referrals||[]).map(e=>`
          <div class="card">
            <div class="card-label">${e.type===`first_level`?`Level 1 Referrals`:`Level 2 Referrals`}</div>
            <div class="card-value card-value--purple">${e.count}</div>
            <div class="card-sub">Paid: ${e.paidCount} • Total: ${i(e.totalPaid)}</div>
          </div>
        `).join(``)}
      </div>

      <!-- Premium Sales -->
      <div class="section-title" style="margin-top:24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        Premium Sales
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-label">Premium Packs</div>
          <div class="card-value card-value--amber">${t.premium?.packSales||0}</div>
          <div class="card-sub">Revenue: ${i(t.premium?.packRevenue||0)}</div>
        </div>
        <div class="card">
          <div class="card-label">Course Purchases</div>
          <div class="card-value card-value--blue">${t.premium?.courseSales||0}</div>
          <div class="card-sub">Revenue: ${i(t.premium?.courseRevenue||0)}</div>
        </div>
      </div>

      <!-- Transaction Breakdown -->
      <div class="section-title" style="margin-top:24px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Transaction Breakdown
      </div>
      <div class="card">
        ${(t.transactions||[]).map(e=>`
          <div class="stat-row">
            <span class="stat-label">${e.type.replace(/_/g,` `)}</span>
            <span style="display:flex;gap:16px;align-items:center;">
              <span class="badge badge--blue">${e.count} txns</span>
              <span class="stat-value">${i(e.totalAmount)}</span>
              ${e.totalFees>0?`<span class="badge badge--green">Fees: ${i(e.totalFees)}</span>`:``}
            </span>
          </div>
        `).join(``)}
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:32px;padding:16px;color:#4a4a60;font-size:11px;">
        Last refreshed: ${new Date().toLocaleString()} • Auto-refresh: 60s
      </div>
    `,setTimeout(r,6e4)}