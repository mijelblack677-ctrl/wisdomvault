import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
import fs from "fs";
import path from "path";
import crypto from "node:crypto";
import zlib from "node:zlib";
//#region src/lib/bookSource.ts
var DRIVE_PATTERNS = [
	/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/,
	/drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,})/,
	/drive\.google\.com\/uc\?(?:[^#]*&)?id=([A-Za-z0-9_-]{10,})/,
	/docs\.google\.com\/\w+\/d\/([A-Za-z0-9_-]{10,})/
];
var EXT_KINDS = {
	pdf: "pdf",
	doc: "word",
	docx: "word",
	rtf: "word",
	odt: "word",
	epub: "epub",
	mobi: "epub",
	azw3: "epub",
	mp4: "video",
	webm: "video",
	mov: "video",
	mkv: "video",
	mp3: "audio",
	m4a: "audio",
	wav: "audio",
	ogg: "audio",
	html: "html",
	htm: "html",
	txt: "html"
};
var KIND_LABELS = {
	pdf: "PDF",
	word: "Word",
	epub: "EPUB",
	video: "Video",
	audio: "Audio",
	html: "Text",
	unknown: "Book"
};
function kindFromExt(ext) {
	if (!ext) return "unknown";
	return EXT_KINDS[ext.toLowerCase().replace(/^\./, "")] ?? "unknown";
}
function labelForKind(kind) {
	return KIND_LABELS[kind] ?? "Book";
}
/** Map an upstream Content-Type (plus filename, for the ambiguous ones). */
function kindFromContentType(contentType, filename) {
	const ct = (contentType || "").toLowerCase();
	const byExt = kindFromExt(filename?.match(/\.([a-z0-9]+)$/i)?.[1] ?? null);
	if (byExt !== "unknown" && byExt !== "html") return byExt;
	if (ct.includes("pdf")) return "pdf";
	if (ct.includes("epub")) return "epub";
	if (ct.includes("officedocument.wordprocessing") || ct.includes("msword")) return "word";
	if (ct.startsWith("video/")) return "video";
	if (ct.startsWith("audio/")) return "audio";
	if (ct.includes("html") || ct.includes("text/plain") || byExt === "html") return "html";
	return byExt === "html" ? "html" : "unknown";
}
/**
* Classify a stored URL.
*
* A Drive link's extension is not in the URL, so `ext` stays null and the
* caller has to resolve it from the response. A `link_type` hint is honoured
* only when the URL gives us nothing better.
*/
function parseBookUrl(url, linkTypeHint) {
	const raw = (url || "").trim();
	if (!raw) return {
		kind: "unknown",
		driveId: null,
		ext: null,
		external: false,
		label: KIND_LABELS.unknown
	};
	for (const pattern of DRIVE_PATTERNS) {
		const match = raw.match(pattern);
		if (match) {
			const hint = hintKind(linkTypeHint);
			return {
				kind: hint,
				driveId: match[1],
				ext: null,
				external: true,
				label: KIND_LABELS[hint]
			};
		}
	}
	const ext = raw.split("?")[0].split("#")[0].match(/\.([A-Za-z0-9]{1,6})$/)?.[1]?.toLowerCase() ?? null;
	const kind = kindFromExt(ext);
	const resolved = kind === "unknown" ? hintKind(linkTypeHint) : kind;
	return {
		kind: resolved,
		driveId: null,
		ext,
		external: !raw.startsWith("/"),
		label: KIND_LABELS[resolved]
	};
}
/** Only trust a stored link_type for kinds a URL cannot express. */
function hintKind(linkType) {
	switch ((linkType || "").toLowerCase()) {
		case "youtube":
		case "vimeo":
		case "video": return "video";
		case "audio": return "audio";
		case "epub": return "epub";
		case "word":
		case "docx":
		case "doc": return "word";
		case "pdf": return "pdf";
		case "article":
		case "url": return "html";
		default: return "unknown";
	}
}
/** True when the reader must extract text rather than hand the file to the browser. */
function needsTextExtraction(kind) {
	return kind === "word" || kind === "epub";
}
/** Content-Type to serve a stored file with, by kind. */
function contentTypeFor(kind, ext) {
	if (kind === "pdf") return "application/pdf";
	if (kind === "word") return ext === "doc" ? "application/msword" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	if (kind === "epub") return "application/epub+zip";
	if (kind === "video") return "video/mp4";
	if (kind === "audio") return "audio/mpeg";
	if (kind === "html") return "text/plain; charset=utf-8";
	return "application/octet-stream";
}
//#endregion
//#region src/lib/mediaTicket.ts
var MEDIA_COOKIE = "wv_media";
/** The cookie is only ever sent to the media endpoint. */
var MEDIA_COOKIE_PATH = "/api/content/read/";
var TTL_SECONDS = 3600;
var KEY_LABEL = "wv-media-ticket-v1";
/**
* Derive a key dedicated to signing tickets. Deriving a labelled subkey from
* an existing secret means no new production secret has to be introduced, and
* the source secret is never itself used as a signing key.
*/
function signingKey() {
	const secret = process.env.MEDIA_TICKET_SECRET || process.env.CRON_SECRET || "";
	return crypto.createHmac("sha256", secret).update(KEY_LABEL).digest();
}
function sign(userId, exp) {
	return crypto.createHmac("sha256", signingKey()).update(`${userId}:${exp}`).digest("base64url");
}
/**
* Issue a ticket for a user, valid for an hour.
* The user id is part of the ticket because the verifier has to know whose
* signature to check — it is signed, so it cannot be swapped for another id.
*/
function issueTicket(userId, ttlSeconds = TTL_SECONDS) {
	const exp = Math.floor(Date.now() / 1e3) + ttlSeconds;
	return `${userId}.${exp}.${sign(userId, exp)}`;
}
/**
* Validate a ticket and return the user id it was issued to, or null.
* Compared in constant time so the signature can't be probed byte by byte.
*/
function verifyTicket(ticket) {
	if (!ticket) return null;
	const parts = ticket.split(".");
	if (parts.length !== 3) return null;
	const [userId, expRaw, sig] = parts;
	const exp = Number(expRaw);
	if (!userId || !Number.isFinite(exp) || exp * 1e3 < Date.now()) return null;
	const expected = sign(userId, exp);
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return null;
	if (!crypto.timingSafeEqual(a, b)) return null;
	return userId;
}
/** Read one cookie out of a request's Cookie header. */
function readCookie(cookieHeader, name) {
	if (!cookieHeader) return void 0;
	for (const part of cookieHeader.split(";")) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
	}
}
/** Build the Set-Cookie value that installs a ticket. */
function ticketCookie(ticket) {
	return [
		`${MEDIA_COOKIE}=${encodeURIComponent(ticket)}`,
		"HttpOnly",
		"Secure",
		"SameSite=Lax",
		`Path=${MEDIA_COOKIE_PATH}`,
		`Max-Age=${TTL_SECONDS}`
	].join("; ");
}
//#endregion
//#region src/lib/bookText.ts
var EOCD_SIG = 101010256;
var CD_SIG = 33639248;
var LOCAL_SIG = 67324752;
/**
* Read every member of a ZIP archive into a name → Buffer map.
* Uses the central directory because it always carries accurate sizes, even
* for entries written with streaming data descriptors.
*/
function readZip(buf) {
	const out = /* @__PURE__ */ new Map();
	let eocd = -1;
	const scanFrom = Math.max(0, buf.length - 65557);
	for (let i = buf.length - 22; i >= scanFrom; i--) if (buf.readUInt32LE(i) === EOCD_SIG) {
		eocd = i;
		break;
	}
	if (eocd === -1) throw new Error("not a zip archive");
	const entryCount = buf.readUInt16LE(eocd + 10);
	let cdOffset = buf.readUInt32LE(eocd + 16);
	if (cdOffset === 4294967295 || entryCount === 65535) {
		for (let i = eocd - 20; i >= 0; i--) if (buf.readUInt32LE(i) === 101075792) {
			cdOffset = Number(buf.readBigUInt64LE(i + 48));
			break;
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
		const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
		let size = compSize;
		if (size === 4294967295) {
			const ex = buf.subarray(p + 46 + nameLen, p + 46 + nameLen + extraLen);
			let q = 0;
			while (q + 4 <= ex.length) {
				const tag = ex.readUInt16LE(q);
				const len = ex.readUInt16LE(q + 2);
				if (tag === 1) {
					size = Number(ex.readBigUInt64LE(q + 4 + 8));
					break;
				}
				q += 4 + len;
			}
		}
		if (name && !name.endsWith("/") && localOffset && localOffset < buf.length) {
			if (buf.readUInt32LE(localOffset) === LOCAL_SIG) {
				const lNameLen = buf.readUInt16LE(localOffset + 26);
				const lExtraLen = buf.readUInt16LE(localOffset + 28);
				const dataStart = localOffset + 30 + lNameLen + lExtraLen;
				const data = buf.subarray(dataStart, dataStart + size);
				try {
					out.set(name, method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data));
				} catch {}
			}
		}
		p += 46 + nameLen + extraLen + commentLen;
	}
	return out;
}
function decodeEntities(s) {
	return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
function clean(s) {
	return decodeEntities(s).replace(/[ \t\r\n]+/g, " ").trim();
}
var HEADING = {
	heading1: "h1",
	title: "h1",
	heading2: "h2",
	subtitle: "h2",
	heading3: "h3",
	heading4: "h3",
	heading5: "h3",
	heading6: "h3",
	quote: "quote",
	intensequote: "quote"
};
/** Extract paragraphs, headings and list items from word/document.xml. */
function docxToBlocks(zip) {
	const doc = zip.get("word/document.xml");
	if (!doc) return [];
	const xml = doc.toString("utf8");
	const blocks = [];
	const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
	for (const para of paragraphs) {
		const style = (para.match(/<w:pStyle\s+w:val="([^"]+)"/)?.[1] || "").toLowerCase();
		const text = clean((para.match(/<w:t[^>]*>[\s\S]*?<\/w:t>|<w:br\s*\/>|<w:tab\s*\/>/g) || []).map((t) => {
			if (t.startsWith("<w:br")) return "\n";
			if (t.startsWith("<w:tab")) return " ";
			return t.replace(/^<w:t[^>]*>/, "").replace(/<\/w:t>$/, "");
		}).join("").split("\n").map((s) => clean(s)).join("\n"));
		if (!text) continue;
		let type = "p";
		if (HEADING[style]) type = HEADING[style];
		else if (style.includes("listbullet") || style.includes("listparagraph")) type = "li";
		else if (style.includes("listnumber")) type = "li";
		blocks.push({
			type,
			text
		});
	}
	return blocks;
}
/** Resolve an href against the directory of the referencing file. */
function resolveHref(base, href) {
	const parts = ((base.includes("/") ? base.slice(0, base.lastIndexOf("/") + 1) : "") + href.split("#")[0]).split("/");
	const stack = [];
	for (const part of parts) {
		if (part === "" || part === ".") continue;
		if (part === "..") stack.pop();
		else stack.push(part);
	}
	return stack.join("/");
}
var BLOCK_TAGS = /* @__PURE__ */ new Set([
	"p",
	"div",
	"li",
	"blockquote",
	"section",
	"article",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"ul",
	"ol",
	"td",
	"th",
	"tr",
	"table",
	"figure",
	"figcaption",
	"pre",
	"dd",
	"dt"
]);
function blockTypeFor(tag) {
	if (tag === "li" || tag === "dd" || tag === "dt") return "li";
	if (tag === "blockquote" || tag === "pre") return "quote";
	if (/^h[1-6]$/.test(tag)) {
		const n = Number(tag[1]);
		return n === 1 ? "h1" : n === 2 ? "h2" : "h3";
	}
	return "p";
}
/** Convert one XHTML document into blocks, preserving nesting and order. */
function xhtmlToBlocks(html) {
	const blocks = [];
	const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
	const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
	let current = "p";
	let buffer = "";
	let cursor = 0;
	let m;
	const flush = () => {
		const text = clean(buffer);
		if (text) blocks.push({
			type: current,
			text
		});
		buffer = "";
	};
	while (m = tagRe.exec(body)) {
		buffer += body.slice(cursor, m.index);
		cursor = tagRe.lastIndex;
		const raw = m[0];
		const tag = m[1].toLowerCase();
		if (tag === "br") {
			buffer += "\n";
			continue;
		}
		if (!BLOCK_TAGS.has(tag)) continue;
		flush();
		if (!raw.startsWith("</")) current = blockTypeFor(tag);
	}
	buffer += body.slice(cursor);
	flush();
	return blocks;
}
/** Walk EPUB spine order and return the book as blocks. */
function epubToBlocks(zip) {
	let opfPath = (zip.get("META-INF/container.xml")?.toString("utf8"))?.match(/full-path="([^"]+)"/)?.[1];
	if (!opfPath) opfPath = [...zip.keys()].find((k) => k.toLowerCase().endsWith(".opf"));
	if (!opfPath) return [];
	const opf = zip.get(opfPath)?.toString("utf8");
	if (!opf) return [];
	const manifest = /* @__PURE__ */ new Map();
	for (const item of opf.match(/<item\b[^>]*>/g) || []) {
		const id = item.match(/\bid="([^"]+)"/)?.[1];
		const href = item.match(/\bhref="([^"]+)"/)?.[1];
		if (id && href) manifest.set(id, href);
	}
	const order = ((opf.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)?.[1] ?? "").match(/<itemref\b[^>]*>/g) || []).map((ref) => ref.match(/\bidref="([^"]+)"/)?.[1]).filter((v) => Boolean(v));
	const hrefs = order.length ? order.map((id) => manifest.get(id)).filter((v) => Boolean(v)) : [...zip.keys()].filter((k) => /\.(x?html)$/i.test(k));
	const blocks = [];
	for (const href of hrefs) {
		const path = resolveHref(opfPath, href);
		const file = zip.get(path) || zip.get(decodeURIComponent(path));
		if (!file) continue;
		blocks.push(...xhtmlToBlocks(file.toString("utf8")));
	}
	return blocks;
}
/** Extract readable blocks from a .docx or .epub buffer. */
function extractBookText(buf, ext) {
	const zip = readZip(buf);
	return ext === "epub" ? epubToBlocks(zip) : docxToBlocks(zip);
}
//#endregion
//#region src/pages/api/content/read/[id].ts
var _id__exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var MAX_META_BYTES = 2 * 1024 * 1024;
var UPSTREAM_TIMEOUT_MS = 3e4;
var json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
	status,
	headers: {
		"Content-Type": "application/json",
		"Cache-Control": "private, no-store",
		...headers
	}
});
/** Refuse anything that isn't a plain public http(s) address. */
function isPublicHttpUrl(raw) {
	let u;
	try {
		u = new URL(raw);
	} catch {
		return false;
	}
	if (u.protocol !== "https:" && u.protocol !== "http:") return false;
	const host = u.hostname.toLowerCase();
	if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return false;
	if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
	if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
	if (host === "::1" || host.startsWith("[")) return false;
	return true;
}
/** Best-effort filename from an upstream Content-Disposition. */
function filenameFromDisposition(disposition) {
	if (!disposition) return null;
	const star = disposition.match(/filename\*=UTF-8''([^;]+)/i);
	if (star) try {
		return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
	} catch {}
	const plain = disposition.match(/filename="?([^";]+)"?/i);
	return plain ? plain[1].trim() : null;
}
/** Resolve a stored item to something we can actually fetch. */
function upstreamUrlFor(item) {
	const url = (item.file_url || "").trim();
	const src = parseBookUrl(url, item.link_type);
	if (src.driveId) return {
		src,
		fetchUrl: `https://drive.usercontent.google.com/download?id=${src.driveId}&export=download`,
		localPath: null
	};
	if (url.startsWith("/uploads/")) {
		const name = path.basename(url);
		const root = path.resolve(process.cwd(), "public", "uploads");
		const full = path.resolve(root, name);
		if (full.startsWith(root + path.sep) && fs.existsSync(full)) return {
			src,
			fetchUrl: null,
			localPath: full
		};
		return {
			src,
			fetchUrl: null,
			localPath: null
		};
	}
	if (isPublicHttpUrl(url)) return {
		src,
		fetchUrl: url,
		localPath: null
	};
	return {
		src,
		fetchUrl: null,
		localPath: null
	};
}
var GET = async ({ params, request }) => {
	try {
		const id = params.id;
		if (!id) return json({
			success: false,
			message: "Missing book id"
		}, 400);
		let userId = (await getAuthUser(request))?.id ?? null;
		if (!userId) userId = verifyTicket(readCookie(request.headers.get("cookie"), MEDIA_COOKIE));
		if (!userId) return json({
			success: false,
			message: "Login required"
		}, 401);
		const sql = client;
		const rows = await sql`
      SELECT id, title, author, description, file_url, link_type, content_type, is_premium
      FROM content_items
      WHERE id = ${id} AND is_published = true
      LIMIT 1
    `;
		if (!rows.length) return json({
			success: false,
			message: "Book not found"
		}, 404);
		const item = rows[0];
		if (item.is_premium) {
			if (!(await sql`
        SELECT id FROM user_content_purchases
        WHERE user_id = ${userId} AND content_id = ${item.id}
        LIMIT 1
      `).length) return json({
				success: false,
				message: "Purchase required"
			}, 403);
		}
		const { src, fetchUrl, localPath } = upstreamUrlFor(item);
		if (!fetchUrl && !localPath) return json({
			success: false,
			message: "This book has no readable file"
		}, 404);
		if (new URL(request.url).searchParams.get("mode") === "meta") {
			let kind = src.kind;
			let ext = src.ext;
			let size = null;
			try {
				if (fetchUrl) {
					const head = await fetch(fetchUrl, {
						method: "GET",
						headers: { Range: "bytes=0-0" },
						signal: AbortSignal.timeout(1e4)
					});
					const name = filenameFromDisposition(head.headers.get("content-disposition"));
					const contentType = (head.headers.get("content-type") || "").split(";")[0];
					const refined = kindFromContentType(contentType, name ?? void 0);
					if (refined !== "unknown") kind = refined;
					ext = name?.match(/\.([A-Za-z0-9]+)$/)?.[1]?.toLowerCase() ?? ext;
					const range = head.headers.get("content-range");
					size = range ? Number(range.split("/")[1]) || null : Number(head.headers.get("content-length")) || null;
				} else if (localPath) size = fs.statSync(localPath).size;
			} catch {}
			const ticket = issueTicket(userId);
			return json({
				success: true,
				id: item.id,
				title: item.title,
				author: item.author || "",
				description: item.description || "",
				kind,
				label: labelForKind(kind),
				ext,
				size,
				readable: kind !== "unknown",
				textMode: needsTextExtraction(kind)
			}, 200, { "Set-Cookie": ticketCookie(ticket) });
		}
		if (new URL(request.url).searchParams.get("mode") === "text") {
			const guessExt = (src.ext && ["docx", "epub"].includes(src.ext) ? src.ext : null) || await guessExtFromUpstream(fetchUrl) || (src.kind === "epub" ? "epub" : src.kind === "word" ? "docx" : null);
			if (!guessExt || !["docx", "epub"].includes(guessExt)) return json({
				success: false,
				message: "This book is not a readable document"
			}, 400);
			const buf = await loadBuffer(fetchUrl, localPath);
			if (!buf) return json({
				success: false,
				message: "Could not read this file"
			}, 502);
			const blocks = extractBookText(buf, guessExt);
			if (!blocks.length) return json({
				success: false,
				message: "No text could be extracted"
			}, 502);
			return json({
				success: true,
				kind: guessExt === "epub" ? "epub" : "word",
				blocks
			});
		}
		return streamFile(request, fetchUrl, localPath, src.kind, src.ext);
	} catch (error) {
		console.error("Book read error:", error.message);
		return json({
			success: false,
			message: "Could not open this book"
		}, 500);
	}
};
async function guessExtFromUpstream(fetchUrl) {
	if (!fetchUrl) return null;
	try {
		return filenameFromDisposition((await fetch(fetchUrl, {
			headers: { Range: "bytes=0-0" },
			signal: AbortSignal.timeout(1e4)
		})).headers.get("content-disposition"))?.match(/\.([A-Za-z0-9]+)$/)?.[1]?.toLowerCase() ?? null;
	} catch {
		return null;
	}
}
async function loadBuffer(fetchUrl, localPath) {
	try {
		if (localPath) return fs.readFileSync(localPath);
		if (!fetchUrl) return null;
		const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
		if (!res.ok) return null;
		const buf = Buffer.from(await res.arrayBuffer());
		return buf.length > 0 && buf.length <= MAX_META_BYTES * 20 ? buf : null;
	} catch {
		return null;
	}
}
async function streamFile(request, fetchUrl, localPath, kind, ext) {
	const range = request.headers.get("Range") || void 0;
	if (localPath) {
		const stat = fs.statSync(localPath);
		const headers = new Headers({
			"Content-Type": contentTypeFor(kind, ext),
			"Accept-Ranges": "bytes",
			"Cache-Control": "private, max-age=600"
		});
		if (range) {
			const m = range.match(/bytes=(\d*)-(\d*)/);
			const start = m?.[1] ? Number(m[1]) : 0;
			const end = m?.[2] ? Number(m[2]) : stat.size - 1;
			if (start >= stat.size) return new Response(null, {
				status: 416,
				headers: { "Content-Range": `bytes */${stat.size}` }
			});
			const slice = fs.createReadStream(localPath, {
				start,
				end
			});
			headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
			headers.set("Content-Length", String(end - start + 1));
			return new Response(slice, {
				status: 206,
				headers
			});
		}
		headers.set("Content-Length", String(stat.size));
		return new Response(fs.createReadStream(localPath), {
			status: 200,
			headers
		});
	}
	if (!fetchUrl) return new Response("Not found", { status: 404 });
	const upstream = await fetch(fetchUrl, {
		headers: range ? { Range: range } : {},
		signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
	});
	if (!upstream.ok && upstream.status !== 206) return new Response("Upstream error", { status: 502 });
	const name = filenameFromDisposition(upstream.headers.get("content-disposition"));
	const resolvedKind = kindFromContentType(upstream.headers.get("content-type") || "", name ?? void 0);
	const headers = new Headers({
		"Content-Type": resolvedKind !== "unknown" ? contentTypeFor(resolvedKind, ext) : "application/octet-stream",
		"Accept-Ranges": "bytes",
		"Cache-Control": "private, max-age=600",
		"Content-Disposition": `inline${name ? `; filename="${name.replace(/"/g, "")}"` : ""}`
	});
	for (const h of ["content-length", "content-range"]) {
		const v = upstream.headers.get(h);
		if (v) headers.set(h, v);
	}
	return new Response(upstream.body, {
		status: upstream.status,
		headers
	});
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/content/read/[id]@_@ts
var page = () => _id__exports;
//#endregion
export { page };
