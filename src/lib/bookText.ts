// lib/bookText.ts
//
// Turns a Word (.docx) or EPUB file into structured blocks the reader can
// render as real text.
//
// Why: a browser cannot display a .docx or an .epub at all, and Google Drive
// refuses to preview EPUB outright. Rather than hand those books to an iframe
// that shows nothing, we read the text out and lay it out ourselves — which
// also makes the font-size, theme and reading-progress controls meaningful.
//
// No dependencies: both formats are ZIP archives, so we inflate them with the
// built-in `zlib`. Server-side only (imports node:zlib).

import zlib from 'node:zlib';

export type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'quote' | 'break';

export interface TextBlock {
  type: BlockType;
  text: string;
}

// ---------------------------------------------------------------------------
// Minimal ZIP reader (central directory)
// ---------------------------------------------------------------------------

const EOCD_SIG = 0x06054b50;
const CD_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

/**
 * Read every member of a ZIP archive into a name → Buffer map.
 * Uses the central directory because it always carries accurate sizes, even
 * for entries written with streaming data descriptors.
 */
export function readZip(buf: Buffer): Map<string, Buffer> {
  const out = new Map<string, Buffer>();

  // Locate the End Of Central Directory record: scan back over the (usually
  // empty) comment, which may be up to 64KB.
  let eocd = -1;
  const scanFrom = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= scanFrom; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error('not a zip archive');

  const entryCount = buf.readUInt16LE(eocd + 10);
  let cdOffset = buf.readUInt32LE(eocd + 16);

  // Zip64: when the real values are 0xFFFFFFFF they live in the Zip64 EOCD
  // record, which sits just before the classic EOCD.
  if (cdOffset === 0xffffffff || entryCount === 0xffff) {
    for (let i = eocd - 20; i >= 0; i--) {
      if (buf.readUInt32LE(i) === 0x06064b50) {
        cdOffset = Number(buf.readBigUInt64LE(i + 48));
        break;
      }
    }
  }

  let p = cdOffset;
  for (let n = 0; n < entryCount && p + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(p) !== CD_SIG) break;

    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');

    let size = compSize;
    // Pull the real compressed size out of the Zip64 extra field when needed.
    if (size === 0xffffffff) {
      const ex = buf.subarray(p + 46 + nameLen, p + 46 + nameLen + extraLen);
      let q = 0;
      while (q + 4 <= ex.length) {
        const tag = ex.readUInt16LE(q);
        const len = ex.readUInt16LE(q + 2);
        if (tag === 0x0001) {
          size = Number(ex.readBigUInt64LE(q + 4 + 8)); // skip uncompressed
          break;
        }
        q += 4 + len;
      }
    }

    // Name is only meaningful if the read succeeded; skip directories.
    if (name && !name.endsWith('/') && localOffset && localOffset < buf.length) {
      if (buf.readUInt32LE(localOffset) === LOCAL_SIG) {
        const lNameLen = buf.readUInt16LE(localOffset + 26);
        const lExtraLen = buf.readUInt16LE(localOffset + 28);
        const dataStart = localOffset + 30 + lNameLen + lExtraLen;
        const data = buf.subarray(dataStart, dataStart + size);
        try {
          out.set(name, method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data));
        } catch {
          // A member we can't inflate is not fatal — skip it.
        }
      }
    }

    p += 46 + nameLen + extraLen + commentLen;
  }

  return out;
}

// ---------------------------------------------------------------------------
// XML / HTML → text helpers
// ---------------------------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function clean(s: string): string {
  return decodeEntities(s).replace(/[ \t\r\n]+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

const HEADING: Record<string, BlockType> = {
  heading1: 'h1', title: 'h1', heading2: 'h2', subtitle: 'h2', heading3: 'h3',
  heading4: 'h3', heading5: 'h3', heading6: 'h3', quote: 'quote', intensequote: 'quote',
};

/** Extract paragraphs, headings and list items from word/document.xml. */
export function docxToBlocks(zip: Map<string, Buffer>): TextBlock[] {
  const doc = zip.get('word/document.xml');
  if (!doc) return [];

  const xml = doc.toString('utf8');
  const blocks: TextBlock[] = [];

  // Each <w:p>…</w:p> is a paragraph; anything outside them (tables etc.)
  // still yields its <w:t> runs, so we walk paragraphs then mop up leftovers.
  const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];

  for (const para of paragraphs) {
    const styleMatch = para.match(/<w:pStyle\s+w:val="([^"]+)"/);
    const style = (styleMatch?.[1] || '').toLowerCase();

    // Join runs, turning <w:br/> into real newlines so line breaks survive.
    const text = clean(
      (para.match(/<w:t[^>]*>[\s\S]*?<\/w:t>|<w:br\s*\/>|<w:tab\s*\/>/g) || [])
        .map(t => {
          if (t.startsWith('<w:br')) return '\n';
          if (t.startsWith('<w:tab')) return ' ';
          return t.replace(/^<w:t[^>]*>/, '').replace(/<\/w:t>$/, '');
        })
        .join('')
        .split('\n')
        .map(s => clean(s))
        .join('\n')
    );

    if (!text) continue;

    let type: BlockType = 'p';
    if (HEADING[style]) type = HEADING[style];
    else if (style.includes('listbullet') || style.includes('listparagraph')) type = 'li';
    else if (style.includes('listnumber')) type = 'li';

    blocks.push({ type, text });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// EPUB
// ---------------------------------------------------------------------------

/** Resolve an href against the directory of the referencing file. */
function resolveHref(base: string, href: string): string {
  const baseDir = base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '';
  const parts = (baseDir + href.split('#')[0]).split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

// Block-level tags that end one text run and begin the next. Matching pairs
// with a regex gets nesting wrong (a <div> wrapping several <p> would swallow
// them into one giant paragraph), so instead we walk tags linearly and start a
// new run at every block boundary.
const BLOCK_TAGS = new Set([
  'p', 'div', 'li', 'blockquote', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'td', 'th', 'tr', 'table', 'figure', 'figcaption', 'pre', 'dd', 'dt',
]);

function blockTypeFor(tag: string): BlockType {
  if (tag === 'li' || tag === 'dd' || tag === 'dt') return 'li';
  if (tag === 'blockquote' || tag === 'pre') return 'quote';
  if (/^h[1-6]$/.test(tag)) {
    const n = Number(tag[1]);
    return n === 1 ? 'h1' : n === 2 ? 'h2' : 'h3';
  }
  return 'p';
}

/** Convert one XHTML document into blocks, preserving nesting and order. */
function xhtmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;

  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let current: BlockType = 'p';
  let buffer = '';
  let cursor = 0;
  let m: RegExpExecArray | null;

  const flush = () => {
    const text = clean(buffer);
    if (text) blocks.push({ type: current, text });
    buffer = '';
  };

  while ((m = tagRe.exec(body))) {
    buffer += body.slice(cursor, m.index);
    cursor = tagRe.lastIndex;

    const raw = m[0];
    const tag = m[1].toLowerCase();

    if (tag === 'br') { buffer += '\n'; continue; }
    if (!BLOCK_TAGS.has(tag)) continue; // inline tag — its text stays in the run

    // A block boundary: close off whatever text we have, then adopt the new
    // block's type. Closing tags don't change the type (a stray <div> after
    // </p> just keeps flowing as a paragraph).
    flush();
    if (!raw.startsWith('</')) current = blockTypeFor(tag);
  }
  buffer += body.slice(cursor);
  flush();

  return blocks;
}

/** Walk EPUB spine order and return the book as blocks. */
export function epubToBlocks(zip: Map<string, Buffer>): TextBlock[] {
  const container = zip.get('META-INF/container.xml')?.toString('utf8');
  let opfPath = container?.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) {
    // Some hand-rolled EPUBs omit container.xml — find the OPF directly.
    opfPath = [...zip.keys()].find(k => k.toLowerCase().endsWith('.opf'));
  }
  if (!opfPath) return [];

  const opf = zip.get(opfPath)?.toString('utf8');
  if (!opf) return [];

  // manifest: id → href ; spine: ordered idrefs
  const manifest = new Map<string, string>();
  for (const item of opf.match(/<item\b[^>]*>/g) || []) {
    const id = item.match(/\bid="([^"]+)"/)?.[1];
    const href = item.match(/\bhref="([^"]+)"/)?.[1];
    if (id && href) manifest.set(id, href);
  }

  const spineBlock = opf.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)?.[1] ?? '';
  const order = (spineBlock.match(/<itemref\b[^>]*>/g) || [])
    .map(ref => ref.match(/\bidref="([^"]+)"/)?.[1])
    .filter((v): v is string => Boolean(v));

  // Prefer spine order; if the spine is missing, just read in archive order.
  const hrefs = order.length
    ? order.map(id => manifest.get(id)).filter((v): v is string => Boolean(v))
    : [...zip.keys()].filter(k => /\.(x?html)$/i.test(k));

  const blocks: TextBlock[] = [];
  for (const href of hrefs) {
    const path = resolveHref(opfPath, href);
    const file = zip.get(path) || zip.get(decodeURIComponent(path));
    if (!file) continue;
    blocks.push(...xhtmlToBlocks(file.toString('utf8')));
  }

  return blocks;
}

// ---------------------------------------------------------------------------

/** Extract readable blocks from a .docx or .epub buffer. */
export function extractBookText(buf: Buffer, ext: string): TextBlock[] {
  const zip = readZip(buf);
  return ext === 'epub' ? epubToBlocks(zip) : docxToBlocks(zip);
}
