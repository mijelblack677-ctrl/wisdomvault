//#region src/lib/rate-limit.ts
var buckets = /* @__PURE__ */ new Map();
var lastSweep = Date.now();
function sweep(now) {
	if (now - lastSweep < 6e4) return;
	lastSweep = now;
	for (const [key, bucket] of buckets) if (now > bucket.resetAt) buckets.delete(key);
	if (buckets.size > 5e4) buckets.clear();
}
/**
* Check a fixed-window limit for `key`. Each key is allowed `limit` hits per
* `windowMs`. When the limit is exceeded, `retryAfterSeconds` reports the
* seconds until the current window resets.
*/
function checkRateLimit(key, limit, windowMs) {
	const now = Date.now();
	sweep(now);
	const bucket = buckets.get(key);
	if (!bucket || now > bucket.resetAt) {
		buckets.set(key, {
			count: 1,
			resetAt: now + windowMs
		});
		return {
			allowed: true,
			retryAfterSeconds: Math.ceil(windowMs / 1e3)
		};
	}
	bucket.count += 1;
	const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1e3);
	if (bucket.count <= limit) return {
		allowed: true,
		retryAfterSeconds
	};
	return {
		allowed: false,
		retryAfterSeconds
	};
}
/**
* Best-effort client IP from the headers Vercel (and edge proxies) set.
* `x-forwarded-for` is the chain of proxies; the client is the leftmost entry.
*/
function clientIp(request) {
	return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || "unknown";
}
/** Build a standard 429 JSON response with a Retry-After header. */
function rateLimitResponse(retryAfterSeconds) {
	return new Response(JSON.stringify({
		success: false,
		message: "Too many requests. Please try again shortly."
	}), {
		status: 429,
		headers: {
			"Content-Type": "application/json",
			"Retry-After": String(retryAfterSeconds)
		}
	});
}
var MAX_PASSWORD_FAILURES = 3;
var LOCKOUT_DURATION_MS = 900 * 1e3;
var passwordFailures = /* @__PURE__ */ new Map();
/** Check whether the given identifier is currently locked out. */
function isPasswordLocked(identifier) {
	const key = identifier.toLowerCase().trim();
	const entry = passwordFailures.get(key);
	if (!entry) return {
		locked: false,
		retryAfterSeconds: 0
	};
	if (entry.lockedUntil > Date.now()) return {
		locked: true,
		retryAfterSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1e3)
	};
	return {
		locked: false,
		retryAfterSeconds: 0
	};
}
/** Record a failed password attempt. Returns the new state. */
function recordPasswordFailure(identifier) {
	const key = identifier.toLowerCase().trim();
	const now = Date.now();
	let entry = passwordFailures.get(key);
	if (!entry || entry.lockedUntil > 0 && now >= entry.lockedUntil) entry = {
		count: 0,
		lockedUntil: 0
	};
	entry.count += 1;
	if (entry.count >= MAX_PASSWORD_FAILURES) {
		entry.lockedUntil = now + LOCKOUT_DURATION_MS;
		passwordFailures.set(key, entry);
		return {
			count: entry.count,
			locked: true,
			retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1e3)
		};
	}
	passwordFailures.set(key, entry);
	return {
		count: entry.count,
		locked: false,
		retryAfterSeconds: 0
	};
}
/** Clear failure count on successful login. */
function clearPasswordFailures(identifier) {
	passwordFailures.delete(identifier.toLowerCase().trim());
}
//#endregion
export { rateLimitResponse as a, isPasswordLocked as i, clearPasswordFailures as n, recordPasswordFailure as o, clientIp as r, checkRateLimit as t };
