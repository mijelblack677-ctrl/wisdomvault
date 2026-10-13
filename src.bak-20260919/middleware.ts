// src/middleware.ts
// Security headers for every response (HTML pages get the full set incl. CSP).
import { defineMiddleware } from 'astro:middleware';

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com",
  "img-src 'self' data: blob: https:",
  // Allow generated audio data URLs and local/blob media
  "media-src 'self' data: blob:",
  // Allow embedded video providers used by the dashboard
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com",
  // API/connectivity
  "connect-src 'self' https://api.paychangu.co.mw https://vault-of-wisdom.com https://www.vault-of-wisdom.com",
  "form-action 'self' https://api.paychangu.co.mw https://paychangu.co.mw",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

export const onRequest = defineMiddleware((context, next) => {
  const response = next();
  return response.then((res) => {
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.startsWith('text/html')) {
      res.headers.set('X-Frame-Options', 'SAMEORIGIN');
      res.headers.set('Content-Security-Policy', CSP);
    }
    return res;
  });
});
