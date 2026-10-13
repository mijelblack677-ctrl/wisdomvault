// Simple in-memory rate limiter
const requests: Map<string, number[]> = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60');
const ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  if (!ENABLED) return { allowed: true };

  const now = Date.now();
  const userRequests = requests.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((oldestRequest + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  recentRequests.push(now);
  requests.set(identifier, recentRequests);
  
  return { allowed: true };
}
