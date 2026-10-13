#!/usr/bin/env node
// Generates placeholder PNG screenshots for PWA Builder
// Usage: node scripts/gen-placeholders.mjs
// Then replace these with real screenshots of your app

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import zlib from 'zlib';

const OUT = join(process.cwd(), 'public', 'screenshots');
mkdirSync(OUT, { recursive: true });

// Minimal PNG encoder — creates a solid-color PNG
function createPNG(width, height, r, g, b) {
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte: None
    for (let x = 0; x < width; x++) {
      raw.push(r, g, b);
    }
  }
  const deflated = zlib.deflateSync(Buffer.from(raw));

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = crc32(typeAndData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc);
    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let c = 0xffffffff;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Narrow screenshot (portrait) — 720x1280
const narrow = createPNG(720, 1280, 0xf7, 0xf1, 0xec);
writeFileSync(join(OUT, 'screenshot-narrow.png'), narrow);
console.log('✅ Created screenshot-narrow.png (720x1280)');

// Wide screenshot (landscape) — 1280x720
const wide = createPNG(1280, 720, 0xf7, 0xf1, 0xec);
writeFileSync(join(OUT, 'screenshot-wide.png'), wide);
console.log('✅ Created screenshot-wide.png (1280x720)');

console.log('\n⚠️  These are placeholder colors. Replace with real app screenshots:');
console.log('   - public/screenshots/screenshot-narrow.png (720x1280, portrait)');
console.log('   - public/screenshots/screenshot-wide.png   (1280x720, landscape)');
