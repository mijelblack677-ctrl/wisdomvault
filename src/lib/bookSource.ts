// lib/bookSource.ts
//
// Works out what a stored book URL actually points at.
//
// The library stores whatever link was pasted in, which means the real format
// has to be inferred: Google Drive `/view` links carry no extension, several
// "pdf" rows are really Word documents, and one row is typed as a video while
// pointing at a PDF. Both the server (to serve and extract) and the browser
// (to label and choose a viewer) need the same answer, so the logic lives here.
//
// Deliberately free of node imports so the client bundle can use it too.

export type BookKind = 'pdf' | 'word' | 'epub' | 'video' | 'audio' | 'html' | 'unknown';

export interface BookSource {
  /** What the reader should do with it. */
  kind: BookKind;
  /** Google Drive / Docs file id, when the file is hosted there. */
  driveId: string | null;
  /** Real file extension, when it can be told from the URL. */
  ext: string | null;
  /** True when the file lives on a third-party host rather than our disk. */
  external: boolean;
  /** Short human label for a badge, e.g. "PDF", "Word", "EPUB". */
  label: string;
}

const DRIVE_PATTERNS = [
  /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/,
  /drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,})/,
  /drive\.google\.com\/uc\?(?:[^#]*&)?id=([A-Za-z0-9_-]{10,})/,
  /docs\.google\.com\/\w+\/d\/([A-Za-z0-9_-]{10,})/,
];

const EXT_KINDS: Record<string, BookKind> = {
  pdf: 'pdf',
  doc: 'word', docx: 'word', rtf: 'word', odt: 'word',
  epub: 'epub', mobi: 'epub', azw3: 'epub',
  mp4: 'video', webm: 'video', mov: 'video', mkv: 'video',
  mp3: 'audio', m4a: 'audio', wav: 'audio', ogg: 'audio',
  html: 'html', htm: 'html', txt: 'html',
};

const KIND_LABELS: Record<BookKind, string> = {
  pdf: 'PDF',
  word: 'Word',
  epub: 'EPUB',
  video: 'Video',
  audio: 'Audio',
  html: 'Text',
  unknown: 'Book',
};

export function kindFromExt(ext: string | null | undefined): BookKind {
  if (!ext) return 'unknown';
  return EXT_KINDS[ext.toLowerCase().replace(/^\./, '')] ?? 'unknown';
}

export function labelForKind(kind: BookKind): string {
  return KIND_LABELS[kind] ?? 'Book';
}

/** Map an upstream Content-Type (plus filename, for the ambiguous ones). */
export function kindFromContentType(contentType: string, filename?: string): BookKind {
  const ct = (contentType || '').toLowerCase();
  const nameExt = filename?.match(/\.([a-z0-9]+)$/i)?.[1] ?? null;

  const byExt = kindFromExt(nameExt);
  if (byExt !== 'unknown' && byExt !== 'html') return byExt;

  if (ct.includes('pdf')) return 'pdf';
  if (ct.includes('epub')) return 'epub';
  if (ct.includes('officedocument.wordprocessing') || ct.includes('msword')) return 'word';
  if (ct.startsWith('video/')) return 'video';
  if (ct.startsWith('audio/')) return 'audio';
  if (ct.includes('html') || ct.includes('text/plain') || byExt === 'html') return 'html';

  return byExt === 'html' ? 'html' : 'unknown';
}

/**
 * Classify a stored URL.
 *
 * A Drive link's extension is not in the URL, so `ext` stays null and the
 * caller has to resolve it from the response. A `link_type` hint is honoured
 * only when the URL gives us nothing better.
 */
export function parseBookUrl(url: string | null | undefined, linkTypeHint?: string | null): BookSource {
  const raw = (url || '').trim();

  if (!raw) {
    return { kind: 'unknown', driveId: null, ext: null, external: false, label: KIND_LABELS.unknown };
  }

  // Google Drive / Docs share links
  for (const pattern of DRIVE_PATTERNS) {
    const match = raw.match(pattern);
    if (match) {
      const hint = hintKind(linkTypeHint);
      return {
        kind: hint,
        driveId: match[1],
        ext: null,
        external: true,
        label: KIND_LABELS[hint],
      };
    }
  }

  // Hosted on our own disk, or a plain external URL — the path tells us more.
  const path = raw.split('?')[0].split('#')[0];
  const ext = path.match(/\.([A-Za-z0-9]{1,6})$/)?.[1]?.toLowerCase() ?? null;
  const kind = kindFromExt(ext);
  const resolved = kind === 'unknown' ? hintKind(linkTypeHint) : kind;

  return {
    kind: resolved,
    driveId: null,
    ext,
    external: !raw.startsWith('/'),
    label: KIND_LABELS[resolved],
  };
}

/** Only trust a stored link_type for kinds a URL cannot express. */
function hintKind(linkType?: string | null): BookKind {
  switch ((linkType || '').toLowerCase()) {
    case 'youtube':
    case 'vimeo':
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'epub':
      return 'epub';
    case 'word':
    case 'docx':
    case 'doc':
      return 'word';
    case 'pdf':
      return 'pdf';
    case 'article':
    case 'url':
      return 'html';
    default:
      return 'unknown';
  }
}

/** True when the reader must extract text rather than hand the file to the browser. */
export function needsTextExtraction(kind: BookKind): boolean {
  return kind === 'word' || kind === 'epub';
}

/** Content-Type to serve a stored file with, by kind. */
export function contentTypeFor(kind: BookKind, ext?: string | null): string {
  if (kind === 'pdf') return 'application/pdf';
  if (kind === 'word') {
    return ext === 'doc'
      ? 'application/msword'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (kind === 'epub') return 'application/epub+zip';
  if (kind === 'video') return 'video/mp4';
  if (kind === 'audio') return 'audio/mpeg';
  if (kind === 'html') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}
