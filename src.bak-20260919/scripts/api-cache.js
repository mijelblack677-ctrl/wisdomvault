// ============================================================
// WISDOM VAULT - BROWSER RESPONSE CACHE
// Serves repeat GET responses from localStorage within a TTL so
// polling/navigation stops hammering the serverless functions.
// Writes (POST/PUT) invalidate every cache entry they affect.
// Every failure here is non-fatal: the app just fetches live.
// ============================================================

const CACHE_PREFIX = 'wv_cache_v1:';

// TTL per endpoint path prefix (ms). Missing / 0 = never cache.
const CACHE_TTL = {
  '/public/stats': 5 * 60 * 1000,          // global config, rarely changes
  '/wallet/balance': 30 * 1000,            // changes on watch/withdraw → invalidated
  '/content/packs': 10 * 60 * 1000,
  '/content/library': 10 * 60 * 1000,
  '/content/howto': 10 * 60 * 1000,
  '/notifications': 90 * 1000,             // matches the polling interval
  '/user/payment-status': 5 * 60 * 1000,
  '/wallet/withdrawal-status': 30 * 1000,
  '/referral/stats': 5 * 60 * 1000,
  '/content/course-progress': 5 * 60 * 1000,
  '/earn/watch': 60 * 1000,                // content list; invalidated on claim
  '/paychangu/status': 0,                  // money flow — always live
};

// When a write to a path succeeds, drop every cached read it affects.
const INVALIDATION = {
  '/earn/watch': ['/earn/watch', '/wallet/balance', '/public/stats'],
  '/wallet/withdraw': ['/wallet/balance', '/wallet/withdrawal-status'],
  '/notifications': ['/notifications'],
  '/content/purchase-book': ['/content/packs', '/content/library'],
  '/courses/purchase': ['/content/packs'],
  '/content/course-progress': ['/content/course-progress'],
  '/paychangu/initiate': ['/user/payment-status'],
};

function pathOf(endpoint) {
  try { return new URL(endpoint, window.location.origin).pathname; }
  catch (e) { return String(endpoint).split('?')[0] || ''; }
}

function ttlFor(endpoint) {
  const p = pathOf(endpoint);
  for (const key of Object.keys(CACHE_TTL)) {
    if (p.startsWith(key)) return CACHE_TTL[key];
  }
  return 0;
}

function storageKey(endpoint, userId) {
  const p = pathOf(endpoint);
  const q = String(endpoint).split('?')[1] || '';
  return CACHE_PREFIX + p + '?' + q + '|' + (userId || '');
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw);
    if (!entry || entry.t === undefined) return undefined;
    return entry;
  } catch (e) { return undefined; }
}

// Fresh cache hit (within TTL) or undefined.
export function cacheGet(endpoint, userId) {
  const ttl = ttlFor(endpoint);
  if (!ttl) return undefined;
  const entry = read(storageKey(endpoint, userId));
  if (!entry) return undefined;
  if (Date.now() - entry.t <= ttl) return entry.v;
  return undefined;
}

// Any cached copy regardless of age — used as a network-failure fallback.
export function cacheGetStale(endpoint, userId) {
  const entry = read(storageKey(endpoint, userId));
  return entry ? entry.v : undefined;
}

export function cacheSet(endpoint, userId, value) {
  if (!ttlFor(endpoint)) return; // non-cacheable endpoints are never stored
  try {
    localStorage.setItem(storageKey(endpoint, userId), JSON.stringify({ t: Date.now(), v: value }));
  } catch (e) { /* quota/private-mode — fetch live instead */ }
}

// Drop every cached entry whose path is affected by a write to `endpoint`.
export function invalidateFor(endpoint) {
  const prefixes = INVALIDATION[pathOf(endpoint)];
  if (!prefixes || !prefixes.length) return;
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(CACHE_PREFIX)) continue;
      const kp = k.slice(CACHE_PREFIX.length).split('?')[0].split('|')[0];
      if (prefixes.includes(kp)) doomed.push(k);
    }
    doomed.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

// Wipe all cached API responses (used on sign-out so one user's data
// never surfaces for the next user on the same device).
export function cacheClearAll() {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) doomed.push(k);
    }
    doomed.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}