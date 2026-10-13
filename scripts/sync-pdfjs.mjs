// scripts/sync-pdfjs.mjs
//
// Copies the runtime files pdf.js needs out of node_modules and into public/,
// where they are served as plain static assets.
//
//   npm run sync:pdfjs
//
// Why public/ rather than bundling: the worker, the wasm decoders, the cmaps
// and the standard fonts are large (a few MB) and are only ever fetched when
// somebody actually opens a book. Serving them statically means they stay out
// of the dashboard bundle, and the production build needs no build-time
// dependency on pdfjs-dist.

import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('node_modules/pdfjs-dist');
const DEST = path.resolve('public/pdfjs');

// Renamed from .mjs to .js on purpose: nginx 1.20 (what production runs) has no
// `mjs` entry in mime.types, so an .mjs file is served as
// application/octet-stream and the browser refuses to execute it as a module.
//
// Taken from legacy/build rather than build: the modern build calls
// Map.prototype.getOrInsertComputed, which Safari/iOS and Chrome still lack, and
// it fails at load time with "getOrInsertComputed is not a function". The legacy
// build ships its own polyfill for exactly that, so it is the one that actually
// runs on the browsers our members use. Only the two entry files differ — the
// wasm decoders, cmaps and fonts below are the same in both builds.
const FILES = [
  { from: 'legacy/build/pdf.min.mjs', to: 'pdf.min.js' },
  { from: 'legacy/build/pdf.worker.min.mjs', to: 'pdf.worker.js' },
  { from: 'LICENSE', to: 'LICENSE' },
];
const DIRS = ['wasm', 'cmaps', 'standard_fonts'];

if (!fs.existsSync(SRC)) {
  console.error('pdfjs-dist is not installed — run `npm install` first.');
  process.exit(1);
}

const version = JSON.parse(fs.readFileSync(path.join(SRC, 'package.json'), 'utf8')).version;

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

for (const { from: rel, to } of FILES) {
  const from = path.join(SRC, rel);
  if (!fs.existsSync(from)) continue;
  fs.copyFileSync(from, path.join(DEST, to));
}

let bytes = 0;
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else bytes += fs.statSync(full).size;
  }
};

for (const dir of DIRS) {
  const from = path.join(SRC, dir);
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, path.join(DEST, dir), { recursive: true });
  walk(path.join(DEST, dir));
}

fs.writeFileSync(
  path.join(DEST, 'VERSION'),
  `pdf.js ${version}\n\n`
  + 'Vendored from the pdfjs-dist npm package so the viewer loads on demand\n'
  + 'and the server build needs no extra build-time dependency.\n\n'
  + `Files: ${FILES.map(f => `${f.from} → ${f.to}`).join(', ')}, ${DIRS.join('/, ')}/\n`
  + 'Renamed to .js so nginx serves them as JavaScript (it has no mjs mapping).\n'
  + 'Regenerate: npm i pdfjs-dist@<version> && npm run sync:pdfjs\n',
);

console.log(`pdf.js ${version} → public/pdfjs (${(bytes / 1048576).toFixed(1)} MB)`);
