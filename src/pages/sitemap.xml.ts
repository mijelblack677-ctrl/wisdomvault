export const prerender = false;

import type { APIRoute } from 'astro';

// XML sitemap for the pages a crawler should actually index.
//
// Generated rather than a hand-written public/sitemap.xml so it can never drift
// out of step with the routes and so the origin comes from `site` in
// astro.config.mjs instead of being duplicated in another file.
//
// Deliberately excluded: /dashboard, /vault, /vaultpro, /billing, /admin and
// /pay — all require a session, and listing them would only advertise URLs that
// answer 401/redirect to anyone who follows the sitemap.

interface Entry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

const ENTRIES: Entry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/register', changefreq: 'monthly', priority: '0.9' },
  { path: '/login', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.2' },
];

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string
  ));

export const GET: APIRoute = ({ site, url }) => {
  const origin = site ?? new URL('https://vault-of-wisdom.com');

  // lastmod is intentionally omitted rather than faked: there is no content
  // modification date behind these pages, and a build-time stamp would tell
  // crawlers the site changed on every deploy.
  const body = ENTRIES.map((entry) => {
    const loc = new URL(entry.path, origin).href;
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cheap to regenerate and cacheable at the edge for a day.
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
