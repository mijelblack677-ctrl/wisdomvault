import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// ─────────────────────────────────────────────────────────────────────────────
// Which adapter?
//
// This project runs in two places:
//   • the VPS, as a long-running Node server (pm2, 127.0.0.1:4321)
//   • Vercel, as a serverless deployment
//
// Those need different adapters. When Vercel built with the Node adapter it
// produced an output with no routes at all, and EVERY path 404'd — including
// the homepage — while the build itself reported success. Vercel sets VERCEL=1
// during builds, so pick the adapter from the environment rather than relying
// on which config file Astro happens to prefer (astro.config.ts is still here
// and does the same thing; this file wins).
// ─────────────────────────────────────────────────────────────────────────────
const onVercel = process.env.VERCEL === '1';

export default defineConfig({
  output: 'server',
  // The canonical origin. Used to build absolute URLs for og:url / og:image
  // (WhatsApp and Facebook ignore relative ones — which is why shared referral
  // links had no preview image) and for the sitemap. Kept as a constant rather
  // than read from the request so a visit via the bare IP or the Vercel relay
  // can never emit the wrong canonical host.
  site: 'https://vault-of-wisdom.com',
  // The vercel adapter is loaded lazily: the VPS has no @astrojs/vercel
  // installed, and a static import here breaks every build there.
  adapter: onVercel
    ? (await import('@astrojs/vercel')).default({ webAnalytics: { enabled: true } })
    : node({ mode: 'standalone' }),
  security: {
    // Behind nginx (TLS terminates there) the Node adapter would otherwise see
    // plain http:// and ignore X-Forwarded-Proto, making every real browser
    // form POST fail the CSRF origin check with 403 "Cross-site POST form
    // submissions are forbidden". Listing our https domains makes Astro trust
    // the forwarded proto so url.origin matches the browser's Origin header.
    allowedDomains: [
      { hostname: 'vault-of-wisdom.com', protocol: 'https' },
      { hostname: 'www.vault-of-wisdom.com', protocol: 'https' },
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['three'],
    },
    resolve: {
      alias: {
        '@lib': '/src/lib',
      },
    },
  },
});
