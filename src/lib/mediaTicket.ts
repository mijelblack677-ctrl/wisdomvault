// lib/mediaTicket.ts
//
// Lets a book file be served into an <iframe> without exposing anything.
//
// The app authenticates with a Bearer token kept in localStorage, and the
// browser never attaches that header to an iframe request. Rather than put the
// session token (or the upstream file URL) in the query string — where it would
// land in history, logs and Referer headers — the client first asks for a
// short-lived signed ticket, which is returned as an HttpOnly cookie scoped to
// the media path only.
//
// The ticket says "this request comes from authenticated user X". Ownership of
// the specific book is still checked against the database on every read, so a
// stolen ticket cannot reach anything the user did not already own.

import crypto from 'node:crypto';

export const MEDIA_COOKIE = 'wv_media';

/** The cookie is only ever sent to the media endpoint. */
export const MEDIA_COOKIE_PATH = '/api/content/read/';

const TTL_SECONDS = 60 * 60; // an hour is far longer than a reading session
const KEY_LABEL = 'wv-media-ticket-v1';

/**
 * Derive a key dedicated to signing tickets. Deriving a labelled subkey from
 * an existing secret means no new production secret has to be introduced, and
 * the source secret is never itself used as a signing key.
 */
function signingKey(): Buffer {
  const secret = process.env.MEDIA_TICKET_SECRET || process.env.CRON_SECRET || '';
  return crypto.createHmac('sha256', secret).update(KEY_LABEL).digest();
}

function sign(userId: string, exp: number): string {
  return crypto
    .createHmac('sha256', signingKey())
    .update(`${userId}:${exp}`)
    .digest('base64url');
}

/**
 * Issue a ticket for a user, valid for an hour.
 * The user id is part of the ticket because the verifier has to know whose
 * signature to check — it is signed, so it cannot be swapped for another id.
 */
export function issueTicket(userId: string, ttlSeconds = TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${userId}.${exp}.${sign(userId, exp)}`;
}

/**
 * Validate a ticket and return the user id it was issued to, or null.
 * Compared in constant time so the signature can't be probed byte by byte.
 */
export function verifyTicket(ticket: string | undefined | null): string | null {
  if (!ticket) return null;

  const parts = ticket.split('.');
  if (parts.length !== 3) return null;

  const [userId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp) || exp * 1000 < Date.now()) return null;

  const expected = sign(userId, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return userId;
}

/** Read one cookie out of a request's Cookie header. */
export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/** Build the Set-Cookie value that installs a ticket. */
export function ticketCookie(ticket: string): string {
  return [
    `${MEDIA_COOKIE}=${encodeURIComponent(ticket)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Path=${MEDIA_COOKIE_PATH}`,
    `Max-Age=${TTL_SECONDS}`,
  ].join('; ');
}
