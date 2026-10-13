// Save original fetch
const originalFetch = window.fetch;

function getAuthToken() {
  try {
    const t = localStorage.getItem('wisdom_vault_token');
    if (t) return t;
    const u = JSON.parse(localStorage.getItem('wisdom_vault_user') || '{}');
    return u && u.token ? u.token : null;
  } catch (e) {
    return null;
  }
}

// Override fetch to automatically add Authorization header (and preserve existing bypass behavior)
window.fetch = function(url, options = {}) {
  // Do not attach auth to public endpoints
  const publicPaths = ['/login', '/register', '/', '/api/auth/login', '/api/auth/register', '/api/public/', '/api/echo'];
  if (typeof url === 'string' && publicPaths.some(p => url.includes(p))) {
    return originalFetch(url, options);
  }

  const token = getAuthToken();

  // Preserve existing headers
  const existingHeaders = (options && options.headers) ? { ...options.headers } : {};
  const headers = {
    ...existingHeaders,
    'Content-Type': existingHeaders['Content-Type'] || existingHeaders['content-type'] || 'application/json'
  };

  // Preserve existing Vercel bypass header behavior
  if (typeof VERCEL_BYPASS_SECRET !== 'undefined' && VERCEL_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = VERCEL_BYPASS_SECRET;
  }

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  return originalFetch(url, {
    ...options,
    headers
  });
};
