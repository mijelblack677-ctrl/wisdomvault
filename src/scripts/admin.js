// ============================================================
// WISDOM VAULT ADMIN DASHBOARD - GOVERNMENT THEME
// Mobile-First with Bottom Navigation
// ============================================================
// ============================================================
// ADMIN VERCEL PROTECTION BYPASS - MONKEY PATCH
// ============================================================

// ============================================================
// SVG ICON CONSTANTS - Replace all emojis
// ============================================================
const ICON = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  library: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  guide: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  box: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  megaphone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  briefcase: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  card: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  clipboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  dollar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  key: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  video: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  vimeo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  music: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  link: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  alert: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
};

const VERCEL_BYPASS_SECRET = import.meta.env.PUBLIC_VERCEL_BYPASS_SECRET || '';

// Save original fetch
const originalFetch = window.fetch;

// Override fetch to always include the bypass header
window.fetch = function(input, options = {}) {
    // See the note in dashboard.js: `input` can be a Request or URL object, not
    // just a string, so it must be coerced before any .includes() call.
    const requestUrl = typeof input === 'string'
        ? input
        : (input && typeof input.url === 'string' ? input.url : String(input));

    // Don't add bypass for login
    if (requestUrl.includes('/api/admin/login')) {
        return originalFetch(input, options);
    }

    // If no bypass secret is configured, skip the header entirely
    if (!VERCEL_BYPASS_SECRET) {
        const token = localStorage.getItem('wv_admin_token');
        return originalFetch(input, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
    }

    // Add bypass header and admin token
    const token = localStorage.getItem('wv_admin_token');
    return originalFetch(input, {
        ...options,
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'x-vercel-protection-bypass': VERCEL_BYPASS_SECRET
        }
    });
};
const adminApp = document.getElementById('admin-root');
let adminToken = localStorage.getItem('wv_admin_token');

// ============================================================
// DOM HELPERS
// ============================================================
function getHeaders() {
  return {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  };
}

// Escape a value for safe insertion into innerHTML
function escHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Last-loaded user list so admin actions can look up a user by id without
// having to interpolate names into inline onclick handlers (which broke for
// names containing apostrophes / quotes).
let _usersCache = [];

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================
// ADMIN TOAST - FIXED (No Duplicates)
// ============================================================
function showAdminToast(message, type = 'success') {
  // Remove any existing toast first
  const existing = document.getElementById('admin-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'admin-toast';
  toast.className = 'admin-toast admin-toast--' + type;

  // Many call sites pass an inline <svg> icon followed by text. Render the
  // icon (safe — it comes from our own call sites) but insert any following
  // text with textContent so server/user data is never injected as HTML.
  const svgMatch = String(message).match(/^(\s*<svg[\s\S]*?<\/svg>\s*)/);
  if (svgMatch) {
    const icon = document.createElement('span');
    icon.className = 'admin-toast__icon';
    icon.innerHTML = svgMatch[1];
    toast.appendChild(icon);
    const text = document.createElement('span');
    text.textContent = String(message).slice(svgMatch[0].length);
    toast.appendChild(text);
  } else {
    toast.textContent = message;
  }

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }
  }, 3000);
}

// ============================================================
// RENDER LOGIN
// ============================================================
function renderLogin() {
  adminApp.innerHTML = `
    <div class="admin-login">
      <div class="admin-login__card">
        <a href="/" class="login-back" title="Go back">‹</a>

        <div class="login-header">
          <span class="admin-portal-badge">Admin Portal</span>
          <h1 class="login-title">Wisdom <span class="gold">Vault</span></h1>
          <p class="login-subtitle">Secure access to the administration panel</p>
        </div>

        <form id="admin-login-form" class="login-form">
          <div class="form-group">
            <label class="form-label">Email or Phone Number</label>
            <input type="text" id="admin-identifier" class="form-input" placeholder="Enter your email or phone" required autocomplete="username" />
            <div style="font-size:11px;color:var(--gov-gray-500);margin-top:4px;">Enter your registered email or phone number</div>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="admin-password" class="form-input" placeholder="Enter your password" required autocomplete="current-password" />
          </div>

          <button type="button" class="login-btn" id="admin-login-btn">Sign In to Dashboard</button>

          <div id="admin-login-msg" class="login-message"></div>

          <div class="login-footer">
            <span>Don't have an account? <a href="/">Request Access</a></span>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('admin-login-btn').addEventListener('click', handleLogin);
  document.getElementById('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const identifier = document.getElementById('admin-identifier').value.trim();
  const password = document.getElementById('admin-password').value;
  const msg = document.getElementById('admin-login-msg');
  const btn = document.getElementById('admin-login-btn');

  if (!identifier || !password) {
    msg.className = 'login-message login-message--error';
    msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Please enter your email/phone and password.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Authenticating...';
  msg.className = 'login-message';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();

    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('wv_admin_token', data.token);
      msg.className = 'login-message login-message--success';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Access granted. Redirecting...';
      setTimeout(renderApp, 500);
    } else {
      msg.className = 'login-message login-message--error';
      msg.innerHTML = data.message || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Invalid credentials.';
      btn.disabled = false;
      btn.textContent = 'Sign In to Dashboard';
    }
  } catch (err) {
    msg.className = 'login-message login-message--error';
    msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error. Please try again.';
    btn.disabled = false;
    btn.textContent = 'Sign In to Dashboard';
  }
}

// ============================================================
// RENDER APP
// ============================================================
function renderApp() {
  fetchStatsForBadges();

  adminApp.innerHTML = `
    <!-- Desktop Sidebar -->
    <aside class="admin-sidebar" id="admin-sidebar">
      <div class="admin-sidebar__header">
        <div class="admin-sidebar__brand">
          <span class="brand-icon">WV</span> Wisdom Vault
        </div>
        <button class="admin-sidebar__close" id="sidebar-close">${ICON.close}</button>
      </div>
      <nav class="admin-sidebar__nav">
        <div class="admin-sidebar__section">Dashboard</div>
        <button class="admin-sidebar__link admin-sidebar__link--active" data-panel="dashboard">
          <span class="admin-sidebar__icon">${ICON.dashboard}</span> Dashboard
        </button>
        <button class="admin-sidebar__link" data-panel="users">
          <span class="admin-sidebar__icon">${ICON.users}</span> Users <span class="admin-sidebar__badge" id="users-badge">0</span>
        </button>

        <div class="admin-sidebar__section">Content Management</div>
        <button class="admin-sidebar__link" data-panel="library-content">
          <span class="admin-sidebar__icon">${ICON.library}</span> Library
        </button>
        <button class="admin-sidebar__link" data-panel="guides-content">
          <span class="admin-sidebar__icon">${ICON.guide}</span> Guides
        </button>
        <button class="admin-sidebar__link" data-panel="add-content">
          <span class="admin-sidebar__icon">${ICON.edit}</span> Add Content
        </button>

        <div class="admin-sidebar__section">Premium</div>
        <button class="admin-sidebar__link" data-panel="packs">
          <span class="admin-sidebar__icon">${ICON.box}</span> Premium Packs
        </button>

        <div class="admin-sidebar__section">Community Ads</div>
        <button class="admin-sidebar__link" data-panel="user-adverts">
          <span class="admin-sidebar__icon">${ICON.megaphone}</span> User Ads <span class="admin-sidebar__badge" id="user-adverts-badge">0</span>
        </button>

        <button class="admin-sidebar__link" data-panel="vacancies">
          <span class="admin-sidebar__icon">${ICON.briefcase}</span> Vacancies
        </button>

        <div class="admin-sidebar__section">Earn & Watch</div>
        <button class="admin-sidebar__link" data-panel="sponsored">
          <span class="admin-sidebar__icon">${ICON.megaphone}</span> Sponsored Tasks
        </button>
        <button class="admin-sidebar__link" data-panel="earn-watch">
          <span class="admin-sidebar__icon">▶️</span> Create Task
        </button>

        <div class="admin-sidebar__section">Payments</div>
        <button class="admin-sidebar__link" data-panel="withdrawals">
          <span class="admin-sidebar__icon">${ICON.card}</span> Withdrawals <span class="admin-sidebar__badge admin-sidebar__badge--danger" id="withdrawals-badge">0</span>
        </button>
        <button class="admin-sidebar__link" data-panel="payment-proofs">
          <span class="admin-sidebar__icon">${ICON.clipboard}</span> Payment Proofs <span class="admin-sidebar__badge admin-sidebar__badge--warning" id="proofs-badge">0</span>
        </button>

        <div class="admin-sidebar__section">System</div>
        <button class="admin-sidebar__link" data-panel="settings">
          <span class="admin-sidebar__icon">${ICON.settings}</span> Settings
        </button>
        <button class="admin-sidebar__link admin-sidebar__link--danger" id="logout-btn">
          <span class="admin-sidebar__icon">${ICON.logout}</span> Sign Out
        </button>
      </nav>
    </aside>

    <!-- Overlay for mobile -->
    <div class="admin-overlay" id="admin-overlay"></div>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="admin-header">
        <div class="admin-header__left">
          <button class="admin-header__menu" id="menu-toggle" aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span class="admin-header__title" id="panel-title">Dashboard</span>
        </div>
        <div class="admin-header__user">
          <span class="admin-header__name">Admin</span>
          <div class="admin-header__avatar">A</div>
        </div>
      </header>

      <div class="admin-panel" id="panel-content">
        <div style="display:flex;justify-content:center;padding:40px;color:var(--gov-gray-500);">
          <div class="admin-spinner"></div>
          Loading dashboard...
        </div>
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="admin-bottom-nav" id="bottom-nav">
      <div class="admin-bottom-nav__grid">
        <button class="admin-bottom-nav__link admin-bottom-nav__link--active" data-panel="dashboard">
          <span class="nav-icon">${ICON.dashboard}</span>
          <span>Home</span>
        </button>
        <button class="admin-bottom-nav__link" data-panel="library-content">
          <span class="nav-icon">${ICON.library}</span>
          <span>Library</span>
        </button>
        <button class="admin-bottom-nav__link" data-panel="sponsored">
          <span class="nav-icon">${ICON.megaphone}</span>
          <span>Tasks</span>
        </button>
        <button class="admin-bottom-nav__link" data-panel="user-adverts">
          <span class="nav-icon">${ICON.megaphone}</span>
          <span>User Ads</span>
        </button>
        <button class="admin-bottom-nav__link" data-panel="vacancies">
          <span class="nav-icon">${ICON.briefcase}</span>
          <span>Vacancies</span>
        </button>
        <button class="admin-bottom-nav__link" data-panel="withdrawals">
          <span class="nav-icon">${ICON.card}</span>
          <span>Payouts</span>
        </button>
        <button class="admin-bottom-nav__link" data-panel="settings">
          <span class="nav-icon">${ICON.settings}</span>
          <span>Settings</span>
        </button>
      </div>
    </nav>

    <div id="admin-toast" class="admin-toast" style="display:none;"></div>
  `;  setupEventListeners();

  // Restore the last visited panel (e.g. Withdrawals) after a full page reload
  // so the admin isn't dumped back on the dashboard after approving payouts.
  let lastPanel = 'dashboard';
  try {
    const saved = localStorage.getItem('wv_admin_last_panel');
    if (saved) lastPanel = saved;
  } catch (e) {}
  window._loadAdminPanel(lastPanel);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('admin-overlay');
  const menuToggle = document.getElementById('menu-toggle');
  const closeSidebar = document.getElementById('sidebar-close');

  window._toggleAdminSidebar = function() {
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('admin-sidebar--open');
    sidebar.classList.toggle('admin-sidebar--open');
    overlay?.classList.toggle('admin-overlay--visible');
    document.body.style.overflow = isOpen ? '' : 'hidden';
  };

  menuToggle?.addEventListener('click', window._toggleAdminSidebar);
  closeSidebar?.addEventListener('click', window._toggleAdminSidebar);
  overlay?.addEventListener('click', window._toggleAdminSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('admin-sidebar--open')) {
      window._toggleAdminSidebar();
    }
  });

  let lastWidth = window.innerWidth;
  window.addEventListener('resize', debounce(() => {
    const currentWidth = window.innerWidth;
    if (currentWidth >= 1024 && lastWidth < 1024) {
      sidebar?.classList.remove('admin-sidebar--open');
      overlay?.classList.remove('admin-overlay--visible');
      document.body.style.overflow = '';
    }
    lastWidth = currentWidth;
  }, 250));

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (confirm('Sign out of the administration panel?')) {
      localStorage.removeItem('wv_admin_token');
      adminToken = null;
      renderLogin();
    }
  });

  const allPanelLinks = document.querySelectorAll('.admin-sidebar__link[data-panel], .admin-bottom-nav__link[data-panel]');
  allPanelLinks.forEach(link => {
    link.addEventListener('click', function() {
      const panel = this.dataset.panel;
      if (!panel) return;

      document.querySelectorAll('.admin-sidebar__link').forEach(el => el.classList.remove('admin-sidebar__link--active'));
      const sidebarLink = document.querySelector(`.admin-sidebar__link[data-panel="${panel}"]`);
      if (sidebarLink) sidebarLink.classList.add('admin-sidebar__link--active');

      document.querySelectorAll('.admin-bottom-nav__link').forEach(el => el.classList.remove('admin-bottom-nav__link--active'));
      const bottomLink = document.querySelector(`.admin-bottom-nav__link[data-panel="${panel}"]`);
      if (bottomLink) bottomLink.classList.add('admin-bottom-nav__link--active');

      window._loadAdminPanel(panel);

      if (window.innerWidth <= 1024 && sidebar?.classList.contains('admin-sidebar--open')) {
        window._toggleAdminSidebar();
      }
    });
  });
}

// ============================================================
// FETCH STATS FOR BADGES
// ============================================================
async function fetchStatsForBadges() {
  try {
    const res = await fetch('/api/admin/stats', { headers: getHeaders() });
    const data = await res.json();
    if (data.success) {
      const stats = data.stats || {};
      const updateBadge = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || 0;
      };
      updateBadge('users-badge', stats.totalUsers);
      updateBadge('withdrawals-badge', stats.pendingWithdrawals);
      updateBadge('proofs-badge', stats.pendingProofs || 0);
    }
  } catch (e) {
    console.log('Failed to fetch stats for badges:', e);
  }
}

// ============================================================
// UPDATE SPONSORED BADGE
// ============================================================
function updateSponsoredBadge() {
  const badge = document.getElementById('sponsored-badge');
  if (!badge) return;
  
  fetch('/api/admin/sponsored', { headers: getHeaders() })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const activeCount = data.items.filter(i => i.is_active).length;
        badge.textContent = activeCount;
      }
    })
    .catch(() => {});
}

// ============================================================
// LOAD PANEL
// ============================================================
window._loadAdminPanel = function(panel) {
  // Remember the active panel so a full page reload (e.g. after approving a
  // withdrawal) lands the admin back on the same panel instead of the dashboard.
  try { localStorage.setItem('wv_admin_last_panel', panel); } catch (e) {}

  const titles = {
    dashboard: 'Dashboard',
    users: 'Users',
    'library-content': 'Library Content',
    'guides-content': 'Guides Content',
    'add-content': 'Add Content',
    packs: 'Premium Packs',
    withdrawals: 'Withdrawals',
    'payment-proofs': 'Payment Proofs',
    sponsored: 'Sponsored Tasks',
    'user-adverts': 'User Business Ads',
    'vacancies': 'Vacancies',
    'earn-watch': 'Create Task',
    settings: 'Settings'
  };

  const titleEl = document.getElementById('panel-title');
  if (titleEl) titleEl.textContent = titles[panel] || panel;

  const container = document.getElementById('panel-content');
  container.innerHTML = `
    <div style="display:flex;justify-content:center;padding:40px;color:var(--gov-gray-500);">
      <div class="admin-spinner"></div>
      Loading ${titles[panel] || panel}...
    </div>
  `;

  switch (panel) {
    case 'dashboard': _loadDashboard(); break;
    case 'users': _loadUsers(); break;
    case 'library-content': _loadLibraryContent(); break;
    case 'guides-content': _loadGuidesContent(); break;
    case 'add-content': _loadAddContent(); break;
    case 'packs': _loadPacks(); break;
    case 'withdrawals': _loadWithdrawals(); break;
    case 'payment-proofs': _loadPaymentProofs(); break;
    case 'sponsored': _loadSponsored(); break;
    case 'user-adverts': _loadUserAdverts(); break;
    case 'vacancies': _loadVacancies(); break;
    case 'earn-watch': _loadEarnWatch(); break;
    case 'settings': _loadSettings(); break;
    default: _loadDashboard();
  }
};

// ============================================================
// DASHBOARD
// ============================================================
async function _loadDashboard() {
  const container = document.getElementById('panel-content');

  try {
    // Fetch both stats and financial overview in parallel
    const [statsRes, finRes] = await Promise.all([
      fetch('/api/admin/stats', { headers: getHeaders() }),
      fetch('/api/admin/financial-overview', { headers: getHeaders() })
    ]);
    const statsData = await statsRes.json();
    const finData = await finRes.json();

    if (!statsData.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load stats.</div>';
      return;
    }

    const stats = statsData.stats || {};
    const fin = finData.success ? (finData.stats || {}) : {};
    const recentUsers = statsData.recentUsers || [];
    const recentWithdrawals = statsData.recentWithdrawals || [];

    const updateBadge = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 0;
    };
    updateBadge('users-badge', stats.totalUsers);
    updateBadge('withdrawals-badge', stats.pendingWithdrawals);

    const totalUsers = stats.totalUsers || 0;
    const pendingWithdrawals = stats.pendingWithdrawals || 0;
    const totalContent = stats.totalContent || 0;

    // Financial data
    const revenue = fin.revenue || {};
    const expenditure = fin.expenditure || {};
    const profit = fin.profit || {};
    const wallets = fin.wallets || {};
    const paychangu = fin.paychangu || {};

    // Profit from verified PayChangu users
    const paychanguProfit = revenue.paychanguProfit || 0;
    const displayRevenue = revenue.displayRevenue || 0;

    const fmt = (n) => 'MWK ' + (n || 0).toLocaleString();

    let usersHTML = '';
    if (recentUsers.length > 0) {
      for (const u of recentUsers.slice(0, 5)) {
        const initial = u.full_name ? u.full_name.charAt(0).toUpperCase() : '?';
        const statusClass = u.payment_status === 'verified' ? 'admin-badge--success' : 'admin-badge--warning';
        const statusLabel = u.payment_status === 'verified' ? 'Verified' : 'Pending';
        usersHTML += `
          <div class="admin-payment">
            <div class="admin-payment__avatar">${initial}</div>
            <div class="admin-payment__info">
              <strong>${u.full_name || 'Anonymous'}</strong>
              <span>${u.email || ''}</span>
            </div>
            <span class="admin-badge ${statusClass}">${statusLabel}</span>
          </div>
        `;
      }
    } else {
      usersHTML = '<div style="text-align:center;padding:20px;color:var(--gov-gray-500);">No recent users</div>';
    }

    let withdrawalsHTML = '';
    if (recentWithdrawals.length > 0) {
      for (const w of recentWithdrawals.slice(0, 5)) {
        const statusClass = w.status === 'pending' ? 'admin-badge--warning' :
          w.status === 'completed' ? 'admin-badge--success' : 'admin-badge--danger';
        const statusLabel = w.status || 'Pending';
        const initial = w.full_name ? w.full_name.charAt(0).toUpperCase() : '?';
        withdrawalsHTML += `
          <div class="admin-payment">
            <div class="admin-payment__avatar">${initial}</div>
            <div class="admin-payment__info">
              <strong>${w.full_name || 'Anonymous'}</strong>
              <span>MWK ${parseFloat(w.amount_requested || 0).toLocaleString()}</span>
            </div>
            <span class="admin-badge ${statusClass}">${statusLabel}</span>
          </div>
        `;
      }
    } else {
      withdrawalsHTML = '<div style="text-align:center;padding:20px;color:var(--gov-gray-500);">No recent withdrawals</div>';
    }

    // PayChangu balance display
    let paychanguHTML = '';
    if (paychangu.mainBalance !== undefined) {
      paychanguHTML = `
        <div class="admin-stats-grid" style="margin-bottom:16px;">
          <div class="admin-stat" style="border-left:4px solid #2E7D32;">
            <div class="admin-stat__header">
              <span class="admin-stat__label">PayChangu Main Balance</span>
              <span class="admin-stat__icon">${ICON.dollar}</span>
            </div>
            <div class="admin-stat__value" style="color:#2E7D32;">${fmt(paychangu.mainBalance)}</div>
            <div class="admin-stat__sub">Available in wallet</div>
          </div>
          <div class="admin-stat" style="border-left:4px solid #1976D2;">
            <div class="admin-stat__header">
              <span class="admin-stat__label">Collection Balance</span>
              <span class="admin-stat__icon">${ICON.dollar}</span>
            </div>
            <div class="admin-stat__value" style="color:#1976D2;">${fmt(paychangu.collectionBalance)}</div>
            <div class="admin-stat__sub">Pending collections</div>
          </div>
        </div>
      `;
    }

    // Verified PayChangu profit display
    let verifiedOverviewHTML = '';
    if (paychanguProfit !== 0 || displayRevenue !== 0) {
      verifiedOverviewHTML = `
        <div class="admin-card" style="margin-top:16px;border:2px solid #2E7D32;border-radius:12px;">
          <div class="admin-card__header" style="background:rgba(46,125,50,0.08);">
            <h3>PayChangu Profit</h3>
          </div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
            <div style="background:rgba(255,152,0,0.05);border:1px solid rgba(255,152,0,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">Profit from Verified PayChangu Users</div>
              <div style="font-size:22px;font-weight:700;color:#FF9800;">${fmt(paychanguProfit)}</div>
            </div>
            <div style="background:rgba(255,87,34,0.05);border:1px solid rgba(255,87,34,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">Displayed Revenue</div>
              <div style="font-size:22px;font-weight:700;color:#FF5722;">${fmt(displayRevenue)}</div>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${paychanguHTML}
      ${verifiedOverviewHTML}

      <div class="admin-stats-grid">
        <div class="admin-stat">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Total Users</span>
            <span class="admin-stat__icon">${ICON.user}</span>
          </div>
          <div class="admin-stat__value">${totalUsers}</div>
          <div class="admin-stat__sub">Registered accounts</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Total Revenue</span>
            <span class="admin-stat__icon">${ICON.dollar}</span>
          </div>
          <div class="admin-stat__value" style="color:#2E7D32;">${fmt(revenue.total)}</div>
          <div class="admin-stat__sub">Registrations + Sales</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Total Expenditure</span>
            <span class="admin-stat__icon" style="color:var(--gov-danger);">${ICON.dollar}</span>
          </div>
          <div class="admin-stat__value" style="color:var(--gov-danger);">${fmt(expenditure.total)}</div>
          <div class="admin-stat__sub">Withdrawals + Referrals</div>
        </div>
        <div class="admin-stat">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Net Profit</span>
            <span class="admin-stat__icon" style="color:${(profit.net || 0) >= 0 ? '#2E7D32' : 'var(--gov-danger)'};">${ICON.dollar}</span>
          </div>
          <div class="admin-stat__value" style="color:${(profit.net || 0) >= 0 ? '#2E7D32' : 'var(--gov-danger)'};">${fmt(profit.net)}</div>
          <div class="admin-stat__sub">Margin: ${profit.margin || 0}%</div>
        </div>
      </div>

      <div class="admin-stats-grid" style="margin-top:16px;">
        <div class="admin-stat" style="border-left:4px solid #FF9800;">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Registration Revenue</span>
            <span class="admin-stat__icon">${ICON.user}</span>
          </div>
          <div class="admin-stat__value">${fmt(revenue.registrations)}</div>
          <div class="admin-stat__sub">${revenue.registrationCount || 0} payments</div>
        </div>
        <div class="admin-stat" style="border-left:4px solid #9C27B0;">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Premium Sales</span>
            <span class="admin-stat__icon">${ICON.box}</span>
          </div>
          <div class="admin-stat__value">${fmt(revenue.premiumSales)}</div>
          <div class="admin-stat__sub">${revenue.premiumCount || 0} sales</div>
        </div>
        <div class="admin-stat" style="border-left:4px solid #F44336;">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Withdrawals Paid</span>
            <span class="admin-stat__icon">${ICON.card}</span>
          </div>
          <div class="admin-stat__value">${fmt(expenditure.withdrawalsPaid)}</div>
          <div class="admin-stat__sub">${expenditure.withdrawalCount || 0} payouts</div>
        </div>
        <div class="admin-stat" style="border-left:4px solid #FF5722;">
          <div class="admin-stat__header">
            <span class="admin-stat__label">Referral Bonuses</span>
            <span class="admin-stat__icon">${ICON.link}</span>
          </div>
          <div class="admin-stat__value">${fmt(expenditure.referralBonusesPaid)}</div>
          <div class="admin-stat__sub">${expenditure.referralCount || 0} paid</div>
        </div>
      </div>

      <div class="admin-card" style="margin-top:16px;">
        <div class="admin-card__header">
          <h3>Financial Summary</h3>
        </div>
        <div style="padding:16px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:rgba(76,175,80,0.05);border:1px solid rgba(76,175,80,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">Today's Revenue</div>
              <div style="font-size:18px;font-weight:700;color:#2E7D32;">${fmt(revenue.today)}</div>
            </div>
            <div style="background:rgba(244,67,54,0.05);border:1px solid rgba(244,67,54,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">Today's Withdrawals</div>
              <div style="font-size:18px;font-weight:700;color:#F44336;">${fmt(expenditure.todayWithdrawn)}</div>
            </div>
            <div style="background:rgba(255,152,0,0.05);border:1px solid rgba(255,152,0,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">Withdrawal Fees Collected</div>
              <div style="font-size:18px;font-weight:700;color:#FF9800;">${fmt(profit.feesCollected)}</div>
            </div>
            <div style="background:rgba(33,150,243,0.05);border:1px solid rgba(33,150,243,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">User Wallet Balances</div>
              <div style="font-size:18px;font-weight:700;color:#1976D2;">${fmt(wallets.totalUserBalances)}</div>
            </div>
            <div style="background:rgba(156,39,176,0.05);border:1px solid rgba(156,39,176,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">This Month Revenue</div>
              <div style="font-size:18px;font-weight:700;color:#9C27B0;">${fmt(revenue.thisMonth)}</div>
            </div>
            <div style="background:rgba(255,87,34,0.05);border:1px solid rgba(255,87,34,0.15);border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:600;color:#5a4a4a;margin-bottom:4px;">This Month Withdrawals</div>
              <div style="font-size:18px;font-weight:700;color:#FF5722;">${fmt(expenditure.thisMonthWithdrawn)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card__header">
          <h3>Recent Users</h3>
          <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="window._loadAdminPanel('users')">View All</button>
        </div>
        <div class="admin-payment-list">${usersHTML}</div>
      </div>

      <div class="admin-card">
        <div class="admin-card__header">
          <h3>Recent Withdrawals</h3>
          <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="window._loadAdminPanel('withdrawals')">View All</button>
        </div>
        <div class="admin-payment-list">${withdrawalsHTML}</div>
      </div>
    `;
  } catch (err) {
    console.error('Dashboard error:', err);
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error. Please refresh.</div>';
  }
}

// ============================================================
// USERS
// ============================================================
async function _loadUsers(search = '') {
  const container = document.getElementById('panel-content');

  try {
    const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load users.</div>';
      return;
    }

    const users = data.users || [];
    _usersCache = users;

    let rows = '';
    if (users.length === 0) {
      rows = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gov-gray-500);">No users found.</td></tr>';
    } else {
      for (const u of users) {
        const statusBadge = u.payment_status === 'verified' ?
          '<span class="admin-badge admin-badge--success">Verified</span>' :
          '<span class="admin-badge admin-badge--warning">Pending</span>';

        // Consent timestamp recorded at registration (null if the user
        // registered before consent tracking was added or never agreed).
        let consentCell = '<span style="color:var(--gov-gray-400);">—</span>';
        if (u.consent_given_at) {
          try {
            consentCell = new Date(u.consent_given_at).toLocaleString(undefined, {
              dateStyle: 'short',
              timeStyle: 'short'
            });
          } catch (e) {
            consentCell = String(u.consent_given_at);
          }
        }

        const actionBtns = `
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="admin-badge admin-badge--info" style="font-size:11px;">Auto-verified via PayChangu</span>
            <button class="admin-btn admin-btn--warning admin-btn--sm" onclick="window._showResetPassword('${u.id}')">
              ${ICON.key} Reset
            </button>
          </div>
        `;

        rows += `
          <tr>
            <td data-label="Name"><div class="admin-table-cell"><div class="admin-table-avatar">${u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}</div><strong>${u.full_name || '—'}</strong></div></td>
            <td data-label="Email">${u.email || '—'}</td>
            <td data-label="Phone">${u.phone || '—'}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Consent">${consentCell}</td>
            <td data-label="Action">${actionBtns}</td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>User Directory</h2>
        <div class="admin-page-actions">
          <span class="admin-page-count">${users.length} users</span>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <input class="admin-search-input" placeholder="Search users..." oninput="window._filterUsers(this.value)" style="width:100%;max-width:400px;" />
      </div>
      <div class="admin-card">
        <div class="admin-table-wrapper">
          <table class="admin-table" id="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Consent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error. Please refresh.</div>';
  }
}

let _userSearchTimeout = null;
window._filterUsers = function(query) {
  // Debounce server-side search
  clearTimeout(_userSearchTimeout);
  _userSearchTimeout = setTimeout(() => {
    _loadUsers(query.trim());
  }, 300);
};

window._verifyUser = async function(userId, status) {
  const action = status === 'verified' ? 'approve' : 'revoke';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    const res = await fetch('/api/admin/verify-user', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ userId, paymentStatus: status })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(`User ${action}d successfully!`, 'success');
      window._loadAdminPanel('users');
    } else {
      showAdminToast(data.message || 'Failed to update user.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error. Please try again.', 'error');
  }
};

window._showResetPassword = function(userId) {
  const existing = document.getElementById('reset-password-modal');
  if (existing) existing.remove();

  // Look the user up from the loaded list (never interpolate names into JS)
  const found = _usersCache.find((u) => String(u.id) === String(userId));
  const rawUserName = (found && found.full_name) || 'User';
  const userName = escHtml(rawUserName);

  const modal = document.createElement('div');
  modal.id = 'reset-password-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:32px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.15);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="font-size:32px;margin-bottom:8px;"></div>
          <h3 style="font-size:18px;font-weight:700;color:var(--gov-gray-900);">Reset Password</h3>
          <p style="font-size:14px;color:var(--gov-gray-500);margin-top:4px;">
            Reset password for <strong>${userName}</strong>
          </p>
        </div>
        <button onclick="this.closest('#reset-password-modal').remove()" 
          style="background:var(--gov-gray-100);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form id="reset-password-form">
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;color:var(--gov-gray-700);margin-bottom:6px;">
            New Password <span style="color:var(--gov-danger);">*</span>
          </label>
          <input 
            type="password" 
            id="rp-new-password" 
            placeholder="Enter new password (min 6 characters)" 
            required
            style="width:100%;padding:10px 14px;border:1px solid var(--gov-gray-300);border-radius:8px;font-size:14px;"
          />
          <div style="font-size:11px;color:var(--gov-gray-500);margin-top:4px;">
            Password must be at least 6 characters
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:13px;font-weight:600;color:var(--gov-gray-700);margin-bottom:6px;">
            Confirm Password <span style="color:var(--gov-danger);">*</span>
          </label>
          <input 
            type="password" 
            id="rp-confirm-password" 
            placeholder="Confirm new password" 
            required
            style="width:100%;padding:10px 14px;border:1px solid var(--gov-gray-300);border-radius:8px;font-size:14px;"
          />
        </div>

        <div style="display:flex;gap:10px;">
          <button type="button" onclick="this.closest('#reset-password-modal').remove()" 
            style="flex:1;padding:12px;background:var(--gov-gray-100);color:var(--gov-gray-700);border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
            Cancel
          </button>
          <button type="submit" 
            style="flex:2;padding:12px;background:var(--gov-warning);color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;"
            onmouseover="this.style.background='#D97706'"
            onmouseout="this.style.background='var(--gov-warning)'">
            ${ICON.key} Reset Password
          </button>
        </div>

        <div id="rp-msg" class="admin-msg" style="margin-top:12px;"></div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('reset-password-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('rp-new-password').value;
    const confirmPassword = document.getElementById('rp-confirm-password').value;
    const msg = document.getElementById('rp-msg');

    if (newPassword.length < 6) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Password must be at least 6 characters';
      return;
    }

    if (newPassword !== confirmPassword) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Passwords do not match';
      return;
    }

    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ 
          userId, 
          newPassword,
          sendEmail: false // Explicitly set to false
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { success: false, message: 'The server returned an invalid response (' + res.status + '). Please try again.' };
      }

      if (data.success) {
        msg.className = 'admin-msg admin-msg--success';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Password reset successfully!';
        showAdminToast('Password reset for ' + rawUserName, 'success');
        setTimeout(() => modal.remove(), 1500);
      } else {
        msg.className = 'admin-msg admin-msg--error';
        const errMsg = data.message || 'Failed to reset password';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> ' + escHtml(errMsg);
        showAdminToast(errMsg, 'error');
      }
    } catch (err) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error. Please try again.';
      showAdminToast('Network error', 'error');
      console.error('[Password Reset] Network error:', err);
    }
  });
};

// ============================================================
// LIBRARY CONTENT
// ============================================================
async function _loadLibraryContent() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/content?type=library', { headers: getHeaders() });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load library content.</div>';
      return;
    }

    const items = data.items?.filter((i) => i.content_type !== 'guide') || [];

    let rows = '';
    if (items.length === 0) {
      rows = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gov-gray-500);">No library content available. Create some!</td></tr>';
    } else {
      for (const i of items) {
        const statusBadge = i.is_published ?
          '<span class="admin-badge admin-badge--success">Published</span>' :
          '<span class="admin-badge admin-badge--warning">Draft</span>';
        
        const linkTypeBadge = i.link_type === 'youtube' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> YouTube' :
                              i.link_type === 'vimeo' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Vimeo' :
                              i.link_type === 'pdf' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF' :
                              i.link_type === 'audio' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link';

        rows += `
          <tr>
            <td data-label="Title"><strong>${i.title || '—'}</strong></td>
            <td data-label="Type"><span class="admin-badge admin-badge--info">${i.content_type || '—'}</span></td>
            <td data-label="Link Type"><span style="font-size:12px;">${linkTypeBadge}</span></td>
            <td data-label="Author">${i.author || '—'}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Action">
              <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="window._editContent('${i.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" style="color:var(--gov-danger);" onclick="window._deleteContent('${i.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h2>Library Content</h2>
          <span style="font-size:13px;color:var(--gov-gray-500);">Books, teachings, and wisdom content</span>
        </div>
        <div class="admin-page-actions">
          <span class="admin-page-count">${items.length} items</span>
          <button class="admin-btn admin-btn--solid" onclick="window._loadAdminPanel('add-content')">+ Add New</button>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Link Type</th>
                <th>Author</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error. Please refresh.</div>';
  }
}

// ============================================================
// GUIDES CONTENT
// ============================================================
async function _loadGuidesContent() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/content?type=guide', { headers: getHeaders() });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load guides.</div>';
      return;
    }

    const items = data.items?.filter((i) => i.content_type === 'guide') || [];

    let rows = '';
    if (items.length === 0) {
      rows = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gov-gray-500);">No guides available. Create some!</td></tr>';
    } else {
      for (const i of items) {
        const statusBadge = i.is_published ?
          '<span class="admin-badge admin-badge--success">Published</span>' :
          '<span class="admin-badge admin-badge--warning">Draft</span>';

        rows += `
          <tr>
            <td data-label="Title"><strong>${i.title || '—'}</strong></td>
            <td data-label="Category">${i.category_name || '—'}</td>
            <td data-label="Author">${i.author || '—'}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Action">
              <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="window._editContent('${i.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" style="color:var(--gov-danger);" onclick="window._deleteContent('${i.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h2>How-To Guides</h2>
          <span style="font-size:13px;color:var(--gov-gray-500);">Step-by-step tutorial content</span>
        </div>
        <div class="admin-page-actions">
          <span class="admin-page-count">${items.length} guides</span>
          <button class="admin-btn admin-btn--solid" onclick="window._loadAdminPanel('add-content')">+ Add Guide</button>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error.</div>';
  }
}

// ============================================================
// ADD CONTENT - FULLY FIXED
// ============================================================
async function _loadAddContent() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/categories', { headers: getHeaders() });
    const data = await res.json();
    const categories = data.categories || [];

    let catOptions = categories.map((c) => 
      `<option value="${c.id}">${c.name}</option>`
    ).join('');

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>Add New Content</h2>
        <span style="font-size:13px;color:var(--gov-gray-500);">Upload links to your content — videos, PDFs, audio, or articles</span>
      </div>
      
      <div class="admin-card">
        <form class="admin-form" id="add-content-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="admin-form__group">
              <label class="admin-form__label">Title <span style="color:var(--gov-danger);">*</span></label>
              <input type="text" id="ct-title" class="admin-form__input" required placeholder="Enter title..." />
            </div>
            <div class="admin-form__group">
              <label class="admin-form__label">Content Type <span style="color:var(--gov-danger);">*</span></label>
              <select id="ct-type" class="admin-form__select">
                <option value="book"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Book</option>
                <option value="teaching"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Teaching</option>
                <option value="guide"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Guide</option>
                <option value="counsel"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Wise Counsel</option>
                <option value="article"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Article</option>
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="admin-form__group" style="display:flex;align-items:center;padding-top:20px;">
              <label class="admin-form__label" style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:0;">
                <input type="checkbox" id="ct-premium" style="width:18px;height:18px;accent-color:var(--gov-blue);" />
                <span>⭐ Premium Content</span>
              </label>
              <div style="font-size:11px;color:var(--gov-gray-500);margin-left:8px;">(Users must pay to access)</div>
            </div>
          </div>

          <div id="premium-price-group" style="display:none;margin-top:8px;">
            <div class="admin-form__group">
              <label class="admin-form__label">Premium Price (MWK) <span style="color:var(--gov-danger);">*</span></label>
              <input type="number" id="ct-price" class="admin-form__input" placeholder="e.g., 25000" min="1000" step="100" />
              <div style="font-size:11px;color:var(--gov-gray-500);margin-top:4px;">Users must pay this amount to access the content</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="admin-form__group">
              <label class="admin-form__label">Category <span style="color:var(--gov-danger);">*</span></label>
              <select id="ct-category" class="admin-form__select">${catOptions}</select>
            </div>
            <div class="admin-form__group">
              <label class="admin-form__label">Author</label>
              <input type="text" id="ct-author" class="admin-form__input" placeholder="Wisdom Vault" />
            </div>
          </div>

          <div class="admin-form__group">
            <label class="admin-form__label">Content Source Type <span style="color:var(--gov-danger);">*</span></label>
            <select id="ct-link-type" class="admin-form__select">
              <option value="youtube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> YouTube Video</option>
              <option value="vimeo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Vimeo Video</option>
              <option value="pdf"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF Document</option>
              <option value="audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio (SoundCloud/MP3)</option>
              <option value="article"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Article/Blog Post</option>
              <option value="url">→ External Link</option>
            </select>
          </div>

          <div class="admin-form__group">
            <label class="admin-form__label">Content URL <span style="color:var(--gov-danger);">*</span></label>
            <input type="url" id="ct-url" class="admin-form__input" required placeholder="https://youtube.com/watch?v=... or https://example.com/document.pdf" />
          </div>

          <div class="admin-form__group">
            <label class="admin-form__label">Thumbnail/Image URL</label>
            <input type="url" id="ct-thumbnail" class="admin-form__input" placeholder="https://example.com/image.jpg" />
          </div>

          <div class="admin-form__group">
            <label class="admin-form__label">Description</label>
            <textarea id="ct-desc" class="admin-form__textarea" placeholder="Detailed description of this content..." rows="4"></textarea>
          </div>

          <div id="guide-fields" style="display:none;border:1px solid var(--gov-border);border-radius:12px;padding:16px;margin-bottom:16px;background:var(--gov-bg-light);">
            <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Guide Steps & Tips</h4>
            <div class="admin-form__group">
              <label class="admin-form__label">Steps (one per line)</label>
              <textarea id="ct-steps" class="admin-form__textarea" placeholder="Step 1: Do this&#10;Step 2: Do that&#10;Step 3: Profit!" rows="4"></textarea>
            </div>
            <div class="admin-form__group">
              <label class="admin-form__label">Tips (one per line)</label>
              <textarea id="ct-tips" class="admin-form__textarea" placeholder="Tip 1: Remember this&#10;Tip 2: Pro tip here" rows="3"></textarea>
            </div>
          </div>

          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button type="submit" class="admin-btn admin-btn--solid"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg> Publish Content</button>
            <button type="button" class="admin-btn admin-btn--ghost" onclick="document.getElementById('add-content-form').reset();">Clear Form</button>
          </div>
          
          <div id="content-msg" class="admin-msg"></div>
        </form>
      </div>
    `;

    // Toggle price field visibility
    document.getElementById('ct-premium').addEventListener('change', function() {
      const priceGroup = document.getElementById('premium-price-group');
      if (this.checked) {
        priceGroup.style.display = 'block';
        document.getElementById('ct-price').required = true;
      } else {
        priceGroup.style.display = 'none';
        document.getElementById('ct-price').required = false;
        document.getElementById('ct-price').value = '';
      }
    });

    // Toggle guide fields
    document.getElementById('ct-type').addEventListener('change', function() {
      const guideFields = document.getElementById('guide-fields');
      guideFields.style.display = this.value === 'guide' ? 'block' : 'none';
    });

    // Form submit
    document.getElementById('add-content-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const title = document.getElementById('ct-title').value.trim();
      const category_id = document.getElementById('ct-category').value;
      const content_type = document.getElementById('ct-type').value;
      const author = document.getElementById('ct-author').value.trim();
      const description = document.getElementById('ct-desc').value.trim();
      const linkType = document.getElementById('ct-link-type').value;
      const fileUrl = document.getElementById('ct-url').value.trim();
      const thumbnailUrl = document.getElementById('ct-thumbnail').value.trim();
      const isPremium = document.getElementById('ct-premium')?.checked || false;
      const price = document.getElementById('ct-price')?.value || 0;
      const steps = document.getElementById('ct-steps').value.trim();
      const tips = document.getElementById('ct-tips').value.trim();
      const msg = document.getElementById('content-msg');

      if (!title || !category_id || !fileUrl) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Title, category, and URL are required.';
        return;
      }

      try {
        const body = { 
          title, 
          category_id, 
          content_type, 
          author: author || 'Wisdom Vault', 
          description,
          file_url: fileUrl,
          thumbnail_url: thumbnailUrl,
          link_type: linkType,
          is_premium: isPremium,
          price: isPremium ? parseFloat(price) || 0 : 0
        };

        if (content_type === 'guide') {
          const stepsArray = steps ? steps.split('\n').filter(s => s.trim()) : [];
          const tipsArray = tips ? tips.split('\n').filter(s => s.trim()) : [];
          body.steps = JSON.stringify(stepsArray);
          body.tips = JSON.stringify(tipsArray);
        }

        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
          msg.className = 'admin-msg admin-msg--success';
          msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Content published successfully!';
          showAdminToast('Content published successfully!', 'success');
          
          document.getElementById('ct-title').value = '';
          document.getElementById('ct-desc').value = '';
          document.getElementById('ct-url').value = '';
          document.getElementById('ct-thumbnail').value = '';
          document.getElementById('ct-steps').value = '';
          document.getElementById('ct-tips').value = '';
          document.getElementById('ct-premium').checked = false;
          document.getElementById('premium-price-group').style.display = 'none';
          
          setTimeout(() => {
            if (content_type === 'guide') {
              window._loadAdminPanel('guides-content');
            } else {
              window._loadAdminPanel('library-content');
            }
          }, 1500);
        } else {
          msg.className = 'admin-msg admin-msg--error';
          msg.innerHTML = data.message || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Failed to publish content.';
          showAdminToast(msg.textContent, 'error');
        }
      } catch (err) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error. Please try again.';
        showAdminToast('Network error. Please try again.', 'error');
        console.error('Error:', err);
      }
    });
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Error loading form.</div>';
  }
}

// ============================================================
// PREMIUM PACKS - FULLY FIXED WITH ADD ITEM
// ============================================================
// Module ids per pack, in the order last rendered. The move up/down buttons send
// this whole array back to the API, which assigns each module an absolute
// position — so a reorder can never half-apply.
const _packItemOrder = {};

async function _loadPacks() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/packs', { headers: getHeaders() });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load packs.</div>';
      return;
    }

    const packs = data.packs || [];

    let html = `
      <div class="admin-page-header">
        <h2>Premium Packs</h2>
        <div class="admin-page-actions">
          <span class="admin-page-count">${packs.length} packs</span>
          <button class="admin-btn admin-btn--solid" onclick="window._showCreatePackForm()">+ Create Pack</button>
        </div>
      </div>
      <div id="create-pack-form" style="display:none;margin-bottom:20px;"></div>
    `;

    if (packs.length === 0) {
      html += `
        <div class="admin-card">
          <div style="text-align:center;padding:40px;color:var(--gov-gray-500);">
            <div style="font-size:48px;margin-bottom:16px;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
            <h3 style="font-weight:600;">No packs created yet</h3>
            <p>Create your first premium pack.</p>
          </div>
        </div>
      `;
    } else {
      for (const pack of packs) {
        const items = pack.items || [];
        const safeName = pack.name.replace(/'/g, "\\'");
        _packItemOrder[pack.id] = items.map((it) => it.id);

        let itemsHtml = '';
        if (items.length === 0) {
          itemsHtml = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--gov-gray-500);">No items.</td></tr>';
        } else {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const linkTypeBadge = item.link_type === 'youtube' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> YouTube' :
                                  item.link_type === 'vimeo' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Vimeo' :
                                  item.link_type === 'pdf' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF' :
                                  item.link_type === 'audio' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link';
            itemsHtml += `
              <tr>
                <td data-label="#" style="color:var(--gov-gray-500);width:40px;">${i + 1}</td>
                <td data-label="Title"><strong>${item.title || '—'}</strong></td>
                <td data-label="Type"><span class="admin-badge admin-badge--info">${item.content_type || '—'}</span></td>
                <td data-label="Link Type"><span style="font-size:11px;">${linkTypeBadge}</span></td>
                <td data-label="Action" style="white-space:nowrap;">
                  <button class="admin-btn admin-btn--ghost admin-btn--sm" title="Move up" aria-label="Move up" ${i === 0 ? 'disabled' : ''} style="padding:4px 7px;${i === 0 ? 'opacity:.35;' : ''}" onclick="window._movePackItem('${pack.id}', ${i}, -1)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg></button>
                  <button class="admin-btn admin-btn--ghost admin-btn--sm" title="Move down" aria-label="Move down" ${i === items.length - 1 ? 'disabled' : ''} style="padding:4px 7px;${i === items.length - 1 ? 'opacity:.35;' : ''}" onclick="window._movePackItem('${pack.id}', ${i}, 1)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>
                  <button class="admin-btn admin-btn--ghost admin-btn--sm" style="color:var(--gov-danger);" onclick="window._deletePackItem('${item.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </td>
              </tr>
            `;
          }
        }

        html += `
          <div class="admin-card" style="margin-bottom:20px;">
            <div class="admin-card__header" style="flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-size:16px;font-weight:600;">${pack.name}</span>
                <span style="font-size:13px;color:var(--gov-gray-500);margin-left:10px;">${items.length} items</span>
                <span style="font-size:13px;color:var(--gov-blue);margin-left:10px;">MWK ${pack.price || 0}</span>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="admin-btn admin-btn--solid admin-btn--sm" onclick="window._showAddItemForm('${pack.id}', '${safeName}')">+ Add Item</button>
                <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="window._deletePack('${pack.id}')" style="color:var(--gov-danger);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
            </div>
            <div class="admin-table-wrapper">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th style="width:40px;">#</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Link Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error.</div>';
  }
}

window._deletePack = async function(packId) {
  if (!confirm('Delete this pack and all its items?')) return;
  try {
    const res = await fetch('/api/admin/packs', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ packId })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Pack deleted successfully', 'success');
      window._loadAdminPanel('packs');
    } else {
      showAdminToast(data.message || 'Failed to delete pack', 'error');
    }
  } catch (err) {
    showAdminToast('Network error', 'error');
  }
};

window._deletePackItem = async function(itemId) {
  if (!confirm('Delete this pack item?')) return;
  try {
    const res = await fetch('/api/admin/packs/items', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ itemId })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Item deleted successfully', 'success');
      window._loadAdminPanel('packs');
    } else {
      showAdminToast(data.message || 'Failed to delete item', 'error');
    }
  } catch (err) {
    showAdminToast('Network error', 'error');
  }
};

// Move a module one place up (-1) or down (+1). The swap happens locally on the
// rendered order, then the complete new order is sent to the API.
window._movePackItem = async function(packId, index, direction) {
  const current = _packItemOrder[packId];
  if (!current) return;

  const target = index + direction;
  if (target < 0 || target >= current.length) return;

  const order = current.slice();
  [order[index], order[target]] = [order[target], order[index]];

  try {
    const res = await fetch('/api/admin/packs/items', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ packId, itemIds: order })
    });
    const data = await res.json();
    if (data.success) {
      _packItemOrder[packId] = order;
      window._loadAdminPanel('packs');
    } else {
      showAdminToast(data.message || 'Could not save the new order', 'error');
    }
  } catch (err) {
    showAdminToast('Network error', 'error');
  }
};

window._showCreatePackForm = function() {
  const formDiv = document.getElementById('create-pack-form');
  if (formDiv.style.display === 'block') {
    formDiv.style.display = 'none';
    return;
  }

  formDiv.style.display = 'block';
  formDiv.innerHTML = `
    <div class="admin-card" style="border-left:4px solid var(--gov-blue);">
      <div class="admin-card__header">
        <span style="font-weight:600;">Create New Course</span>
        <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="document.getElementById('create-pack-form').style.display='none'">Cancel</button>
      </div>
      <form class="admin-form" id="create-pack-form-inner">
        <div class="admin-form__group">
          <label class="admin-form__label">Course Name <span style="color:var(--gov-danger);">*</span></label>
          <input type="text" id="cp-name" class="admin-form__input" required placeholder="e.g., Cybersecurity Mastery" />
        </div>
        
        <div class="admin-form__group">
          <label class="admin-form__label">Category</label>
          <select id="cp-category" class="admin-form__select">
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Life">Life & Personal Development</option>
            <option value="Relationships">Relationships</option>
            <option value="Wealth">Wealth & Finance</option>
            <option value="Health">Health & Wellness</option>
            <option value="Leadership">Leadership</option>
            <option value="General">General</option>
          </select>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="admin-form__group">
            <label class="admin-form__label">Price (MWK)</label>
            <input type="number" id="cp-price" class="admin-form__input" placeholder="25000" value="0" />
          </div>
          <div class="admin-form__group" style="display:flex;align-items:center;gap:12px;padding-top:20px;">
            <label class="admin-form__label" style="margin-bottom:0;display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="cp-free" style="width:18px;height:18px;accent-color:var(--gov-blue);" />
              Free Course
            </label>
          </div>
        </div>
        
        <div class="admin-form__group">
          <label class="admin-form__label">Thumbnail URL</label>
          <input type="url" id="cp-thumbnail" class="admin-form__input" placeholder="https://example.com/course-thumbnail.jpg" />
        </div>
        
        <div class="admin-form__group">
          <label class="admin-form__label">Short Description</label>
          <textarea id="cp-desc" class="admin-form__textarea" placeholder="Brief description..." rows="2"></textarea>
        </div>
        
        <div class="admin-form__group">
          <label class="admin-form__label">Detailed Description</label>
          <textarea id="cp-long-desc" class="admin-form__textarea" placeholder="Full course description..." rows="4"></textarea>
        </div>
        
        <button type="submit" class="admin-btn admin-btn--solid">Create Course</button>
        <div id="cp-msg" class="admin-msg"></div>
      </form>
    </div>
  `;

  document.getElementById('cp-free').addEventListener('change', function() {
    const priceInput = document.getElementById('cp-price');
    if (this.checked) {
      priceInput.value = '0';
      priceInput.disabled = true;
      priceInput.style.background = 'var(--gov-gray-100)';
    } else {
      priceInput.disabled = false;
      priceInput.style.background = 'white';
      priceInput.value = '';
    }
  });

  document.getElementById('create-pack-form-inner').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('cp-name').value.trim();
    const category = document.getElementById('cp-category').value;
    const price = document.getElementById('cp-price').value;
    const isFree = document.getElementById('cp-free').checked;
    const description = document.getElementById('cp-desc').value.trim();
    const longDescription = document.getElementById('cp-long-desc').value.trim();
    const thumbnailUrl = document.getElementById('cp-thumbnail').value.trim();
    const msg = document.getElementById('cp-msg');

    if (!name) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Course name is required.';
      return;
    }

    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          name, 
          category,
          price: isFree ? 0 : parseFloat(price) || 0,
          is_free: isFree,
          description,
          long_description: longDescription || description,
          thumbnail_url: thumbnailUrl
        })
      });
      const data = await res.json();

      if (data.success) {
        msg.className = 'admin-msg admin-msg--success';
        msg.innerHTML = isFree ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Free course created successfully!' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Course created successfully!';
        showAdminToast(msg.textContent, 'success');
        setTimeout(() => window._loadAdminPanel('packs'), 1000);
      } else {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = data.message || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Failed to create course.';
      }
    } catch (err) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error.';
    }
  });
};

// ============================================================
// ADD ITEM TO PACK - FULLY FIXED
// ============================================================
window._showAddItemForm = function(packId, packName) {
  const container = document.getElementById('panel-content');
  
  // Remove existing form if any
  const existingForm = document.getElementById('add-item-form');
  if (existingForm) existingForm.remove();

  // ✓ SAFE: Escape apostrophes and special characters
  const safePackName = packName
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/'/g, "\\'")     // Escape single quotes
    .replace(/"/g, '&quot;')  // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r');   // Escape carriage returns

  const formDiv = document.createElement('div');
  formDiv.id = 'add-item-form';
  formDiv.style.marginBottom = '20px';
  
  // ✓ Use safePackName in the HTML
  formDiv.innerHTML = `
    <div class="admin-card" style="border-left:4px solid var(--gov-blue);">
      <div class="admin-card__header">
        <span style="font-weight:600;">Add Item to: ${safePackName}</span>
        <button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="document.getElementById('add-item-form').remove()">Cancel</button>
      </div>
      <form class="admin-form" id="pack-item-form">
        <div class="admin-form__group">
          <label class="admin-form__label">Item Title <span style="color:var(--gov-danger);">*</span></label>
          <input type="text" id="pi-title" class="admin-form__input" required placeholder="Enter item title..." />
        </div>
        <div class="admin-form__group">
          <label class="admin-form__label">Content Type <span style="color:var(--gov-danger);">*</span></label>
          <select id="pi-type" class="admin-form__select">
            <option value="pdf"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF</option>
            <option value="video"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Video</option>
            <option value="audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio</option>
            <option value="course"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Course</option>
            <option value="tool"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Tool</option>
            <option value="ebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> E-Book</option>
            <option value="guide"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Guide</option>
          </select>
        </div>
        <div class="admin-form__group">
          <label class="admin-form__label">Link Type <span style="color:var(--gov-danger);">*</span></label>
          <select id="pi-link-type" class="admin-form__select">
            <option value="youtube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> YouTube Video</option>
            <option value="vimeo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Vimeo Video</option>
            <option value="pdf"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF Document</option>
            <option value="audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio</option>
            <option value="url">→ External Link</option>
          </select>
        </div>
        <div class="admin-form__group">
          <label class="admin-form__label">Content URL <span style="color:var(--gov-danger);">*</span></label>
          <input type="url" id="pi-url" class="admin-form__input" required placeholder="https://example.com/content" />
        </div>
        <button type="submit" class="admin-btn admin-btn--solid"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Item</button>
        <div id="pack-item-msg" class="admin-msg"></div>
      </form>
    </div>
  `;

  // Insert after the page header
  const pageHeader = container.querySelector('.admin-page-header');
  if (pageHeader) {
    pageHeader.after(formDiv);
  } else {
    container.prepend(formDiv);
  }

  // Scroll to form
  formDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

  document.getElementById('pack-item-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('pi-title').value.trim();
    const content_type = document.getElementById('pi-type').value;
    const link_type = document.getElementById('pi-link-type').value;
    const file_url = document.getElementById('pi-url').value.trim();
    const msg = document.getElementById('pack-item-msg');

    if (!title || !file_url) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Title and URL are required.';
      return;
    }

    try {
      const res = await fetch('/api/admin/packs/items', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          pack_id: packId, 
          title, 
          content_type,
          link_type,
          file_url
        })
      });
      const data = await res.json();

      if (data.success) {
        msg.className = 'admin-msg admin-msg--success';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Item added successfully!';
        showAdminToast('Item added!', 'success');
        setTimeout(() => window._loadAdminPanel('packs'), 1000);
      } else {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = data.message || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Failed to add item.';
        showAdminToast(msg.textContent, 'error');
      }
    } catch (err) {
      msg.className = 'admin-msg admin-msg--error';
      msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error. Please try again.';
      showAdminToast('Network error', 'error');
    }
  });
};

// ============================================================
// SPONSORED CONTENT
// ============================================================
async function _loadSponsored() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/sponsored', { headers: getHeaders() });
    const data = await res.json();
    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load tasks.</div>';
      return;
    }
    const items = data.items || [];
    const sponsoredBadge = document.getElementById('sponsored-badge');
    if (sponsoredBadge) {
      const activeCount = items.filter((i) => i.is_active).length;
      sponsoredBadge.textContent = activeCount;
    }

    let rows = '';
    if (items.length === 0) {
      rows = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--gov-gray-500);">No sponsored tasks. Create one!</td></tr>';
    } else {
      for (const i of items) {
        const statusBadge = i.is_active ?
          '<span class="admin-badge admin-badge--success">Active</span>' :
          '<span class="admin-badge admin-badge--warning">Inactive</span>';
        const typeIcon = i.content_type === 'video' ? ICON.video : i.content_type === 'audio' ? ICON.music : ICON.file;
        const platformBadge = i.video_platform === 'youtube' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> YouTube' :
                              i.video_platform === 'vimeo' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Vimeo' :
                              i.video_platform === 'audio' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Link';
        
        rows += `
          <tr>
            <td data-label="Title"><strong>${i.title || '—'}</strong></td>
            <td data-label="Type">${typeIcon} ${i.content_type || '—'}</td>
            <td data-label="Platform"><span style="font-size:11px;">${platformBadge}</span></td>
            <td data-label="Reward" style="font-weight:600;color:var(--gov-blue);">MWK ${parseFloat(i.reward_amount || 0).toLocaleString()}</td>
            <td data-label="Duration">${i.duration_seconds || 90}s</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Action">
              <button class="admin-btn admin-btn--sm ${i.is_active ? 'admin-btn--ghost' : 'admin-btn--solid'}" onclick="window._toggleSponsored('${i.id}', ${!i.is_active})">
                ${i.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" style="color:var(--gov-danger);" onclick="window._deleteSponsored('${i.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>Sponsored Tasks</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span style="font-size:13px;color:var(--gov-gray-500);">${items.length} tasks</span>
          <button class="admin-btn admin-btn--solid" onclick="window._loadAdminPanel('earn-watch')">+ Create Task</button>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Platform</th>
                <th>Reward</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error.</div>';
  }
}

// ============================================================
// USER BUSINESS ADS — moderation (approve / reject with reason)
// ============================================================
window._loadUserAdverts = async function() {
  const container = document.getElementById('panel-content');
  try {
    const res = await fetch('/api/admin/adverts?status=all', { headers: getHeaders() });
    const data = await res.json();
    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load user ads.</div>';
      return;
    }

    const adverts = data.adverts || [];
    const counts = data.counts || {};
    const pendingBadge = document.getElementById('user-adverts-badge');
    if (pendingBadge) pendingBadge.textContent = counts.pending || 0;

    if (adverts.length === 0) {
      container.innerHTML = `
        <div class="admin-page-header"><h2>User Business Ads</h2></div>
        <div class="admin-card" style="padding:40px;text-align:center;color:var(--gov-gray-500);">
          No user adverts yet. When users submit business ads from the More panel, they appear here for review.
        </div>`;
      return;
    }

    const statusBadge = (s) =>
      s === 'approved' ? '<span class="admin-badge admin-badge--success">Approved</span>' :
      s === 'rejected' ? '<span class="admin-badge admin-badge--danger">Rejected</span>' :
      '<span class="admin-badge admin-badge--warning">Pending</span>';

    const cards = adverts.map((a) => {
      const imgs = a.images || [];
      return `
      <div class="admin-card" style="margin-bottom:16px;">
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${imgs.length > 0 ? imgs.map(u => `<img src="${u}" style="width:86px;height:86px;object-fit:cover;border-radius:10px;border:1px solid var(--gov-border);cursor:pointer;" onclick="window._viewAdvertImage('${u}')">`).join('')
              : '<div style="width:86px;height:86px;border-radius:10px;border:1px dashed var(--gov-border);display:flex;align-items:center;justify-content:center;color:var(--gov-gray-500);font-size:11px;">No images</div>'}
          </div>
          <div style="flex:1;min-width:240px;">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              ${statusBadge(a.status)}
              ${a.isOfficial ? '<span class="admin-badge" style="background:var(--gov-blue);color:#fff;">OFFICIAL</span>' : ''}
              ${a.sold ? '<span class="admin-badge" style="background:#F59E0B;color:#fff;">SOLD</span>' : ''}
              <span style="font-size:11px;color:var(--gov-gray-500);">${a.template}</span>
              <span style="font-size:11px;color:var(--gov-gray-500);">• ${new Date(a.createdAt).toLocaleString()}</span>
            </div>
            <h3 style="margin:8px 0 2px;font-size:16px;">${a.headline}</h3>
            <div style="font-size:13px;color:var(--gov-blue);font-weight:600;">${a.businessName}</div>
            ${a.description ? `<p style="font-size:13px;color:var(--gov-gray-500);margin:8px 0;line-height:1.5;">${a.description}</p>` : ''}
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:6px;">
              ${a.location ? '📍 ' + a.location : ''}
              ${a.contactPhone ? ' • 📞 ' + a.contactPhone : ''}
              ${a.whatsapp ? ' • 💬 ' + a.whatsapp : ''}
            </div>
            <div style="font-size:11px;color:var(--gov-gray-500);margin-top:6px;">
              By: <strong>${a.userName}</strong> (${a.userEmail || a.userPhone || 'no contact'})
              ${a.viewCount ? ' • ' + a.viewCount + ' views' : ''}
            </div>
            ${a.status === 'rejected' && a.rejectionReason ? `<div style="font-size:12px;color:var(--gov-danger);margin-top:6px;">Reason: ${a.rejectionReason}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;">
            ${a.status !== 'approved' ? `<button class="admin-btn admin-btn--sm admin-btn--solid" onclick="window._moderateAdvert('${a.id}','approve')">Approve</button>` : ''}
            ${a.status !== 'rejected' ? `<button class="admin-btn admin-btn--sm admin-btn--ghost" style="color:var(--gov-danger);" onclick="window._moderateAdvert('${a.id}','reject')">Reject</button>` : ''}
            <button class="admin-btn admin-btn--sm admin-btn--ghost" style="color:var(--gov-danger);" onclick="window._deleteAdvert('${a.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>User Business Ads</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span class="admin-badge admin-badge--warning">${counts.pending || 0} pending</span>
          <span class="admin-badge admin-badge--success">${counts.approved || 0} approved</span>
          <span class="admin-badge admin-badge--danger">${counts.rejected || 0} rejected</span>
        </div>
      </div>

      <div class="admin-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <div>
            <h3 style="margin:0;font-size:15px;">Official Ads</h3>
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:2px;">Created by you — published to the Earn &amp; Watch feed immediately, no review needed.</div>
          </div>
          <button class="admin-btn admin-btn--sm admin-btn--solid" onclick="window._toggleOfficialAdForm()">➕ New Official Ad</button>
        </div>
        <div id="official-ad-form" style="display:none;margin-top:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:12px;font-weight:600;">Headline *</label>
              <input id="oa-headline" maxlength="120" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">Business name *</label>
              <input id="oa-business" maxlength="100" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div style="grid-column:1 / -1;">
              <label style="font-size:12px;font-weight:600;">Description (links become clickable for users)</label>
              <textarea id="oa-description" rows="5" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;resize:vertical;"></textarea>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">Contact phone</label>
              <input id="oa-phone" maxlength="40" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">WhatsApp number</label>
              <input id="oa-whatsapp" maxlength="40" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div style="grid-column:1 / -1;">
              <label style="font-size:12px;font-weight:600;">Location</label>
              <input id="oa-location" maxlength="150" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div style="grid-column:1 / -1;">
              <label style="font-size:12px;font-weight:600;">Images (up to 3 — large photos are compressed automatically)</label>
              <input id="oa-images" type="file" accept="image/jpeg,image/png,image/webp" multiple style="margin-top:4px;font-size:12px;">
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:12px;">
            <button id="official-ad-submit" class="admin-btn admin-btn--sm admin-btn--solid" onclick="window._createOfficialAd()">Publish Official Ad</button>
            <span id="official-ad-msg" style="font-size:12px;color:var(--gov-gray-500);"></span>
          </div>
        </div>
      </div>

      ${cards}
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error.</div>';
  }
};

window._moderateAdvert = async function(id, action) {
  let reason = '';
  if (action === 'reject') {
    reason = prompt('Reason for rejection (sent to the user):');
    if (!reason || !reason.trim()) return; // cancelled or empty
  } else {
    if (!confirm('Approve this advert? It will appear in the Earn & Watch feed for all users.')) return;
  }

  try {
    const res = await fetch('/api/admin/adverts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, action, reason })
    });
    const data = await res.json();
    if (data.success) {
      window._loadUserAdverts();
    } else {
      alert(data.message || 'Failed to update advert');
    }
  } catch (err) {
    alert('Network error');
  }
};

window._viewAdvertImage = function(url) {
  window.open(url, '_blank');
};

// Downscale + re-encode a photo in the browser so it always fits the 5MB
// server limit (phone cameras routinely produce 3-8MB JPEGs). Falls back to
// the original file if the canvas API fails — the server still validates.
async function compressAdvertImage(file) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return file;
  const MAX_EDGE = 1920;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.82));
    if (blob && blob.size > 0 && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    }
    return file;
  } catch (e) {
    return file;
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ data: String(r.result).split(',')[1] || '', mime: file.type || 'image/jpeg' });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Publish an official ad. Tries the normal multipart upload first; a few
// fetch-intercepting browser extensions re-encode FormData bodies as JSON,
// which the server reports with "id and action (approve|reject) required" —
// in that case retry once in JSON+base64 compatibility mode.
async function postOfficialAd(fd, files) {
  let res = await fetch('/api/admin/adverts', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + adminToken },
    body: fd
  });
  let data = await res.json().catch(() => ({}));
  if (res.ok || !(data.message || '').includes('id and action')) {
    return { res, data };
  }
  const payload = {};
  fd.forEach((v, k) => { payload[k] = v; });
  payload.official = true;
  payload.imagesBase64 = [];
  for (const f of files) payload.imagesBase64.push(await fileToBase64(f));
  res = await fetch('/api/admin/adverts', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  data = await res.json().catch(() => ({}));
  return { res, data };
}

// ── Official ads (admin-created, auto-approved) ──
window._toggleOfficialAdForm = function() {
  const f = document.getElementById('official-ad-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
};

window._createOfficialAd = async function() {
  const btn = document.getElementById('official-ad-submit');
  const msg = document.getElementById('official-ad-msg');
  const get = (id) => (document.getElementById(id)?.value || '').trim();

  const headline = get('oa-headline');
  const businessName = get('oa-business');
  if (!headline || !businessName) {
    msg.style.color = 'var(--gov-danger)';
    msg.textContent = 'Headline and business name are required.';
    return;
  }
  let files = Array.from(document.getElementById('oa-images')?.files || []);
  if (files.length > 3) {
    files = files.slice(0, 3); // keep the first 3, tell the user
    msg.style.color = '#F59E0B';
    msg.textContent = 'Only the first 3 images will be uploaded.';
  }

  // NOTE: no Content-Type header here — the browser must set the multipart
  // boundary itself (getHeaders() would force JSON and break the upload).
  const fd = new FormData();
  fd.append('headline', headline);
  fd.append('businessName', businessName);
  fd.append('description', get('oa-description'));
  fd.append('contactPhone', get('oa-phone'));
  fd.append('whatsapp', get('oa-whatsapp'));
  fd.append('location', get('oa-location'));
  for (const f of files) fd.append('images', await compressAdvertImage(f));

  btn.disabled = true;
  btn.textContent = 'Publishing...';
  msg.style.color = '';
  msg.textContent = files.length > 0 ? 'Compressing images...' : '';

  try {
    const { data } = await postOfficialAd(fd, files);
    if (data.success) {
      msg.style.color = 'var(--gov-success, #10B981)';
      msg.textContent = 'Official ad published to the feed.';
      ['oa-headline', 'oa-business', 'oa-description', 'oa-phone', 'oa-whatsapp', 'oa-location'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const inp = document.getElementById('oa-images');
      if (inp) inp.value = '';
      window._loadUserAdverts();
    } else {
      msg.style.color = 'var(--gov-danger)';
      msg.textContent = data.message || 'Failed to create ad.';
    }
  } catch (err) {
    msg.style.color = 'var(--gov-danger)';
    msg.textContent = 'Network error — check your connection and try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish Official Ad';
  }
};

window._deleteAdvert = async function(id) {
  if (!confirm('Delete this advert permanently? Its images will also be removed.')) return;
  try {
    const res = await fetch('/api/admin/adverts', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      window._loadUserAdverts();
    } else {
      alert(data.message || 'Failed to delete advert');
    }
  } catch (err) {
    alert('Network error');
  }
};

window._deleteSponsored = async function(id) {
  if (!confirm('Delete this sponsored task?')) return;
  try {
    const res = await fetch('/api/admin/sponsored', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Task deleted successfully', 'success');
      window._loadAdminPanel('sponsored');
    } else {
      showAdminToast(data.message || 'Failed to delete task', 'error');
    }
  } catch (err) {
    showAdminToast('Network error', 'error');
  }
};

window._toggleSponsored = async function(id, activate) {
  const action = activate ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${action} this task?`)) return;
  try {
    const res = await fetch('/api/admin/sponsored/toggle', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ id, is_active: activate })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(`Task ${action}d successfully!`, 'success');
      window._loadAdminPanel('sponsored');
    } else {
      showAdminToast(data.message || 'Failed.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error.', 'error');
  }
};

// ============================================================
// CREATE EARN & WATCH TASK
// ============================================================
async function _loadEarnWatch() {
  const container = document.getElementById('panel-content');
  
  try {
    const res = await fetch('/api/admin/sponsored', { headers: getHeaders() });
    const data = await res.json();
    const existingTasks = data.success ? data.items || [] : [];
    
    container.innerHTML = `
      <div class="admin-page-header">
        <h2>Create Earn & Watch Task</h2>
        <button class="admin-btn admin-btn--ghost" onclick="window._loadAdminPanel('sponsored')">← Back to List</button>
      </div>
      
      <div class="admin-card" style="margin-bottom:24px;">
        <form class="admin-form" id="earn-form">
          <div class="admin-form__group">
            <label class="admin-form__label">Task Title <span id="ew-title-req" style="color:var(--gov-danger);">*</span></label>
            <input type="text" id="ew-title" class="admin-form__input" placeholder="e.g., Watch: How to Build Wealth" />
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:4px;">The title users will see in their Earn & Watch tab. <strong>Leave blank when adding a YouTube link</strong> — it auto-fills from the video.</div>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="admin-form__group">
              <label class="admin-form__label">Content Type <span style="color:var(--gov-danger);">*</span></label>
              <select id="ew-type" class="admin-form__select">
                <option value="video"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Video</option>
                <option value="audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio</option>
                <option value="article"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Article</option>
              </select>
            </div>
            <div class="admin-form__group">
              <label class="admin-form__label">Platform / Content Type</label>
              <select id="ew-platform" class="admin-form__select">
                <option value="youtube"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> YouTube</option>
                <option value="tiktok"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> TikTok</option>
                <option value="vimeo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Vimeo</option>
                <option value="audio"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Audio (MP3/WAV/SoundCloud)</option>
                <option value="other">→ Other Link</option>
              </select>
            </div>
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Content URL <span style="color:var(--gov-danger);">*</span></label>
            <input type="url" id="ew-link" class="admin-form__input" required placeholder="https://youtube.com/... or tiktok.com/... or vimeo.com/..." />
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:4px;">Users will be directed to this link to complete the task</div>
            <div id="ew-autofill-hint" class="admin-msg" style="display:none;margin-top:8px;"></div>
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="admin-form__group">
              <label class="admin-form__label">Reward Amount (MWK) <span style="color:var(--gov-danger);">*</span></label>
              <input type="number" id="ew-reward" class="admin-form__input" required value="50" min="10" step="5" />
            </div>
            <div class="admin-form__group">
              <label class="admin-form__label">Duration (seconds) <span style="color:var(--gov-danger);">*</span></label>
              <input type="number" id="ew-duration" class="admin-form__input" required value="90" min="30" step="10" />
            </div>
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Thumbnail URL</label>
            <input type="url" id="ew-thumbnail" class="admin-form__input" placeholder="https://example.com/thumbnail.jpg" />
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:4px;">Optional: leave blank for YouTube links — the video thumbnail is fetched automatically</div>
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Sponsor Name</label>
            <input type="text" id="ew-sponsor" class="admin-form__input" placeholder="Sponsor name (optional)" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Description</label>
            <textarea id="ew-desc" class="admin-form__textarea" placeholder="Brief description..." rows="3"></textarea>
          </div>
          
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button type="submit" class="admin-btn admin-btn--solid"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg> Create Task</button>
            <button type="button" class="admin-btn admin-btn--ghost" onclick="document.getElementById('earn-form').reset();">Clear Form</button>
          </div>
          
          <div id="ew-msg" class="admin-msg" style="margin-top:16px;"></div>
        </form>
      </div>
      
      <div class="admin-card">
        <div class="admin-card__header">
          <h3 style="font-size:16px;">Recent Tasks</h3>
          <span style="font-size:13px;color:var(--gov-gray-500);">${existingTasks.length} total</span>
        </div>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Reward</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${existingTasks.length > 0 ? existingTasks.slice(0, 5).map(function(t) {
                return `
                  <tr>
                    <td><strong>${t.title || '—'}</strong></td>
                    <td><span class="admin-badge admin-badge--info">${t.content_type || '—'}</span></td>
                    <td style="font-weight:600;color:var(--gov-blue);">MWK ${parseFloat(t.reward_amount || 0).toLocaleString()}</td>
                    <td>${t.duration_seconds || 90}s</td>
                    <td><span class="admin-badge ${t.is_active ? 'admin-badge--success' : 'admin-badge--warning'}">${t.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--gov-gray-500);">No tasks created yet.</td></tr>'}
            </tbody>
          </table>
        </div>
        ${existingTasks.length > 5 ? `<div style="padding:12px;text-align:center;border-top:1px solid var(--gov-border);"><button class="admin-btn admin-btn--ghost admin-btn--sm" onclick="window._loadAdminPanel('sponsored')">View All ${existingTasks.length} Tasks →</button></div>` : ''}
      </div>
    `;

    document.getElementById('earn-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const title = document.getElementById('ew-title').value.trim();
      const contentType = document.getElementById('ew-type').value;
      const videoPlatform = document.getElementById('ew-platform').value;
      const externalLink = document.getElementById('ew-link').value.trim();
      const reward = document.getElementById('ew-reward').value;
      const duration = document.getElementById('ew-duration').value;
      const thumbnail = document.getElementById('ew-thumbnail').value.trim();
      const sponsor = document.getElementById('ew-sponsor').value.trim();
      const description = document.getElementById('ew-desc').value.trim();
      const msg = document.getElementById('ew-msg');

      const isAutoMetaLink = /youtube\.com|youtu\.be|tiktok\.com|vimeo\.com/i.test(externalLink || '');
      if (!title && !isAutoMetaLink) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Title is required for non-video content.';
        return;
      }

      if (!externalLink) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Content URL is required.';
        return;
      }

      if (!reward || parseFloat(reward) < 10) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Reward must be at least 10 MWK.';
        return;
      }

      if (!duration || parseInt(duration) < 30) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Duration must be at least 30 seconds.';
        return;
      }

      try {
        new URL(externalLink);
      } catch {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Please enter a valid URL (include https://).';
        return;
      }

      try {
        const requestBody = {
          title,
          content_type: contentType,
          video_platform: videoPlatform,
          external_link: externalLink,
          reward_amount: parseFloat(reward),
          duration_seconds: parseInt(duration),
          thumbnail_url: thumbnail,
          sponsor_name: sponsor || 'Wisdom Vault',
          description: description || title
        };

        const res = await fetch('/api/admin/sponsored', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(requestBody)
        });
        
        const data = await res.json();
        
        if (data.success) {
          msg.className = 'admin-msg admin-msg--success';
          msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Task created successfully!';
          showAdminToast('Task created!', 'success');
          
          document.getElementById('ew-title').value = '';
          document.getElementById('ew-link').value = '';
          document.getElementById('ew-desc').value = '';
          document.getElementById('ew-sponsor').value = '';
          document.getElementById('ew-thumbnail').value = '';
          
          setTimeout(function() {
            window._loadAdminPanel('sponsored');
          }, 1500);
        } else {
          msg.className = 'admin-msg admin-msg--error';
          msg.innerHTML = data.message || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Failed to create task.';
          showAdminToast(msg.textContent, 'error');
        }
      } catch (err) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error. Please try again.';
        showAdminToast('Network error', 'error');
        console.error('Create task error:', err);
      }
    });

    // ============================================================
    // AUTO-FILL FROM YOUTUBE URL
    // When the platform is YouTube, pasting a video link auto-fetches its
    // title + thumbnail (via the admin meta endpoint) so the admin only needs
    // to supply the URL and the reward — exactly like auto-uploaded content.
    // ============================================================
    const linkInput = document.getElementById('ew-link');
    const platformSelect = document.getElementById('ew-platform');
    const ewHint = document.getElementById('ew-autofill-hint');
    let autofillTimer = null;
    let autofillInFlight = false;

    async function tryAutofillFromUrl() {
      const link = (linkInput?.value || '').trim();
      if (!link || !/youtube\.com|youtu\.be|tiktok\.com|vimeo\.com/i.test(link)) {
        if (ewHint) { ewHint.style.display = 'none'; ewHint.textContent = ''; }
        return;
      }
      if (ewHint) { ewHint.style.display = 'block'; ewHint.textContent = 'Fetching video details…'; }
      autofillInFlight = true;
      try {
        const platformParam = '&platform=' + encodeURIComponent(platformSelect?.value || 'auto');
        const res = await fetch('/api/admin/sponsored/meta?url=' + encodeURIComponent(link) + platformParam, {
          method: 'GET',
          headers: getHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          const titleEl = document.getElementById('ew-title');
          const descEl = document.getElementById('ew-desc');
          const thumbEl = document.getElementById('ew-thumbnail');
          if (titleEl && !titleEl.value.trim()) titleEl.value = data.title || '';
          if (descEl && !descEl.value.trim()) descEl.value = 'Watch "' + (data.title || 'this video') + '" and earn rewards.';
          if (thumbEl && !thumbEl.value.trim()) thumbEl.value = data.thumbnail || '';
          if (ewHint) { ewHint.textContent = '✅ Title & thumbnail auto-filled — edit if needed.'; }
          // Update title requirement after auto-fill
          if (typeof updateTitleRequirement === 'function') updateTitleRequirement();
          showAdminToast('Video details fetched automatically', 'success');
        } else {
          if (ewHint) { ewHint.textContent = '⚠️ ' + (data.message || 'Could not fetch video details.'); }
        }
      } catch (err) {
        if (ewHint) { ewHint.textContent = '⚠️ Could not fetch video details — will retry on create.'; }
      } finally {
        autofillInFlight = false;
      }
    }

    function scheduleAutofill() {
      if (autofillTimer) clearTimeout(autofillTimer);
      autofillTimer = setTimeout(() => {
        const platform = (platformSelect?.value || 'youtube');
        if (['youtube', 'tiktok', 'vimeo'].includes(platform)) tryAutofillFromUrl();
      }, 500);
    }

    function updateTitleRequirement() {
      const isVideoPlatform = ['youtube', 'tiktok', 'vimeo'].includes(platformSelect?.value || 'youtube');
      const star = document.getElementById('ew-title-req');
      if (star) star.style.display = isVideoPlatform ? 'none' : 'inline';
    }

    linkInput?.addEventListener('input', scheduleAutofill);
    linkInput?.addEventListener('blur', () => {
      const platform = (platformSelect?.value || 'youtube');
      if (platform === 'youtube' && !autofillInFlight) tryAutofillFromUrl();
    });
    platformSelect?.addEventListener('change', () => {
      updateTitleRequirement();
      if (platformSelect.value === 'youtube') tryAutofillFromUrl();
      else if (ewHint) { ewHint.style.display = 'none'; ewHint.textContent = ''; }
    });
    updateTitleRequirement();
    
  } catch (err) {
    container.innerHTML = `
      <div style="padding:40px;color:var(--gov-danger);text-align:center;">
        <p>Error loading form. Please refresh.</p>
        <button class="admin-btn admin-btn--solid" onclick="window._loadAdminPanel('earn-watch')" style="margin-top:12px;">Retry</button>
      </div>
    `;
    console.error('Load earn watch error:', err);
  }
}

// ============================================================
// WITHDRAWALS
// ============================================================
async function _loadWithdrawals() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/withdrawals', { headers: getHeaders() });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load withdrawals.</div>';
      return;
    }

    const withdrawals = data.withdrawals || [];

    const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;
    const withdrawalsBadge = document.getElementById('withdrawals-badge');
    if (withdrawalsBadge) withdrawalsBadge.textContent = pendingCount;

    let rows = '';
    if (withdrawals.length === 0) {
      rows = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--gov-gray-500);">No withdrawal requests.</td></tr>';
    } else {
      for (const w of withdrawals) {
        const statusBadge = w.status === 'pending' ?
          '<span class="admin-badge admin-badge--warning">Pending</span>' :
          w.status === 'processing' ?
            '<span class="admin-badge admin-badge--info">Processing</span>' :
          w.status === 'completed' ?
            '<span class="admin-badge admin-badge--success">Completed</span>' :
          w.status === 'failed' ?
            '<span class="admin-badge admin-badge--danger">Failed</span>' :
            '<span class="admin-badge admin-badge--danger">Rejected</span>';

        const cardholderName = w.cardholderName || '—';
        const phoneNumber = w.phoneNumber || w.user_phone || '—';
        
        const grossAmount = parseFloat(w.amount_requested || 0);
        const feeAmount = parseFloat(w.withdrawal_fee || 0);
        const netAmount = parseFloat(w.amount_paid || 0);
        const dateRequested = w.requested_at ? new Date(w.requested_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        }) : '—';

        const actionBtns = w.status === 'pending' ?
          `<div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="admin-btn admin-btn--success admin-btn--sm" onclick="window._approveWithdrawal('${w.id}')">✓ Approve</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="window._rejectWithdrawal('${w.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</button>
            </div>` :
          w.status === 'processing' ?
          `<div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="admin-btn admin-btn--success admin-btn--sm" onclick="window._confirmWithdrawalPaid('${w.id}')">✓ Money Sent</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="window._rejectWithdrawal('${w.id}', true)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Refund</button>
            </div>` :
          `<span style="font-size:12px;color:var(--gov-gray-500);">${w.processed_at ? new Date(w.processed_at).toLocaleDateString() : '—'}</span>`;

        rows += `
          <tr style="${w.status === 'pending' ? 'background:rgba(245,166,35,0.05);' : ''}">
            <td data-label="User">
              <div class="admin-table-cell">
                <div class="admin-table-avatar">${(w.full_name || '?').charAt(0).toUpperCase()}</div>
                <div>
                  <strong>${w.full_name || '—'}</strong>
                  <div style="font-size:11px;color:var(--gov-gray-500);">${w.email || ''}</div>
                </div>
              </div>
            </td>
            <td data-label="Date" style="font-size:13px;">${dateRequested}</td>
            <td data-label="Card Name" style="font-size:13px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${cardholderName}">${cardholderName}</td>
            <td data-label="Phone" style="font-size:13px;">${phoneNumber}</td>
            <td data-label="Gross" style="font-weight:600;">MWK ${grossAmount.toLocaleString()}</td>
            <td data-label="Fee" style="color:var(--gov-danger);">-MWK ${feeAmount.toLocaleString()}</td>
            <td data-label="Net" style="font-weight:700;color:var(--gov-blue);">MWK ${netAmount.toLocaleString()}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Action">${actionBtns}</td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="admin-page-header">
        <div>
          <h2>Withdrawal Requests</h2>
          <span style="font-size:13px;color:var(--gov-gray-500);">Tiered withdrawal fees apply (see fee structure)</span>
        </div>
        <div style="display:flex;gap:12px;align-items:center;">
          <span class="admin-page-count">${withdrawals.length} requests</span>
          ${pendingCount > 0 ? `<span style="font-size:13px;color:var(--gov-warning);">${pendingCount} pending</span>` : ''}
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Card Name</th>
                <th>Phone</th>
                <th>Gross</th>
                <th>Fee</th>
                <th>Net Payout</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error. Please refresh.</div>';
  }
}

window._approveWithdrawal = async function(id) {
  if (!confirm('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Approve this withdrawal?')) return;
  try {
    const res = await fetch('/api/admin/withdrawals', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ withdrawalId: id, status: 'completed' })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Withdrawal approved!', 'success');
      // Give the success popup a moment to be seen, then refresh the whole page
      // so the table, badges and totals all reflect the new status.
      setTimeout(function() { window.location.reload(); }, 1600);
    } else {
      showAdminToast(data.message || 'Failed to approve.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error. Please try again.', 'error');
  }
};

// Confirm a PayChangu auto-withdrawal that is stuck on 'processing' actually
// reached the user. This marks it Completed WITHOUT refunding — the funds were
// already deducted from the wallet when the payout was initiated. Only use it
// when you have confirmed the money was really sent (never refund a payout
// that already went through, or the user is paid twice).
window._confirmWithdrawalPaid = async function(id) {
  if (!confirm('Mark this withdrawal as Completed (money sent to the user)?\n\nThis will NOT refund — only use it when the payout has actually reached the user.')) return;
  try {
    const res = await fetch('/api/admin/withdrawals', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ withdrawalId: id, status: 'completed' })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Withdrawal marked as paid!', 'success');
      // Give the success popup a moment to be seen, then refresh the whole page
      // so the table, badges and totals all reflect the new status.
      setTimeout(function() { window.location.reload(); }, 1600);
    } else {
      showAdminToast(data.message || 'Failed to mark as paid.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error. Please try again.', 'error');
  }
};

window._rejectWithdrawal = async function(id, isStuck) {
  if (isStuck) {
    if (!confirm('WARNING: This withdrawal was initiated via PayChangu. Only refund if you have confirmed the money did NOT reach the user. Refund now?')) return;
  } else {
    const reason = prompt('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reason for rejection (optional):');
    if (!confirm(`Reject this withdrawal?${reason ? '\n\nReason: ' + reason : ''}`)) return;
  }
  
  try {
    const res = await fetch('/api/admin/withdrawals', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ 
        withdrawalId: id, 
        status: 'rejected',
        notes: reason || 'Withdrawal rejected by admin'
      })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Withdrawal rejected. Amount refunded.', 'success');
      // Give the success popup a moment to be seen, then refresh the whole page
      // so the table, badges and totals all reflect the new status.
      setTimeout(function() { window.location.reload(); }, 1600);
    } else {
      showAdminToast(data.message || 'Failed to reject.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error. Please try again.', 'error');
  }
};

// ============================================================
// PAYMENT PROOFS
// ============================================================
async function _loadPaymentProofs() {
  const container = document.getElementById('panel-content');

  try {
    const res = await fetch('/api/admin/payment-proofs', { headers: getHeaders() });
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load payment proofs.</div>';
      return;
    }

    const proofs = data.proofs || [];

    const pendingCount = proofs.filter((p) => p.status === 'pending').length;
    const proofsBadge = document.getElementById('proofs-badge');
    if (proofsBadge) proofsBadge.textContent = pendingCount;

    let rows = '';
    if (proofs.length === 0) {
      rows = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gov-gray-500);">No payment proofs.</td></tr>';
    } else {
      for (const p of proofs) {
        const statusBadge = p.status === 'approved' ?
          '<span class="admin-badge admin-badge--success">Approved</span>' :
          p.status === 'rejected' ?
            '<span class="admin-badge admin-badge--danger">Rejected</span>' :
            '<span class="admin-badge admin-badge--warning">Pending</span>';

        const actionBtns = p.status === 'pending' ?
          `<div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="admin-btn admin-btn--success admin-btn--sm" onclick="window._approveProof('${p.id}', '${p.user_id}', '${p.pack_id}')">Approve</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="window._rejectProof('${p.id}', '${p.user_id}')">Reject</button>
            </div>` :
          '—';

        rows += `
          <tr>
            <td data-label="User"><strong>${p.user_name || '—'}</strong></td>
            <td data-label="Pack">${p.pack_name || '—'}</td>
            <td data-label="Amount" style="font-weight:600;color:var(--gov-blue);">MWK ${parseFloat(p.amount_sent || 0).toLocaleString()}</td>
            <td data-label="Status">${statusBadge}</td>
            <td data-label="Action">${actionBtns}</td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>Payment Proofs</h2>
        <span class="admin-page-count">${proofs.length} proofs</span>
      </div>
      <div class="admin-card">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pack</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error.</div>';
  }
}

window._approveProof = async function(proofId, userId, packId) {
  if (!confirm('Approve this payment proof?')) return;
  try {
    const res = await fetch('/api/admin/payment-proofs', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ proofId, userId, packId, status: 'approved' })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Payment approved!', 'success');
      window._loadAdminPanel('payment-proofs');
    } else {
      showAdminToast(data.message || 'Failed.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error.', 'error');
  }
};

window._rejectProof = async function(proofId, userId) {
  if (!confirm('Reject this payment proof?')) return;
  try {
    const res = await fetch('/api/admin/payment-proofs', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ proofId, userId, status: 'rejected' })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Payment rejected.', 'success');
      window._loadAdminPanel('payment-proofs');
    } else {
      showAdminToast(data.message || 'Failed.', 'error');
    }
  } catch (err) {
    showAdminToast('Network error.', 'error');
  }
};

// ============================================================
// SETTINGS
// ============================================================
async function _loadSettings() {
  const container = document.getElementById('panel-content');
  try {
    const res = await fetch('/api/admin/payment-settings', { headers: getHeaders() });
    const data = await res.json();
    const config = data.success ? data.config : {};

    const getVal = (key) => (config && config[key] ? config[key].value : '');

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>System Settings</h2>
        <span style="font-size:13px;color:var(--gov-gray-500);">Configure billing and payment settings</span>
      </div>
      
      <div class="admin-card" style="max-width:700px;">
        <form class="admin-form" id="settings-form">
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Payment Configuration</h3>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Registration Fee (MWK)</label>
            <input type="number" id="set-fee-mwk" class="admin-form__input" value="${getVal('registration_fee_mwk') || '13000'}" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Registration Fee (USD)</label>
            <input type="number" id="set-fee-usd" class="admin-form__input" value="${getVal('registration_fee_usd') || '7'}" step="0.5" />
          </div>
          
          <div style="border-top:1px solid var(--gov-border);margin:20px 0;"></div>
          
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Mobile Money Configuration</h3>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Name 1</label>
            <input type="text" id="set-agent-name1" class="admin-form__input" value="${getVal('agent_name_1')}" placeholder="e.g., John Doe" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Code 1</label>
            <input type="text" id="set-agent1" class="admin-form__input" value="${getVal('agent_code_1')}" placeholder="*405*..." />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Name 2</label>
            <input type="text" id="set-agent-name2" class="admin-form__input" value="${getVal('agent_name_2')}" placeholder="e.g., Jane Smith" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Code 2</label>
            <input type="text" id="set-agent2" class="admin-form__input" value="${getVal('agent_code_2')}" placeholder="*405*..." />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">WhatsApp Number</label>
            <input type="text" id="set-whatsapp" class="admin-form__input" value="${getVal('whatsapp_number')}" placeholder="+265..." />
          </div>
          
          <div style="border-top:1px solid var(--gov-border);margin:20px 0;"></div>
          
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Withdrawal Settings</h3>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Minimum Withdrawal (MWK)</label>
            <input type="number" id="set-min-withdrawal" class="admin-form__input" value="${getVal('withdrawal_min_amount') || '7000'}" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Withdrawal Mode</label>
            <div style="display:flex;align-items:center;gap:16px;margin-top:8px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;">
                <input type="radio" name="withdrawal_mode" value="manual" ${getVal('withdrawal_mode') !== 'paychangu' ? 'checked' : ''} style="accent-color:var(--gov-blue);" />
                Manual (Admin Approves)
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;">
                <input type="radio" name="withdrawal_mode" value="paychangu" ${getVal('withdrawal_mode') === 'paychangu' ? 'checked' : ''} style="accent-color:var(--gov-blue);" />
                Auto (PayChangu)
              </label>
            </div>
            <p style="font-size:12px;color:var(--gov-gray-500);margin-top:6px;">
              Manual: User requests withdrawal, admin reviews and pays manually.<br>
              Auto: Withdrawals are processed instantly via PayChangu mobile money.
            </p>
          </div>
          
          <div style="border-top:1px solid var(--gov-border);margin:20px 0;"></div>
          
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Auto Content (Earn & Watch Fallback)</h3>
          <p style="font-size:12px;color:var(--gov-gray-500);margin-bottom:16px;">
            If no new content is uploaded on a given day, the system automatically uploads up to 7 videos from the list below so users always have tasks to earn from.
          </p>
          
          <div class="admin-form__group">
            <label class="admin-form__label">YouTube URL Pool (one link per line)</label>
            <textarea id="set-auto-urls" class="admin-form__input" rows="8" placeholder="https://www.youtube.com/watch?v=...
https://www.youtube.com/watch?v=...">${getVal('auto_content_urls')}</textarea>
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Auto-Upload</label>
            <div style="display:flex;align-items:center;gap:16px;margin-top:8px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;">
                <input type="radio" name="auto_content_enabled" value="true" ${getVal('auto_content_enabled') !== 'false' ? 'checked' : ''} style="accent-color:var(--gov-blue);" />
                Enabled
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;">
                <input type="radio" name="auto_content_enabled" value="false" ${getVal('auto_content_enabled') === 'false' ? 'checked' : ''} style="accent-color:var(--gov-blue);" />
                Disabled
              </label>
            </div>
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Max Auto Content Per Day</label>
            <input type="number" id="set-auto-max" class="admin-form__input" value="${getVal('auto_content_max') || '7'}" min="1" max="7" />
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="admin-form__group">
              <label class="admin-form__label">Min Reward Per Video (MWK)</label>
              <input type="number" id="set-auto-reward-min" class="admin-form__input" value="${getVal('auto_content_reward_min') || '1000'}" min="1" />
            </div>
            <div class="admin-form__group">
              <label class="admin-form__label">Max Reward Per Video (MWK)</label>
              <input type="number" id="set-auto-reward-max" class="admin-form__input" value="${getVal('auto_content_reward_max') || '2300'}" min="1" />
            </div>
          </div>
          <p style="font-size:12px;color:var(--gov-gray-500);margin-top:2px;">Each auto-uploaded video pays a random reward between the min and max.</p>
          
          <button type="submit" class="admin-btn admin-btn--solid"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save All Settings</button>
          <div id="set-msg" class="admin-msg" style="margin-top:16px;"></div>
        </form>
      </div>
    `;

    document.getElementById('settings-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const settings = {
        registration_fee_mwk: document.getElementById('set-fee-mwk').value.trim(),
        registration_fee_usd: document.getElementById('set-fee-usd').value.trim(),
        agent_name_1: document.getElementById('set-agent-name1').value.trim(),
        agent_code_1: document.getElementById('set-agent1').value.trim(),
        agent_name_2: document.getElementById('set-agent-name2').value.trim(),
        agent_code_2: document.getElementById('set-agent2').value.trim(),
        whatsapp_number: document.getElementById('set-whatsapp').value.trim(),
        withdrawal_min_amount: document.getElementById('set-min-withdrawal').value.trim(),
        withdrawal_mode: document.querySelector('input[name="withdrawal_mode"]:checked')?.value || 'manual',
        auto_content_urls: document.getElementById('set-auto-urls').value.trim(),
        auto_content_enabled: document.querySelector('input[name="auto_content_enabled"]:checked')?.value || 'true',
        auto_content_max: document.getElementById('set-auto-max').value.trim() || '7',
        auto_content_reward_min: document.getElementById('set-auto-reward-min').value.trim() || '1000',
        auto_content_reward_max: document.getElementById('set-auto-reward-max').value.trim() || '2300'
      };
      
      const msg = document.getElementById('set-msg');
      
      try {
        const res = await fetch('/api/admin/payment-settings', {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ settings })
        });
        const data = await res.json();
        
        if (data.success) {
          msg.className = 'admin-msg admin-msg--success';
          msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> All settings saved successfully!';
          showAdminToast('Settings saved!', 'success');
        } else {
          msg.className = 'admin-msg admin-msg--error';
          msg.innerHTML = data.message || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Failed to save settings.';
          showAdminToast(msg.textContent, 'error');
        }
      } catch (err) {
        msg.className = 'admin-msg admin-msg--error';
        msg.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Network error. Please try again.';
        showAdminToast('Network error', 'error');
      }
    });
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Error loading settings.</div>';
  }
}

// ============================================================
// EDIT & DELETE CONTENT
// ============================================================
window._editContent = function(contentId) {
  showAdminToast('Edit mode coming soon. Please use the database directly.', 'info');
  window._loadAdminPanel('add-content');
};

window._deleteContent = async function(contentId) {
  if (!confirm('Delete this content permanently?')) return;
  try {
    const res = await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ contentId })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast('Content deleted successfully', 'success');
      const currentPanel = document.querySelector('.admin-sidebar__link--active')?.dataset.panel || 'library-content';
      window._loadAdminPanel(currentPanel);
    } else {
      showAdminToast(data.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    showAdminToast('Network error', 'error');
  }
};

// ============================================================
// INITIALIZE
// ============================================================
if (adminToken) {
  renderApp();
} else {
  renderLogin();
}

// ============================================================
// VACANCIES — admin publishes job vacancies directly to users'
// Vacancies panel (More sheet, after My Advert). Description is
// unlimited. Close/reopen or delete without losing anything.
// ============================================================

window._loadVacancies = async function() {
  const container = document.getElementById('panel-content');
  try {
    const res = await fetch('/api/admin/vacancies', { headers: getHeaders() });
    const data = await res.json();
    if (!data.success) {
      container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Failed to load vacancies.</div>';
      return;
    }

    const vacancies = data.vacancies || [];
    window._vacanciesData = vacancies;
    const counts = data.counts || { total: 0, active: 0, closed: 0 };

    const rows = vacancies.map((v) => {
      const imgs = v.images || [];
      return `
      <div class="admin-card" style="margin-bottom:16px;">
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${imgs.length > 0 ? imgs.map(u => `<img src="${u}" style="width:86px;height:86px;object-fit:cover;border-radius:10px;border:1px solid var(--gov-border);cursor:pointer;" onclick="window._viewVacancyImage('${u}')">`).join('')
              : '<div style="width:86px;height:86px;border-radius:10px;border:1px dashed var(--gov-border);display:flex;align-items:center;justify-content:center;color:var(--gov-gray-500);font-size:11px;">No images</div>'}
          </div>
          <div style="flex:1;min-width:240px;">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              ${v.isActive ? '<span class="admin-badge admin-badge--success">Open</span>' : '<span class="admin-badge admin-badge--danger">Closed</span>'}
              <span style="font-size:11px;color:var(--gov-gray-500);">${new Date(v.createdAt).toLocaleString()}</span>
              ${v.viewCount ? `<span style="font-size:11px;color:var(--gov-gray-500);">• ${v.viewCount} views</span>` : ''}
            </div>
            <h3 style="margin:8px 0 2px;font-size:16px;">${v.title}</h3>
            <div style="font-size:13px;color:var(--gov-blue);font-weight:600;">${v.company}</div>
            ${v.description ? `<p style="font-size:13px;color:var(--gov-gray-500);margin:8px 0;line-height:1.5;white-space:pre-wrap;">${v.description}</p>` : ''}
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:6px;">
              ${v.location ? '📍 ' + v.location : ''}
              ${v.contactPhone ? ' • 📞 ' + v.contactPhone : ''}
              ${v.whatsapp ? ' • 💬 ' + v.whatsapp : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;">
            <button class="admin-btn admin-btn--sm admin-btn--ghost" onclick="window._editVacancy('${v.id}')">Edit</button>
            ${v.isActive
              ? `<button class="admin-btn admin-btn--sm admin-btn--ghost" onclick="window._toggleVacancy('${v.id}','close')">Close</button>`
              : `<button class="admin-btn admin-btn--sm admin-btn--solid" onclick="window._toggleVacancy('${v.id}','reopen')">Reopen</button>`}
            <button class="admin-btn admin-btn--sm admin-btn--ghost" style="color:var(--gov-danger);" onclick="window._deleteVacancy('${v.id}')">Delete</button>
          </div>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="admin-page-header">
        <h2>Vacancies</h2>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span class="admin-badge admin-badge--warning">${counts.active || 0} open</span>
          <span class="admin-badge admin-badge--danger">${counts.closed || 0} closed</span>
        </div>
      </div>

      <div class="admin-card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <div>
            <h3 style="margin:0;font-size:15px;"><span id="vacancy-form-title">Publish a Vacancy</span><span id="vacancy-edit-hint" style="display:none;color:var(--gov-blue);"> — Editing vacancy</span></h3>
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:2px;">Published instantly to every user's Vacancies panel (More → Vacancies). Description has no length limit.</div>
          </div>
          <button class="admin-btn admin-btn--sm admin-btn--solid" onclick="window._toggleVacancyForm()">➕ New Vacancy</button>
        </div>
        <div id="vacancy-form" style="display:none;margin-top:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:12px;font-weight:600;">Job title *</label>
              <input id="vc-title" maxlength="120" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">Company / organisation *</label>
              <input id="vc-company" maxlength="100" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div style="grid-column:1 / -1;">
              <label style="font-size:12px;font-weight:600;">Description (unlimited — links become clickable for users)</label>
              <textarea id="vc-description" rows="8" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;resize:vertical;"></textarea>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">Location</label>
              <input id="vc-location" maxlength="150" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">Contact phone</label>
              <input id="vc-phone" maxlength="40" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;">WhatsApp number</label>
              <input id="vc-whatsapp" maxlength="40" style="width:100%;padding:8px 10px;border:1px solid var(--gov-border);border-radius:8px;font-size:13px;margin-top:4px;">
            </div>
            <div style="grid-column:1 / -1;">
              <label style="font-size:12px;font-weight:600;">Images (up to 3 — large photos are compressed automatically)</label>
              <input id="vc-images" type="file" accept="image/jpeg,image/png,image/webp" multiple style="margin-top:4px;font-size:12px;">
            </div>
          </div>
          <div id="vc-existing-images"></div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap;">
            <button id="vacancy-submit" class="admin-btn admin-btn--sm admin-btn--solid" onclick="window._submitVacancyForm()">Publish Vacancy</button>
            <button id="vacancy-cancel-edit" class="admin-btn admin-btn--sm admin-btn--ghost" style="display:none;" onclick="window._cancelVacancyEdit()">Cancel</button>
            <span id="vacancy-msg" style="font-size:12px;color:var(--gov-gray-500);"></span>
          </div>
        </div>
      </div>

      ${rows}
    `;
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Network error.</div>';
  }
};

window._toggleVacancyForm = function() {
  const f = document.getElementById('vacancy-form');
  if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
};

window._submitVacancyForm = async function() {
  const btn = document.getElementById('vacancy-submit');
  const msg = document.getElementById('vacancy-msg');
  const get = (id) => (document.getElementById(id)?.value || '').trim();

  const title = get('vc-title');
  const company = get('vc-company');
  if (!title || !company) {
    msg.style.color = 'var(--gov-danger)';
    msg.textContent = 'Job title and company are required.';
    return;
  }
  let files = Array.from(document.getElementById('vc-images')?.files || []);
  const editingId = window._vacEditingId || null;
  const keepImages = editingId ? (window._vacEditKeep || []) : [];

  // 3-image cap across kept + newly selected images.
  if (keepImages.length + files.length > 3) {
    files = files.slice(0, Math.max(0, 3 - keepImages.length));
    msg.style.color = '#F59E0B';
    msg.textContent = 'Only the first images up to the 3-image limit will be uploaded.';
  }

  // NOTE: no Content-Type header — the browser must set the multipart
  // boundary itself (getHeaders() would force JSON and break the upload).
  const fd = new FormData();
  if (editingId) fd.append('id', editingId);
  fd.append('title', title);
  fd.append('company', company);
  fd.append('description', get('vc-description'));
  fd.append('location', get('vc-location'));
  fd.append('contactPhone', get('vc-phone'));
  fd.append('whatsapp', get('vc-whatsapp'));
  if (editingId) fd.append('keepImages', JSON.stringify(keepImages));
  for (const f of files) fd.append('images', await compressAdvertImage(f));

  btn.disabled = true;
  btn.textContent = editingId ? 'Saving...' : 'Publishing...';
  msg.style.color = '';
  msg.textContent = files.length > 0 ? 'Compressing images...' : '';

  const resetBtn = () => {
    btn.disabled = false;
    btn.textContent = editingId ? 'Save Changes' : 'Publish Vacancy';
  };

  try {
    const res = await fetch('/api/admin/vacancies', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Authorization': 'Bearer ' + adminToken },
      body: fd
    });
    let data = await res.json().catch(() => ({}));
    let success = !!data.success;

    if (!success && (data.message || '').includes('id and action')) {
      // A fetch-intercepting browser extension re-encoded FormData as JSON —
      // retry once in JSON + base64 compatibility mode (same as official ads).
      const payload = editingId
        ? { edit: true, id: editingId, title, company, keepImages }
        : { official: true, title, company };
      payload.description = get('vc-description');
      payload.location = get('vc-location');
      payload.contactPhone = get('vc-phone');
      payload.whatsapp = get('vc-whatsapp');
      payload.imagesBase64 = [];
      for (const f of files) payload.imagesBase64.push(await fileToBase64(f));
      const res2 = await fetch('/api/admin/vacancies', {
        method: editingId ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      data = await res2.json().catch(() => ({}));
      success = !!data.success;
    }

    if (success) {
      msg.style.color = 'var(--gov-success, #10B981)';
      msg.textContent = editingId ? 'Vacancy updated.' : 'Vacancy published.';
      window._clearVacancyForm();
      window._loadVacancies();
    } else {
      msg.style.color = 'var(--gov-danger)';
      msg.textContent = data.message || (editingId ? 'Failed to update vacancy.' : 'Failed to publish vacancy.');
    }
  } catch (err) {
    msg.style.color = 'var(--gov-danger)';
    msg.textContent = 'Network error — check your connection and try again.';
  } finally {
    resetBtn();
  }
};

// ── Edit mode: prefill the form with an existing vacancy ──
window._editVacancy = function(id) {
  const v = (window._vacanciesData || []).find(x => x.id === id);
  if (!v) { alert('Vacancy not found — try reloading the panel.'); return; }

  window._vacEditingId = id;
  window._vacEditKeep = (v.images || []).slice();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('vc-title', v.title);
  set('vc-company', v.company);
  set('vc-description', v.description);
  set('vc-location', v.location);
  set('vc-phone', v.contactPhone);
  set('vc-whatsapp', v.whatsapp);
  const inp = document.getElementById('vc-images');
  if (inp) inp.value = '';

  const form = document.getElementById('vacancy-form');
  if (form) { form.style.display = 'block'; form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  const hint = document.getElementById('vacancy-edit-hint');
  if (hint) hint.style.display = 'inline';
  const cancel = document.getElementById('vacancy-cancel-edit');
  if (cancel) cancel.style.display = '';
  const submit = document.getElementById('vacancy-submit');
  if (submit) submit.textContent = 'Save Changes';
  const msg = document.getElementById('vacancy-msg');
  if (msg) { msg.style.color = ''; msg.textContent = ''; }

  window._renderVacEditImages();
};

// Existing images with remove toggles (edit mode only).
window._renderVacEditImages = function() {
  const wrap = document.getElementById('vc-existing-images');
  if (!wrap) return;
  const keep = window._vacEditKeep || [];
  if (!window._vacEditingId || keep.length === 0) { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  wrap.style.display = 'block';
  wrap.innerHTML = `
    <div style="font-size:12px;font-weight:600;margin-top:10px;">Current images (Remove deletes them when you save)</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
      ${keep.map(u => `
        <div style="position:relative;">
          <img src="${u}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--gov-border);">
          <button onclick="window._vacEditKeep = window._vacEditKeep.filter(x => x !== '${u}'); window._renderVacEditImages();"
            style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:var(--gov-danger,#EF4444);color:#fff;font-size:11px;cursor:pointer;line-height:1;">✕</button>
        </div>`).join('')}
    </div>`;
};

window._cancelVacancyEdit = function() {
  window._clearVacancyForm();
  const msg = document.getElementById('vacancy-msg');
  if (msg) { msg.style.color = ''; msg.textContent = 'Edit cancelled.'; }
};

window._clearVacancyForm = function() {
  window._vacEditingId = null;
  window._vacEditKeep = [];
  ['vc-title', 'vc-company', 'vc-description', 'vc-location', 'vc-phone', 'vc-whatsapp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const inp = document.getElementById('vc-images');
  if (inp) inp.value = '';
  const wrap = document.getElementById('vc-existing-images');
  if (wrap) { wrap.style.display = 'none'; wrap.innerHTML = ''; }
  const hint = document.getElementById('vacancy-edit-hint');
  if (hint) hint.style.display = 'none';
  const cancel = document.getElementById('vacancy-cancel-edit');
  if (cancel) cancel.style.display = 'none';
  const submit = document.getElementById('vacancy-submit');
  if (submit) submit.textContent = 'Publish Vacancy';
};

window._toggleVacancy = async function(id, action) {
  const verb = action === 'close'
    ? "Close this vacancy? It will disappear from users' Vacancies panel."
    : 'Reopen this vacancy? It will become visible to users again.';
  if (!confirm(verb)) return;
  try {
    const res = await fetch('/api/admin/vacancies', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ id, action })
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      window._loadVacancies();
    } else {
      alert(data.message || 'Failed to update vacancy');
    }
  } catch (err) {
    alert('Network error');
  }
};

window._deleteVacancy = async function(id) {
  if (!confirm('Delete this vacancy permanently? Its images will also be removed.')) return;
  try {
    const res = await fetch('/api/admin/vacancies', {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ id })
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      window._loadVacancies();
    } else {
      alert(data.message || 'Failed to delete vacancy');
    }
  } catch (err) {
    alert('Network error');
  }
};

window._viewVacancyImage = function(url) {
  window.open(url, '_blank');
};
