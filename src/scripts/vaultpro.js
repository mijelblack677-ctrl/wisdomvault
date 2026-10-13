// ============================================================
// VAULTPRO SUPERADMIN PANEL — ULTIMATE CONTROL
// Separate panel from /vault with its own login.
// Only admin_users with role='super_admin' can sign in.
// ============================================================

const ICON = {
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  tree: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="12" x2="12" y2="20"/><line x1="12" y1="12" x2="12" y2="4"/></svg>',
  referrals: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  unverified: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  sql: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  cleanup: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  key: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  bell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  dollar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  withdraw: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  proof: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
};

const root = document.getElementById('vp-root');
let token = localStorage.getItem('vaultpro_token') || '';
let currentAdmin = null;
let _vpUsersCache = [];

const VERCEL_BYPASS_SECRET = import.meta.env.PUBLIC_VERCEL_BYPASS_SECRET || '';

// ============================================================
// FETCH HELPER
// ============================================================
async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (VERCEL_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = VERCEL_BYPASS_SECRET;

  const res = await fetch(path, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ============================================================
// TOAST
// ============================================================
function toast(message, type = 'success') {
  const existing = document.getElementById('vp-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'vp-toast';
  t.className = 'vp-toast vp-toast--' + type;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function money(n) {
  const v = parseFloat(n || 0);
  return 'MWK ' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch { return String(d); }
}

function statusChip(status) {
  const map = {
    verified: 'vp-chip--green',
    pending: 'vp-chip--amber',
    rejected: 'vp-chip--red',
    completed: 'vp-chip--green',
    processing: 'vp-chip--blue',
    failed: 'vp-chip--red',
    approved: 'vp-chip--green',
    active: 'vp-chip--green',
  };
  return `<span class="vp-chip ${map[status] || 'vp-chip--blue'}">${esc(status || '—')}</span>`;
}

// ============================================================
// LOGIN
// ============================================================
function renderLogin() {
  root.innerHTML = `
    <div class="vp-login">
      <div class="vp-login-card">
        <span class="vp-login-badge">🔐 SuperAdmin Portal</span>
        <h1 class="vp-login-title">VaultPro</h1>
        <p class="vp-login-sub">Ultimate control panel — full system administration</p>

        <div class="vp-field">
          <label class="vp-label">Username or Email</label>
          <input type="text" id="vp-identifier" class="vp-input" placeholder="vaultpro" autocomplete="username" />
        </div>
        <div class="vp-field">
          <label class="vp-label">Password</label>
          <input type="password" id="vp-password" class="vp-input" placeholder="••••••••••" autocomplete="current-password" />
        </div>

        <button type="button" class="vp-btn" id="vp-login-btn">Sign In to VaultPro</button>
        <div id="vp-login-msg" class="vp-msg"></div>

        <div class="vp-login-footer">
          <span>Only super_admin accounts are authorized.</span>
        </div>
      </div>
    </div>
  `;

  const submit = async () => {
    const identifier = document.getElementById('vp-identifier').value.trim();
    const password = document.getElementById('vp-password').value;
    const msg = document.getElementById('vp-login-msg');
    const btn = document.getElementById('vp-login-btn');

    if (!identifier || !password) {
      msg.className = 'vp-msg vp-msg--error';
      msg.textContent = 'Enter your username/email and password.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    msg.className = 'vp-msg';

    try {
      const { status, data } = await api('/api/vaultpro/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });

      if (data && data.success) {
        token = data.token;
        currentAdmin = data.admin;
        localStorage.setItem('vaultpro_token', token);
        msg.className = 'vp-msg vp-msg--success';
        msg.textContent = 'Access granted. Loading panel...';
        setTimeout(renderShell, 400);
      } else {
        msg.className = 'vp-msg vp-msg--error';
        msg.textContent = (data && data.message) || 'Invalid credentials.';
        btn.disabled = false;
        btn.textContent = 'Sign In to VaultPro';
      }
    } catch (err) {
      msg.className = 'vp-msg vp-msg--error';
      msg.textContent = 'Network error. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Sign In to VaultPro';
    }
  };

  document.getElementById('vp-login-btn').addEventListener('click', submit);
  document.getElementById('vp-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
}

// ============================================================
// SHELL
// ============================================================
function renderShell() {
  root.innerHTML = `
    <div class="vp-shell">
      <aside class="vp-sidebar" id="vp-sidebar">
        <div class="vp-sidebar-brand">
          <div class="vp-brand-icon">VP</div>
          <div class="vp-brand-name">VaultPro<span>SuperAdmin</span></div>
        </div>

        <div class="vp-nav-section">Overview</div>
        <button class="vp-nav-link vp-nav-link--active" data-panel="dashboard">${ICON.dashboard} Dashboard</button>

        <div class="vp-nav-section">Users & Money</div>
        <button class="vp-nav-link" data-panel="users">${ICON.users} Users</button>
        <button class="vp-nav-link" data-panel="unverified">${ICON.unverified} Unverified Cleanup</button>

        <div class="vp-nav-section">Referrals</div>
        <button class="vp-nav-link" data-panel="referral-tree">${ICON.tree} Referral Tree</button>
        <button class="vp-nav-link" data-panel="referrals">${ICON.referrals} Referral System</button>

        <div class="vp-nav-section">Finance</div>
        <button class="vp-nav-link" data-panel="withdrawals">${ICON.withdraw} Withdrawals</button>
        <button class="vp-nav-link" data-panel="proofs">${ICON.proof} Payment Proofs</button>

        <div class="vp-nav-section">System</div>
        <button class="vp-nav-link" data-panel="sql">${ICON.sql} SQL Console</button>
        <button class="vp-nav-link" data-panel="cleanup">${ICON.cleanup} 7-Day Cleanup</button>
        <button class="vp-nav-link" data-panel="admins">${ICON.shield} Admin Accounts</button>
        <button class="vp-nav-link" data-panel="whatsapp-groups">${ICON.users} WhatsApp Groups</button>

        <div class="vp-nav-section" style="margin-top:12px;"></div>
        <button class="vp-nav-link" id="vp-logout">${ICON.logout} Sign Out</button>
      </aside>

      <main class="vp-main">
        <header class="vp-header">
          <div class="vp-header-title">
            <button class="vp-menu-btn" id="vp-menu-btn" aria-label="Open navigation menu" aria-controls="vp-sidebar" aria-expanded="false">${ICON.menu}</button>
            <div>
              <div class="vp-page-title" id="vp-panel-title">Dashboard</div>
              <div class="vp-page-sub" id="vp-panel-sub"></div>
            </div>
          </div>
          <div class="vp-header-user">
            <span class="vp-muted">${currentAdmin ? esc(currentAdmin.username) : ''} · super_admin</span>
            <div class="vp-header-avatar">${currentAdmin ? esc((currentAdmin.username || 'S')[0].toUpperCase()) : 'S'}</div>
          </div>
        </header>
        <div id="vp-panel"></div>
      </main>
    </div>
    <div class="vp-backdrop" id="vp-backdrop"></div>
  `;

  // ── Mobile nav: hamburger toggles the sidebar drawer ──────
  const sidebar = document.getElementById('vp-sidebar');
  const backdrop = document.getElementById('vp-backdrop');
  const menuBtn = document.getElementById('vp-menu-btn');
  const setMobileNav = (open) => {
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle('vp-sidebar--open', open);
    backdrop.classList.toggle('vp-backdrop--show', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  const isMobileNav = () => window.matchMedia('(max-width: 768px)').matches;

  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMobileNav(!sidebar.classList.contains('vp-sidebar--open')));
  }
  if (backdrop) backdrop.addEventListener('click', () => setMobileNav(false));

  if (!document._vpEscBound) {
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMobileNav(false); });
    document._vpEscBound = true;
  }

  document.querySelectorAll('.vp-nav-link[data-panel]').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.vp-nav-link').forEach((l) => l.classList.remove('vp-nav-link--active'));
      link.classList.add('vp-nav-link--active');
      loadPanel(link.dataset.panel);
      if (isMobileNav()) setMobileNav(false);
    });
  });

  document.getElementById('vp-logout').addEventListener('click', async () => {
    if (!confirm('Sign out of VaultPro?')) return;
    await api('/api/vaultpro/logout', { method: 'POST' });
    localStorage.removeItem('vaultpro_token');
    token = '';
    currentAdmin = null;
    renderLogin();
  });

  loadPanel('dashboard');
}

const PANEL_TITLES = {
  dashboard: ['Dashboard', 'Live system overview'],
  users: ['Users', 'Search, manage and control all users'],
  unverified: ['Unverified Users', 'Preview and delete stale unverified accounts'],
  'referral-tree': ['Referral Tree', 'Upline & downline for any user'],
  referrals: ['Referral System', 'Stats, list, diagnostics and fixes'],
  withdrawals: ['Withdrawals', 'Process and review all payouts'],
  proofs: ['Payment Proofs', 'Approve or reject proof submissions'],
  sql: ['SQL Console', 'Run custom SQL against the database'],
  cleanup: ['7-Day Cleanup', 'Remove old notifications, content and unverified users'],
  admins: ['Admin Accounts', 'Manage who has admin access'],
  'whatsapp-groups': ['WhatsApp Groups', 'Manage class group links shown to users'],
};

function loadPanel(panel) {
  const [title, sub] = PANEL_TITLES[panel] || [panel, ''];
  document.getElementById('vp-panel-title').textContent = title;
  document.getElementById('vp-panel-sub').textContent = sub;

  const container = document.getElementById('vp-panel');
  container.innerHTML = '<div class="vp-empty">Loading...</div>';

  switch (panel) {
    case 'dashboard': loadDashboard(container); break;
    case 'users': loadUsers(container); break;
    case 'unverified': loadUnverified(container); break;
    case 'referral-tree': loadReferralTree(container); break;
    case 'referrals': loadReferrals(container); break;
    case 'withdrawals': loadWithdrawals(container); break;
    case 'proofs': loadProofs(container); break;
    case 'sql': loadSql(container); break;
    case 'cleanup': loadCleanup(container); break;
    case 'admins': loadAdmins(container); break;
    case 'whatsapp-groups': window._vpLoadWhatsAppGroups(container); break;
    default: loadDashboard(container);
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard(container) {
  try {
    const [statsRes, sysRes, finRes] = await Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/system-stats'),
      api('/api/admin/financial-overview'),
    ]);

    const stats = (statsRes.data && statsRes.data.stats) || {};
    const sys = (sysRes.data && sysRes.data.stats) || {};
    const fin = (finRes.data && finRes.data.stats) || {};

    const users = sys.users || {};
    const revenue = sys.revenue || {};
    const w = sys.withdrawals || {};
    const wallets = sys.wallets || {};
    const pc = fin.paychangu || {};
    const referrals = sys.referrals || [];

    const pendingW = w.pending || { count: 0, totalRequested: 0 };
    const completedW = w.completed || { count: 0, totalPaid: 0 };

    let referralCards = '';
    if (referrals.length > 0) {
      referralCards = referrals.map((r) => `
        <div class="vp-stat">
          <div class="vp-stat-label">${esc(r.type || 'referral')}</div>
          <div class="vp-stat-value">${r.count}</div>
          <div class="vp-stat-sub">Paid: ${r.paidCount} · ${money(r.totalPaid)}</div>
        </div>
      `).join('');
    } else {
      referralCards = '<div class="vp-stat"><div class="vp-stat-label">Referrals</div><div class="vp-stat-value">0</div></div>';
    }

    container.innerHTML = `
      <div class="vp-card" style="background:linear-gradient(135deg, rgba(245,158,11,0.08), rgba(167,139,250,0.08));border-color:rgba(245,158,11,0.2);">
        <div class="vp-card-title">PayChangu Wallet</div>
        <div style="font-size:34px;font-weight:900;background:linear-gradient(135deg,#fbbf24,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          ${money((pc.mainBalance || 0) + (pc.collectionBalance || 0))}
        </div>
        <div class="vp-muted" style="margin-top:6px;">
          Main: ${money(pc.mainBalance || 0)} · Collection: ${money(pc.collectionBalance || 0)}
        </div>
      </div>

      <div class="vp-grid vp-grid-4">
        <div class="vp-stat">
          <div class="vp-stat-label">Total Users</div>
          <div class="vp-stat-value">${users.total || 0}</div>
          <div class="vp-stat-sub">${users.verified || 0} verified · ${users.pending || 0} pending</div>
        </div>
        <div class="vp-stat">
          <div class="vp-stat-label">Registrations Today</div>
          <div class="vp-stat-value">${users.todayRegistrations || 0}</div>
          <div class="vp-stat-sub">This week: ${users.weekRegistrations || 0}</div>
        </div>
        <div class="vp-stat">
          <div class="vp-stat-label">Revenue Collected</div>
          <div class="vp-stat-value" style="color:#34d399;">${money(revenue.totalCollected || 0)}</div>
          <div class="vp-stat-sub">${revenue.successfulPayments || 0} successful payments</div>
        </div>
        <div class="vp-stat">
          <div class="vp-stat-label">Pending Withdrawals</div>
          <div class="vp-stat-value" style="color:#fbbf24;">${pendingW.count || 0}</div>
          <div class="vp-stat-sub">${money(pendingW.totalRequested || 0)} requested</div>
        </div>
      </div>

      <div class="vp-grid vp-grid-4 vp-mt">
        <div class="vp-stat">
          <div class="vp-stat-label">Wallet Balances</div>
          <div class="vp-stat-value">${money(wallets.totalUserBalances || 0)}</div>
          <div class="vp-stat-sub">${wallets.totalWallets || 0} wallets</div>
        </div>
        <div class="vp-stat">
          <div class="vp-stat-label">Total Withdrawn</div>
          <div class="vp-stat-value" style="color:#f87171;">${money(wallets.totalWithdrawn || 0)}</div>
          <div class="vp-stat-sub">Fees paid: ${money(wallets.totalFeesPaid || 0)}</div>
        </div>
        <div class="vp-stat">
          <div class="vp-stat-label">Completed Payouts</div>
          <div class="vp-stat-value">${completedW.count || 0}</div>
          <div class="vp-stat-sub">${money(completedW.totalPaid || 0)} paid out</div>
        </div>
        <div class="vp-stat">
          <div class="vp-stat-label">Net Profit</div>
          <div class="vp-stat-value" style="color:${(fin.profit?.net || 0) >= 0 ? '#34d399' : '#f87171'};">${money(fin.profit?.net || 0)}</div>
          <div class="vp-stat-sub">Margin: ${fin.profit?.margin || 0}%</div>
        </div>
      </div>

      <div class="vp-grid vp-grid-3 vp-mt">
        ${referralCards}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="vp-empty vp-danger-text">Failed to load dashboard: ${esc(err.message)}</div>`;
  }
}

// ============================================================
// USERS
// ============================================================
async function loadUsers(container, search = '') {
  container.innerHTML = `
    <div class="vp-toolbar">
      <input class="vp-search" id="vp-user-search" placeholder="Search by name, email, phone or referral code..." value="${esc(search)}" />
      <button class="vp-btn vp-btn--sm vp-btn--success" id="vp-create-user">${ICON.plus} Create User</button>
    </div>
    <div class="vp-card">
      <div id="vp-users-body"><div class="vp-empty">Loading users...</div></div>
    </div>
  `;

  document.getElementById('vp-user-search').addEventListener('input', (e) => {
    clearTimeout(window.__vpUserSearchT);
    window.__vpUserSearchT = setTimeout(() => loadUsers(container, e.target.value.trim()), 350);
  });
  document.getElementById('vp-create-user').addEventListener('click', () => showCreateUserModal());

  try {
    const q = search ? '?search=' + encodeURIComponent(search) : '';
    const { data } = await api('/api/vaultpro/users' + q);
    if (!data || !data.success) {
      document.getElementById('vp-users-body').innerHTML = `<div class="vp-empty">${esc(data?.message || 'Failed to load users')}</div>`;
      return;
    }

    const users = data.users || [];
    _vpUsersCache = users;
    if (users.length === 0) {
      document.getElementById('vp-users-body').innerHTML = '<div class="vp-empty">No users found.</div>';
      return;
    }

    let rows = '';
    for (const u of users) {
      const activeChip = u.is_active
        ? '<span class="vp-chip vp-chip--green">Active</span>'
        : '<span class="vp-chip vp-chip--red">Inactive</span>';
      rows += `
        <tr>
          <td><strong>${esc(u.full_name || '—')}</strong><br><span class="vp-muted">${esc(u.referral_code || '')}</span></td>
          <td>${esc(u.email || '—')}</td>
          <td>${esc(u.phone || '—')}</td>
          <td>${statusChip(u.payment_status)}</td>
          <td>${activeChip}</td>
          <td class="vp-money">${money(u.balance_available)}</td>
          <td class="vp-money">${money(u.store_credit)}</td>
          <td><button class="vp-btn vp-btn--sm" data-user-id="${u.id}">Manage</button></td>
        </tr>
      `;
    }

    document.getElementById('vp-users-body').innerHTML = `
      <div class="vp-muted" style="margin-bottom:10px;">${data.total} users found</div>
      <div class="vp-table-wrap">
        <table class="vp-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Account</th><th>Balance</th><th>Store Credit</th><th></th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
    document.querySelectorAll('#vp-users-body [data-user-id]').forEach((btn) => {
      btn.addEventListener('click', () => window._vpUserDetail(btn.dataset.userId));
    });
  } catch (err) {
    document.getElementById('vp-users-body').innerHTML = `<div class="vp-empty vp-danger-text">${esc(err.message)}</div>`;
  }
}

window._vpUserDetail = async function (userId) {
  const { data } = await api('/api/vaultpro/user?id=' + encodeURIComponent(userId));
  if (!data || !data.success) {
    toast((data && data.message) || 'Failed to load user', 'error');
    return;
  }

  const u = data.user;
  const upline = data.upline;
  const downline = data.downline || [];
  const txns = data.transactions || [];
  const referrals = data.referrals || [];

  // Cache the user (id + name) so actions like Delete never interpolate names
  // into inline handlers.
  if (!_vpUsersCache.some((x) => String(x.id) === String(u.id))) {
    _vpUsersCache.push({ id: u.id, full_name: u.full_name, email: u.email });
  }

  const modal = document.createElement('div');
  modal.className = 'vp-modal-bg';
  modal.innerHTML = `
    <div class="vp-modal">
      <button class="vp-modal-close" onclick="this.closest('.vp-modal-bg').remove()">✕</button>
      <div class="vp-modal-title">${esc(u.full_name || 'User')}</div>
      <div class="vp-modal-sub">${esc(u.email || '')} · ${esc(u.phone || '')} · Ref: ${esc(u.referral_code || '')}</div>

      <div class="vp-grid vp-grid-3" style="margin-bottom:16px;">
        <div class="vp-stat"><div class="vp-stat-label">Balance</div><div class="vp-stat-value" style="font-size:20px;color:#34d399;">${money(u.balance_available)}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">Store Credit</div><div class="vp-stat-value" style="font-size:20px;color:#fbbf24;">${money(u.store_credit)}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">Status</div><div class="vp-stat-value" style="font-size:20px;">${statusChip(u.payment_status)}</div></div>
      </div>

      <div class="vp-card" style="margin-bottom:16px;">
        <div class="vp-card-title">${ICON.dollar} Wallet Actions</div>
        <div class="vp-flex">
          <button class="vp-btn vp-btn--sm vp-btn--success" onclick="window._vpAddFunds('${u.id}')">${ICON.plus} Add Funds</button>
          <button class="vp-btn vp-btn--sm" onclick="window._vpStoreCredit('${u.id}')">${ICON.plus} Add Store Credit</button>
          <button class="vp-btn vp-btn--sm" onclick="window._vpVerify('${u.id}', ${u.payment_status === 'verified'})">${u.payment_status === 'verified' ? ICON.x + ' Unverify' : ICON.check + ' Verify'}</button>
          <button class="vp-btn vp-btn--sm" onclick="window._vpToggleActive('${u.id}')">${u.is_active ? 'Deactivate' : 'Activate'}</button>
          <button class="vp-btn vp-btn--sm" onclick="window._vpResetPw('${u.id}')">${ICON.key} Reset Password</button>
          <button class="vp-btn vp-btn--sm" onclick="window._vpNotify('${u.id}')">${ICON.bell} Notify</button>
          <button class="vp-btn vp-btn--sm vp-btn--danger" data-del-user-id="${u.id}">${ICON.x} Delete</button>
        </div>
      </div>

      <div class="vp-card" style="margin-bottom:16px;">
        <div class="vp-card-title">${ICON.tree} Referral Info</div>
        <div style="font-size:13px;line-height:1.7;">
          <div><strong>Upline:</strong> ${upline ? esc(upline.full_name) + ' (' + esc(upline.email) + ')' : '— (root / none)'}</div>
          <div><strong>Direct downline:</strong> ${downline.length} people</div>
        </div>
      </div>

      <div class="vp-card" style="margin-bottom:16px;">
        <div class="vp-card-title">${ICON.referrals} Referrals (${referrals.length})</div>
        ${referrals.length === 0 ? '<div class="vp-empty" style="padding:16px;">No referrals</div>' : `
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>Referred</th><th>Type</th><th>Bonus</th><th>Paid</th><th>Date</th></tr></thead>
            <tbody>
              ${referrals.map((r) => `
                <tr>
                  <td>${esc(r.referred_name || '?')}</td>
                  <td>${statusChip(r.referral_type)}</td>
                  <td class="vp-money">${money(r.bonus_amount)}</td>
                  <td>${r.is_paid ? ICON.check : '—'}</td>
                  <td>${fmtDate(r.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>

      <div class="vp-card">
        <div class="vp-card-title">${ICON.withdraw} Transactions (${txns.length})</div>
        ${txns.length === 0 ? '<div class="vp-empty" style="padding:16px;">No transactions</div>' : `
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>Type</th><th>Amount</th><th>Balance</th><th>Description</th><th>Date</th></tr></thead>
            <tbody>
              ${txns.map((t) => `
                <tr>
                  <td>${statusChip(t.transaction_type)}</td>
                  <td class="vp-money">${money(t.amount)}</td>
                  <td>${money(t.balance_after)}</td>
                  <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t.description || '')}</td>
                  <td>${fmtDate(t.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  modal.querySelectorAll('[data-del-user-id]').forEach((btn) => {
    btn.addEventListener('click', () => window._vpDeleteUser(btn.dataset.delUserId));
  });
};

window._vpAddFunds = function (userId) {
  const amount = prompt('Amount to add (MWK):');
  if (!amount) return;
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) { toast('Invalid amount', 'error'); return; }
  const notes = prompt('Notes (optional):') || '';
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action: 'add_funds', userId, amount: amt, notes })
  }).then(({ data }) => {
    if (data && data.success) { toast(data.message); refreshUserModal(userId); }
    else toast((data && data.message) || 'Failed', 'error');
  });
};

window._vpStoreCredit = function (userId) {
  const amount = prompt('Store credit amount (MWK):');
  if (!amount) return;
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) { toast('Invalid amount', 'error'); return; }
  const notes = prompt('Notes (optional):') || '';
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action: 'add_store_credit', userId, amount: amt, notes })
  }).then(({ data }) => {
    if (data && data.success) { toast(data.message); refreshUserModal(userId); }
    else toast((data && data.message) || 'Failed', 'error');
  });
};

window._vpVerify = function (userId, currentlyVerified) {
  const action = currentlyVerified ? 'unverify' : 'verify';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action, userId })
  }).then(({ data }) => {
    if (data && data.success) { toast(data.message); refreshUserModal(userId); }
    else toast((data && data.message) || 'Failed', 'error');
  });
};

window._vpToggleActive = function (userId) {
  if (!confirm('Toggle this user\'s active status?')) return;
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action: 'toggle_active', userId })
  }).then(({ data }) => {
    if (data && data.success) { toast(data.message); refreshUserModal(userId); }
    else toast((data && data.message) || 'Failed', 'error');
  });
};

window._vpResetPw = function (userId) {
  const newPassword = prompt('New password (min 6 characters):');
  if (!newPassword) return;
  if (newPassword.length < 6) { toast('Password too short', 'error'); return; }
  if (!confirm('Reset this user\'s password?')) return;
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action: 'reset_password', userId, newPassword })
  }).then(({ data }) => {
    if (data && data.success) toast(data.message);
    else toast((data && data.message) || 'Failed', 'error');
  });
};

window._vpNotify = function (userId) {
  const title = prompt('Notification title:');
  if (!title) return;
  const message = prompt('Notification message:');
  if (!message) return;
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action: 'notify', userId, title, message })
  }).then(({ data }) => {
    if (data && data.success) toast(data.message);
    else toast((data && data.message) || 'Failed', 'error');
  });
};

window._vpDeleteUser = function (userId) {
  // Look the user up from the loaded list (never interpolate names into JS)
  const found = _vpUsersCache.find((u) => String(u.id) === String(userId));
  const name = (found && found.full_name) || 'this user';
  if (!confirm(`⚠️ DELETE ${name}?\n\nThis permanently removes the user, wallet, transactions, referrals and all related data. This CANNOT be undone.`)) return;
  const confirmation = window.prompt('Type OK to confirm deletion:');
  if (confirmation !== 'OK') { toast('Deletion cancelled', 'error'); return; }
  api('/api/vaultpro/user-actions', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete_user', userId })
  }).then(({ data }) => {
    if (data && data.success) {
      toast(data.message);
      document.querySelector('.vp-modal-bg')?.remove();
      loadPanel('users');
    } else toast((data && data.message) || 'Failed', 'error');
  });
};

function refreshUserModal(userId) {
  document.querySelector('.vp-modal-bg')?.remove();
  window._vpUserDetail(userId);
}

function showCreateUserModal() {
  const modal = document.createElement('div');
  modal.className = 'vp-modal-bg';
  modal.innerHTML = `
    <div class="vp-modal" style="max-width:480px;">
      <button class="vp-modal-close" onclick="this.closest('.vp-modal-bg').remove()">✕</button>
      <div class="vp-modal-title">Create New User</div>
      <div class="vp-modal-sub">Manually add a user account (defaults to pending).</div>

      <div class="vp-field"><label class="vp-label">Full Name *</label><input class="vp-input" id="vp-cu-name" /></div>
      <div class="vp-field"><label class="vp-label">Email *</label><input class="vp-input" id="vp-cu-email" type="email" /></div>
      <div class="vp-field"><label class="vp-label">Phone *</label><input class="vp-input" id="vp-cu-phone" /></div>
      <div class="vp-field"><label class="vp-label">Password * (min 6)</label><input class="vp-input" id="vp-cu-password" type="password" /></div>
      <div class="vp-field"><label class="vp-label">Referral Code (optional)</label><input class="vp-input" id="vp-cu-ref" /></div>

      <button class="vp-btn" id="vp-cu-submit">Create User</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('vp-cu-submit').addEventListener('click', async () => {
    const fullName = document.getElementById('vp-cu-name').value.trim();
    const email = document.getElementById('vp-cu-email').value.trim();
    const phone = document.getElementById('vp-cu-phone').value.trim();
    const password = document.getElementById('vp-cu-password').value;
    const referralCode = document.getElementById('vp-cu-ref').value.trim();

    if (!fullName || !email || !phone || !password) { toast('All fields required', 'error'); return; }

    const { data } = await api('/api/vaultpro/user-actions', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_user', fullName, email, phone, password, referralCode })
    });

    if (data && data.success) {
      toast(data.message);
      modal.remove();
      loadPanel('users');
    } else {
      toast((data && data.message) || 'Failed to create user', 'error');
    }
  });
}

// ============================================================
// UNVERIFIED CLEANUP
// ============================================================
async function loadUnverified(container) {
  container.innerHTML = `
    <div class="vp-toolbar">
      <button class="vp-btn vp-btn--sm" onclick="window._vpLoadUnverified()">${ICON.refresh} Refresh</button>
      <button class="vp-btn vp-btn--sm vp-btn--danger" id="vp-unv-delete" style="display:none;">${ICON.x} Delete Listed Users</button>
    </div>
    <div class="vp-card">
      <div class="vp-card-title">${ICON.unverified} Unverified Users (3+ days old)</div>
      <div id="vp-unv-body"><div class="vp-empty">Loading...</div></div>
    </div>
  `;
  window._vpLoadUnverified = async function () {
    const body = document.getElementById('vp-unv-body');
    body.innerHTML = '<div class="vp-empty">Loading...</div>';
    try {
      const { data } = await api('/api/vaultpro/unverified?days=3');
      if (!data || !data.success) { body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`; return; }
      const users = data.users || [];
      document.getElementById('vp-unv-delete').style.display = users.length ? '' : 'none';

      if (users.length === 0) {
        body.innerHTML = '<div class="vp-empty">No unverified users older than 3 days. 🎉</div>';
        return;
      }

      let rows = '';
      for (const u of users) {
        rows += `
          <tr>
            <td>${esc(u.full_name || '—')}</td>
            <td>${esc(u.email || '—')}</td>
            <td>${esc(u.phone || '—')}</td>
            <td>${fmtDate(u.created_at)}</td>
            <td>${u.referral_count || 0}</td>
          </tr>
        `;
      }

      body.innerHTML = `
        <div class="vp-muted" style="margin-bottom:10px;">${data.count} stale unverified users will be permanently deleted.</div>
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Referrals</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(err.message)}</div>`;
    }
  };

  document.getElementById('vp-unv-delete').addEventListener('click', async () => {
    if (!confirm('⚠️ This will permanently delete ALL listed unverified users (3+ days old) with all their data. Continue?')) return;
    if (window.prompt('Type OK to confirm:') !== 'OK') { toast('Cancelled', 'error'); return; }
    const { data } = await api('/api/vaultpro/unverified', {
      method: 'POST',
      body: JSON.stringify({ days: 3 })
    });
    if (data && data.success) {
      toast(data.message);
      window._vpLoadUnverified();
    } else {
      toast((data && data.message) || 'Failed', 'error');
    }
  });

  window._vpLoadUnverified();
}

// ============================================================
// REFERRAL TREE
// ============================================================
async function loadReferralTree(container) {
  container.innerHTML = `
    <div class="vp-toolbar">
      <input class="vp-search" id="vp-tree-search" placeholder="Name, email, phone, referral code or ID..." />
      <button class="vp-btn vp-btn--sm" id="vp-tree-go">${ICON.tree} View Tree</button>
    </div>
    <div class="vp-card">
      <div id="vp-tree-body"><div class="vp-empty">Enter a user to see their upline & downline.</div></div>
    </div>
  `;

  const go = async () => {
    const identifier = document.getElementById('vp-tree-search').value.trim();
    if (!identifier) return;
    const body = document.getElementById('vp-tree-body');
    body.innerHTML = '<div class="vp-empty">Loading tree...</div>';

    const { data } = await api('/api/vaultpro/referral-tree?identifier=' + encodeURIComponent(identifier));
    if (!data || !data.success) {
      body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`;
      return;
    }

    const upline = data.upline || [];
    const downline = data.downline || [];
    const level2 = data.level2 || [];

    let uplineHtml = '';
    if (upline.length === 0) {
      uplineHtml = '<div class="vp-muted">No upline (root user).</div>';
    } else {
      uplineHtml = upline.map((u, i) => `
        <div class="vp-result-row">Level ${i + 1} ↑ · <strong>${esc(u.full_name)}</strong> · ${esc(u.email)} · ${statusChip(u.payment_status)}</div>
      `).join('');
    }

    let downlineHtml = '';
    if (downline.length === 0) {
      downlineHtml = '<div class="vp-muted">No direct referrals yet.</div>';
    } else {
      downlineHtml = downline.map((u) => `
        <div class="vp-result-row">↓ Level 1 · <strong>${esc(u.full_name)}</strong> · ${esc(u.email)} · ${statusChip(u.payment_status)}</div>
      `).join('');
    }

    let level2Html = '';
    if (level2.length > 0) {
      level2Html = level2.map((u) => `
        <div class="vp-result-row">↓ Level 2 · <strong>${esc(u.full_name)}</strong> · ${esc(u.email)} · ${statusChip(u.payment_status)}</div>
      `).join('');
    } else {
      level2Html = '<div class="vp-muted">No second-level referrals yet.</div>';
    }

    body.innerHTML = `
      <div class="vp-card-title">${esc(data.user.full_name)} · Ref: ${esc(data.user.referral_code)}</div>
      <div style="margin-bottom:18px;">
        <div style="font-weight:700;margin-bottom:8px;color:#fbbf24;">Upline (${upline.length})</div>
        ${uplineHtml}
      </div>
      <div style="margin-bottom:18px;">
        <div style="font-weight:700;margin-bottom:8px;color:#34d399;">Direct Downline (${downline.length})</div>
        ${downlineHtml}
      </div>
      <div>
        <div style="font-weight:700;margin-bottom:8px;color:#a78bfa;">Level 2 Downline (${level2.length})</div>
        ${level2Html}
      </div>
    `;
  };

  document.getElementById('vp-tree-go').addEventListener('click', go);
  document.getElementById('vp-tree-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

// ============================================================
// REFERRAL SYSTEM
// ============================================================
async function loadReferrals(container) {
  container.innerHTML = `
    <div class="vp-toolbar">
      <button class="vp-btn vp-btn--sm" onclick="window._vpLoadReferrals()">${ICON.refresh} Refresh</button>
      <button class="vp-btn vp-btn--sm" id="vp-ref-diagnose">🔍 Diagnose</button>
      <button class="vp-btn vp-btn--sm vp-btn--success" id="vp-ref-fix" style="display:none;">${ICON.check} Fix Missing Level 2</button>
    </div>
    <div id="vp-ref-stats"></div>
    <div class="vp-card">
      <div class="vp-card-title">${ICON.referrals} All Referrals</div>
      <div id="vp-ref-list"><div class="vp-empty">Loading...</div></div>
    </div>
  `;

  document.getElementById('vp-ref-diagnose').addEventListener('click', async () => {
    const { data } = await api('/api/vaultpro/referral-diagnose');
    if (!data || !data.success) { toast(data?.message || 'Diagnose failed', 'error'); return; }

    const fixBtn = document.getElementById('vp-ref-fix');
    fixBtn.style.display = data.missingCount > 0 ? '' : 'none';

    const statsHtml = `
      <div class="vp-grid vp-grid-4" style="margin-bottom:16px;">
        <div class="vp-stat"><div class="vp-stat-label">Level 1 Referrals</div><div class="vp-stat-value">${data.firstLevelCount}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">Level 2 Referrals</div><div class="vp-stat-value">${data.level2Count}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">Missing Level 2</div><div class="vp-stat-value" style="color:${data.missingCount > 0 ? '#f87171' : '#34d399'};">${data.missingCount}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">By Type</div>
          <div class="vp-stat-sub">${(data.byType || []).map((t) => esc(t.referral_type) + ': ' + t.count).join(' · ')}</div>
        </div>
      </div>
      ${data.missingCount > 0 ? `
      <div class="vp-card" style="border-color:rgba(239,68,68,0.3);">
        <div class="vp-card-title" style="color:#f87171;">⚠️ Missing Level 2 Bonuses</div>
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>Referrer</th><th>Level 2 User</th><th>Date</th></tr></thead>
            <tbody>
              ${data.missing.map((m) => `
                <tr><td>${esc(m.referrer_name)} (${esc(m.referrer_email)})</td><td>${esc(m.level2_name)}</td><td>${fmtDate(m.level2_date)}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}
    `;

    document.getElementById('vp-ref-stats').innerHTML = statsHtml;
  });

  document.getElementById('vp-ref-fix').addEventListener('click', async () => {
    if (!confirm('Fix all missing Level 2 bonuses? This credits MWK 1,000 store credit to each eligible referrer.')) return;
    const { data } = await api('/api/vaultpro/referral-diagnose', {
      method: 'POST',
      body: JSON.stringify({ fix: true })
    });
    if (data && data.success) {
      toast(data.message);
      document.getElementById('vp-ref-diagnose').click();
    } else {
      toast((data && data.message) || 'Fix failed', 'error');
    }
  });

  window._vpLoadReferrals = async function () {
    const listEl = document.getElementById('vp-ref-list');
    listEl.innerHTML = '<div class="vp-empty">Loading...</div>';
    try {
      const { data } = await api('/api/vaultpro/referrals');
      if (!data || !data.success) { listEl.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`; return; }

      const stats = (data.stats || []).map((s) => `
        <div class="vp-stat">
          <div class="vp-stat-label">${esc(s.referral_type)}</div>
          <div class="vp-stat-value">${s.count}</div>
          <div class="vp-stat-sub">Paid: ${s.paid_count} · ${money(s.total_paid)}</div>
        </div>
      `).join('');

      document.getElementById('vp-ref-stats').innerHTML = `<div class="vp-grid vp-grid-4" style="margin-bottom:16px;">${stats}</div>`;

      const refs = data.referrals || [];
      if (refs.length === 0) { listEl.innerHTML = '<div class="vp-empty">No referrals yet.</div>'; return; }

      listEl.innerHTML = `
        <div class="vp-muted" style="margin-bottom:10px;">${data.total} referrals</div>
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>Referrer</th><th>Referred</th><th>Type</th><th>Bonus</th><th>Paid</th><th>Date</th></tr></thead>
            <tbody>
              ${refs.map((r) => `
                <tr>
                  <td>${esc(r.referrer_name || '?')}</td>
                  <td>${esc(r.referred_name || '?')}</td>
                  <td>${statusChip(r.referral_type)}</td>
                  <td class="vp-money">${money(r.bonus_amount)}</td>
                  <td>${r.is_paid ? ICON.check : '—'}</td>
                  <td>${fmtDate(r.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      listEl.innerHTML = `<div class="vp-empty vp-danger-text">${esc(err.message)}</div>`;
    }
  };

  window._vpLoadReferrals();
}

// ============================================================
// WITHDRAWALS (reuses admin endpoint — token works on both)
// ============================================================
async function loadWithdrawals(container) {
  container.innerHTML = `
    <div class="vp-toolbar">
      <button class="vp-btn vp-btn--sm" onclick="window._vpLoadWithdrawals()">${ICON.refresh} Refresh</button>
    </div>
    <div class="vp-card">
      <div id="vp-wd-body"><div class="vp-empty">Loading...</div></div>
    </div>
  `;

  window._vpLoadWithdrawals = async function () {
    const body = document.getElementById('vp-wd-body');
    body.innerHTML = '<div class="vp-empty">Loading...</div>';
    try {
      const { data } = await api('/api/admin/withdrawals');
      if (!data || !data.success) { body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`; return; }

      const ws = data.withdrawals || [];
      if (ws.length === 0) { body.innerHTML = '<div class="vp-empty">No withdrawals.</div>'; return; }

      let rows = '';
      for (const w of ws) {
        const canApprove = w.status === 'pending';
        const canReject = w.status === 'pending' || w.status === 'processing';
        rows += `
          <tr>
            <td>${esc(w.full_name || '?')}<br><span class="vp-muted">${esc(w.email || '')}</span></td>
            <td class="vp-money">${money(w.amount_requested)}</td>
            <td>${money(w.withdrawal_fee)}</td>
            <td>${statusChip(w.status)}</td>
            <td>${esc(w.payment_method || '—')}</td>
            <td>${fmtDate(w.requested_at)}</td>
            <td>
              <div class="vp-flex">
                ${canApprove ? `<button class="vp-btn vp-btn--sm vp-btn--success" onclick="window._vpWdAction('${w.id}','completed')">${ICON.check} Approve</button>` : ''}
                ${canReject ? `<button class="vp-btn vp-btn--sm vp-btn--danger" onclick="window._vpWdAction('${w.id}','rejected')">${ICON.x} Reject</button>` : ''}
                ${w.status === 'processing' ? `<button class="vp-btn vp-btn--sm" onclick="window._vpWdAction('${w.id}','completed')">Confirm Sent</button>` : ''}
              </div>
            </td>
          </tr>
        `;
      }

      body.innerHTML = `
        <div class="vp-muted" style="margin-bottom:10px;">${ws.length} withdrawals</div>
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>User</th><th>Requested</th><th>Fee</th><th>Status</th><th>Method</th><th>Requested At</th><th>Actions</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(err.message)}</div>`;
    }
  };

  window._vpWdAction = async function (id, status) {
    const label = status === 'completed' ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${label} this withdrawal?`)) return;
    const notes = status === 'rejected' ? (prompt('Reason (optional):') || '') : '';
    const { data } = await api('/api/admin/withdrawals', {
      method: 'PUT',
      body: JSON.stringify({ withdrawalId: id, status, notes })
    });
    if (data && data.success) {
      toast(data.message);
      window._vpLoadWithdrawals();
    } else {
      toast((data && data.message) || 'Failed', 'error');
    }
  };

  window._vpLoadWithdrawals();
}

// ============================================================
// PAYMENT PROOFS (reuses admin endpoint)
// ============================================================
async function loadProofs(container) {
  container.innerHTML = `
    <div class="vp-toolbar">
      <button class="vp-btn vp-btn--sm" onclick="window._vpLoadProofs()">${ICON.refresh} Refresh</button>
    </div>
    <div class="vp-card">
      <div id="vp-proof-body"><div class="vp-empty">Loading...</div></div>
    </div>
  `;

  window._vpLoadProofs = async function () {
    const body = document.getElementById('vp-proof-body');
    body.innerHTML = '<div class="vp-empty">Loading...</div>';
    try {
      const { data } = await api('/api/admin/payment-proofs');
      if (!data || !data.success) { body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`; return; }

      const proofs = data.proofs || [];
      if (proofs.length === 0) { body.innerHTML = '<div class="vp-empty">No payment proofs.</div>'; return; }

      let rows = '';
      for (const p of proofs) {
        rows += `
          <tr>
            <td>${esc(p.user_name || '?')}</td>
            <td>${esc(p.pack_name || '?')}</td>
            <td>${statusChip(p.status || 'pending')}</td>
            <td>${fmtDate(p.created_at)}</td>
            <td>
              <div class="vp-flex">
                ${(p.status === 'pending') ? `
                  <button class="vp-btn vp-btn--sm vp-btn--success" onclick="window._vpProofAction('${p.id}','${p.user_id}','${p.pack_id}','approved')">${ICON.check} Approve</button>
                  <button class="vp-btn vp-btn--sm vp-btn--danger" onclick="window._vpProofAction('${p.id}','${p.user_id}','${p.pack_id}','rejected')">${ICON.x} Reject</button>
                ` : '—'}
              </div>
            </td>
          </tr>
        `;
      }

      body.innerHTML = `
        <div class="vp-muted" style="margin-bottom:10px;">${proofs.length} proofs</div>
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr><th>User</th><th>Pack</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(err.message)}</div>`;
    }
  };

  window._vpProofAction = async function (id, userId, packId, status) {
    const label = status === 'approved' ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${label} this payment proof?`)) return;
    const notes = status === 'rejected' ? (prompt('Reason (optional):') || '') : '';
    const { data } = await api('/api/admin/payment-proofs', {
      method: 'PUT',
      body: JSON.stringify({ proofId: id, userId, packId, status, notes })
    });
    if (data && data.success) {
      toast(data.message);
      window._vpLoadProofs();
    } else {
      toast((data && data.message) || 'Failed', 'error');
    }
  };

  window._vpLoadProofs();
}

// ============================================================
// SQL CONSOLE
// ============================================================
function loadSql(container) {
  container.innerHTML = `
    <div class="vp-card">
      <div class="vp-card-title">${ICON.sql} Custom SQL</div>
      <p class="vp-muted" style="margin-bottom:12px;">
        Read-only statements (SELECT / SHOW / EXPLAIN / WITH) run freely. Write statements require ticking "Allow write" and are always logged to the audit log.
      </p>
      <textarea class="vp-sql-input" id="vp-sql-query" placeholder="SELECT id, full_name, email, payment_status FROM users LIMIT 20;"></textarea>
      <div class="vp-flex" style="margin-top:12px;">
        <button class="vp-btn vp-btn--sm" id="vp-sql-run">▶ Run</button>
        <label class="vp-muted" style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" id="vp-sql-allowwrite" /> Allow write (INSERT/UPDATE/DELETE/ALTER...)
        </label>
      </div>
      <div id="vp-sql-result" class="vp-mt"></div>
    </div>
  `;

  const run = async () => {
    const query = document.getElementById('vp-sql-query').value.trim();
    const allowWrite = document.getElementById('vp-sql-allowwrite').checked;
    const resultEl = document.getElementById('vp-sql-result');

    if (!query) return;
    resultEl.innerHTML = '<div class="vp-empty">Running...</div>';

    const { status, data } = await api('/api/vaultpro/sql', {
      method: 'POST',
      body: JSON.stringify({ query, allowWrite })
    });

    if (!data || !data.success) {
      resultEl.innerHTML = `<div class="vp-empty vp-danger-text">${esc((data && data.message) || 'Query failed')}</div>`;
      return;
    }

    const rows = data.data || [];
    let body = '';
    if (rows.length === 0) {
      body = '<div class="vp-empty">Query ran successfully — 0 rows returned.</div>';
    } else {
      const cols = Object.keys(rows[0]);
      body = `
        <div class="vp-muted" style="margin-bottom:8px;">${rows.length} rows in ${data.elapsedMs}ms</div>
        <div class="vp-table-wrap">
          <table class="vp-table">
            <thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map((r) => `<tr>${cols.map((c) => `<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r[c])}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    resultEl.innerHTML = body;
  };

  document.getElementById('vp-sql-run').addEventListener('click', run);
  document.getElementById('vp-sql-query').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run();
  });
}

// ============================================================
// 7-DAY CLEANUP
// ============================================================
function loadCleanup(container) {
  container.innerHTML = `
    <div class="vp-card">
      <div class="vp-card-title">${ICON.cleanup} 7-Day Database Cleanup</div>
      <p class="vp-muted" style="margin-bottom:12px;">
        Removes: old notifications (7+ days), old earn/watch content (7+ days), and unverified users (7+ days) with all their data.
      </p>
      <div class="vp-flex">
        <button class="vp-btn vp-btn--sm" id="vp-clean-preview">${ICON.refresh} Preview</button>
        <button class="vp-btn vp-btn--sm vp-btn--danger" id="vp-clean-run">${ICON.cleanup} Run Cleanup</button>
      </div>
      <div id="vp-clean-result" class="vp-mt"></div>
    </div>
  `;

  const preview = async () => {
    const resultEl = document.getElementById('vp-clean-result');
    resultEl.innerHTML = '<div class="vp-empty">Checking...</div>';
    const { data } = await api('/api/vaultpro/cleanup', {
      method: 'POST',
      body: JSON.stringify({ days: 7, dryRun: true })
    });
    if (!data || !data.success) {
      resultEl.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`;
      return;
    }
    resultEl.innerHTML = `
      <div class="vp-grid vp-grid-3" style="margin-top:12px;">
        <div class="vp-stat"><div class="vp-stat-label">Old Notifications</div><div class="vp-stat-value">${data.oldNotifications}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">Old Earn Content</div><div class="vp-stat-value">${data.oldEarnContent}</div></div>
        <div class="vp-stat"><div class="vp-stat-label">Unverified Users</div><div class="vp-stat-value">${data.oldUnverified}</div></div>
      </div>
      <div class="vp-muted vp-mt">Total records that will be removed: <strong>${data.total}</strong></div>
    `;
  };

  document.getElementById('vp-clean-preview').addEventListener('click', preview);

  document.getElementById('vp-clean-run').addEventListener('click', async () => {
    if (!confirm('⚠️ Run the 7-day cleanup? This permanently deletes old notifications, earn content and unverified users.')) return;
    if (window.prompt('Type OK to confirm:') !== 'OK') { toast('Cancelled', 'error'); return; }
    const resultEl = document.getElementById('vp-clean-result');
    resultEl.innerHTML = '<div class="vp-empty">Running cleanup...</div>';
    const { data } = await api('/api/vaultpro/cleanup', {
      method: 'POST',
      body: JSON.stringify({ days: 7 })
    });
    if (data && data.success) {
      resultEl.innerHTML = `
        <div class="vp-grid vp-grid-3" style="margin-top:12px;">
          <div class="vp-stat"><div class="vp-stat-label">Notifications Deleted</div><div class="vp-stat-value" style="color:#34d399;">${data.deletedNotifications}</div></div>
          <div class="vp-stat"><div class="vp-stat-label">Earn Content Deleted</div><div class="vp-stat-value" style="color:#34d399;">${data.deletedEarnContent}</div></div>
          <div class="vp-stat"><div class="vp-stat-label">Users Deleted</div><div class="vp-stat-value" style="color:#34d399;">${data.deletedUsers}</div></div>
        </div>
        <div class="vp-muted vp-mt">Cleanup complete — ${data.total} records removed${data.failedUsers ? ` (${data.failedUsers} failed)` : ''}.</div>
      `;
      toast('Cleanup complete');
    } else {
      resultEl.innerHTML = `<div class="vp-empty vp-danger-text">${esc((data && data.message) || 'Cleanup failed')}</div>`;
    }
  });
}

// ============================================================
// ADMIN ACCOUNTS
// ============================================================
async function loadAdmins(container) {
  container.innerHTML = `
    <div class="vp-toolbar">
      <button class="vp-btn vp-btn--sm" onclick="window._vpLoadAdmins()">${ICON.refresh} Refresh</button>
      <button class="vp-btn vp-btn--sm vp-btn--success" id="vp-admin-create">${ICON.plus} Create Admin</button>
    </div>
    <div class="vp-card">
      <div class="vp-card-title">${ICON.shield} Admin Accounts</div>
      <div id="vp-admins-body"><div class="vp-empty">Loading...</div></div>
    </div>
  `;

  document.getElementById('vp-admin-create').addEventListener('click', () => {
    const username = prompt('Username:');
    if (!username) return;
    const email = prompt('Email:');
    if (!email) return;
    const password = prompt('Password (min 6):');
    if (!password) return;
    const role = prompt('Role (admin / content_manager / support / super_admin):') || 'admin';

    api('/api/vaultpro/admins', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, role })
    }).then(({ data }) => {
      if (data && data.success) { toast(data.message); window._vpLoadAdmins(); }
      else toast((data && data.message) || 'Failed', 'error');
    });
  });

  window._vpLoadAdmins = async function () {
    const body = document.getElementById('vp-admins-body');
    body.innerHTML = '<div class="vp-empty">Loading...</div>';
    const { data } = await api('/api/vaultpro/admins');
    if (!data || !data.success) { body.innerHTML = `<div class="vp-empty vp-danger-text">${esc(data?.message || 'Failed')}</div>`; return; }

    const admins = data.admins || [];
    if (admins.length === 0) { body.innerHTML = '<div class="vp-empty">No admins.</div>'; return; }

    let rows = '';
    for (const a of admins) {
      const isSelf = currentAdmin && currentAdmin.id === a.id;
      rows += `
        <tr>
          <td><strong>${esc(a.username)}</strong>${isSelf ? ' <span class="vp-chip vp-chip--purple">you</span>' : ''}</td>
          <td>${esc(a.email || '—')}</td>
          <td>${statusChip(a.role)}</td>
          <td>${a.is_active ? '<span class="vp-chip vp-chip--green">Active</span>' : '<span class="vp-chip vp-chip--red">Inactive</span>'}</td>
          <td>${fmtDate(a.last_login)}</td>
          <td>
            <div class="vp-flex">
              ${!isSelf ? `
                <button class="vp-btn vp-btn--sm" onclick="window._vpAdminToggle('${a.id}')">${a.is_active ? 'Deactivate' : 'Activate'}</button>
                <button class="vp-btn vp-btn--sm" onclick="window._vpAdminRole('${a.id}')">Change Role</button>
              ` : '<span class="vp-muted">—</span>'}
            </div>
          </td>
        </tr>
      `;
    }

    body.innerHTML = `
      <div class="vp-table-wrap">
        <table class="vp-table">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  window._vpAdminToggle = function (id) {
    if (!confirm('Toggle this admin\'s active status?')) return;
    api('/api/vaultpro/admins')
      .then(({ data }) => {
        const admin = (data && data.admins || []).find((a) => String(a.id) === String(id));
        const isActive = admin ? !admin.is_active : false;
        return api('/api/vaultpro/admins/' + id, {
          method: 'PUT',
          body: JSON.stringify({ is_active: isActive })
        });
      })
      .then(({ data }) => {
        if (data && data.success) { toast(data.message); window._vpLoadAdmins(); }
        else toast((data && data.message) || 'Failed', 'error');
      });
  };

  window._vpAdminRole = function (id) {
    const role = prompt('New role (admin / content_manager / support / super_admin):');
    if (!role) return;
    api('/api/vaultpro/admins/' + id, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }).then(({ data }) => {
      if (data && data.success) { toast(data.message); window._vpLoadAdmins(); }
      else toast((data && data.message) || 'Failed', 'error');
    });
  };

  window._vpLoadAdmins();
}

// ============================================================
// BOOT
// ============================================================
(async function boot() {
  if (!token) {
    renderLogin();
    return;
  }

  try {
    const { data } = await api('/api/vaultpro/me');
    if (data && data.success) {
      currentAdmin = data.admin;
      renderShell();
    } else {
      localStorage.removeItem('vaultpro_token');
      token = '';
      renderLogin();
    }
  } catch (err) {
    localStorage.removeItem('vaultpro_token');
    token = '';
    renderLogin();
  }
})();