import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_BinlbIW5.mjs";
import "./db_BfPNFMjW.mjs";
import { t as createNotification } from "./notifications_Cti0wzLw.mjs";
import { a as parseImageUrls, i as TEMPLATE_IDS, n as ADVERT_TEMPLATES, t as ADVERT_LIMITS } from "./advertTemplates_BOjXxPdH.mjs";
import { a as rateLimitResponse, r as clientIp, t as checkRateLimit } from "./rate-limit_L6PcAWgd.mjs";
import { t as getAuthUser } from "./auth_Cqxo1lyi.mjs";
import fs from "fs";
import path from "path";
//#region src/pages/api/user/adverts.ts
var adverts_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	PATCH: () => PATCH,
	POST: () => POST,
	prerender: () => false
});
/** Naive but effective tag stripper for free-text advert fields (defense-in-depth). */
function stripTags(s) {
	return s.replace(/<[^>]*>?/g, "");
}
var GET = async ({ request }) => {
	try {
		const user = await getAuthUser(request);
		if (!user) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const mine = await sql`
      SELECT id, template, headline, business_name, description,
             contact_phone, location, whatsapp, image_urls,
             status, rejection_reason, created_at, view_count,
             is_official, sold
      FROM user_business_adverts
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `;
		const todayRow = await sql`
      SELECT COUNT(*)::int AS c
      FROM user_business_adverts
      WHERE user_id = ${user.id} AND created_date = CURRENT_DATE
        AND is_official = false
    `;
		const adverts = (mine || []).map((a) => ({
			id: a.id,
			template: a.template,
			headline: a.headline,
			businessName: a.business_name,
			description: a.description || "",
			contactPhone: a.contact_phone || "",
			location: a.location || "",
			whatsapp: a.whatsapp || "",
			images: parseImageUrls(a.image_urls),
			status: a.status,
			rejectionReason: a.rejection_reason || "",
			createdAt: a.created_at,
			viewCount: a.view_count || 0,
			isOfficial: a.is_official || false,
			sold: a.sold || false
		}));
		return new Response(JSON.stringify({
			success: true,
			templates: ADVERT_TEMPLATES,
			limits: ADVERT_LIMITS,
			submittedToday: (todayRow[0]?.c || 0) > 0,
			adverts
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("User adverts GET error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to load adverts"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var POST = async ({ request }) => {
	try {
		const rl = checkRateLimit(`adverts:${clientIp(request)}`, 5, 3600 * 1e3);
		if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);
		const user = await getAuthUser(request);
		if (!user) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		if ((await sql`
      SELECT id FROM user_business_adverts
      WHERE user_id = ${user.id} AND created_date = CURRENT_DATE
      LIMIT 1
    `).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "You already submitted an advert today. Come back tomorrow — one advert per day."
		}), {
			status: 429,
			headers: { "Content-Type": "application/json" }
		});
		const form = await request.formData();
		const template = String(form.get("template") || "").trim();
		const headline = stripTags(String(form.get("headline") || "").trim()).slice(0, 120);
		const businessName = stripTags(String(form.get("businessName") || "").trim()).slice(0, 100);
		const description = stripTags(String(form.get("description") || "").trim());
		const contactPhone = stripTags(String(form.get("contactPhone") || "").trim()).slice(0, 40);
		const whatsapp = stripTags(String(form.get("whatsapp") || "").trim()).slice(0, 40);
		const location = stripTags(String(form.get("location") || "").trim()).slice(0, 150);
		if (!TEMPLATE_IDS.includes(template)) return new Response(JSON.stringify({
			success: false,
			message: "Please choose a valid template"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!headline || !businessName) return new Response(JSON.stringify({
			success: false,
			message: "Headline and business name are required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const files = form.getAll("images").filter((f) => f instanceof File && f.size > 0);
		if (files.length > ADVERT_LIMITS.maxImages) {
			console.warn(`Advert rejected: ${files.length} images (max ${ADVERT_LIMITS.maxImages})`);
			return new Response(JSON.stringify({
				success: false,
				message: `Maximum ${ADVERT_LIMITS.maxImages} images`
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" }
			});
		}
		const uploadDir = path.join(process.cwd(), "public", "uploads", "adverts");
		if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
		const accepted = [];
		for (const file of files) {
			if (file.size > ADVERT_LIMITS.maxImageBytes) {
				console.warn(`Advert image rejected: ${file.size} bytes (${file.type || "unknown type"}, name: ${file.name?.slice(0, 60)})`);
				return new Response(JSON.stringify({
					success: false,
					message: "Each image must be under 5MB"
				}), {
					status: 400,
					headers: { "Content-Type": "application/json" }
				});
			}
			const buf = Buffer.from(await file.arrayBuffer());
			const kind = sniffImageType(buf);
			if (!kind) {
				console.warn(`Advert image rejected: bad magic bytes (claimed type: ${file.type || "unknown"}, name: ${file.name?.slice(0, 60)})`);
				return new Response(JSON.stringify({
					success: false,
					message: "Only JPG, PNG or WebP images are allowed"
				}), {
					status: 400,
					headers: { "Content-Type": "application/json" }
				});
			}
			accepted.push({
				buf,
				kind
			});
		}
		const imageUrls = [];
		const written = [];
		try {
			for (const { buf, kind } of accepted) {
				const filename = `ad_${user.id.slice(0, 8)}_${Date.now()}_${imageUrls.length}.${kind}`;
				fs.writeFileSync(path.join(uploadDir, filename), buf);
				written.push(filename);
				imageUrls.push(`/uploads/adverts/${filename}`);
			}
		} catch {
			for (const f of written) try {
				fs.unlinkSync(path.join(uploadDir, f));
			} catch {}
			return new Response(JSON.stringify({
				success: false,
				message: "Could not save images"
			}), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}
		try {
			const inserted = await sql`
        INSERT INTO user_business_adverts
          (user_id, template, headline, business_name, description,
           contact_phone, location, whatsapp, image_urls, status, created_date)
        VALUES
          (${user.id}, ${template}, ${headline}, ${businessName}, ${description || null},
           ${contactPhone || null}, ${location || null}, ${whatsapp || null},
           ${JSON.stringify(imageUrls)}, 'pending', CURRENT_DATE)
        RETURNING id
      `;
			await createNotification({
				userId: user.id,
				type: "advert_submitted",
				title: "Advert submitted for review",
				message: "Your business advert was received and is waiting for admin approval. You will be notified once it is reviewed."
			});
			return new Response(JSON.stringify({
				success: true,
				message: "Advert submitted! It will be reviewed by admin before appearing to other users.",
				id: inserted[0]?.id
			}), {
				status: 201,
				headers: { "Content-Type": "application/json" }
			});
		} catch (e) {
			for (const f of written) try {
				fs.unlinkSync(path.join(uploadDir, f));
			} catch {}
			if (String(e?.message || "").includes("user_adverts_one_per_day_idx")) return new Response(JSON.stringify({
				success: false,
				message: "You already submitted an advert today."
			}), {
				status: 429,
				headers: { "Content-Type": "application/json" }
			});
			throw e;
		}
	} catch (error) {
		console.error("User adverts POST error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to submit advert"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
/** Sniff image type from magic bytes — never trust the client-supplied MIME. */
function sniffImageType(buf) {
	if (buf.length < 12) return null;
	if (buf[0] === 255 && buf[1] === 216 && buf[2] === 255) return "jpg";
	if (buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71) return "png";
	if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "webp";
	return null;
}
var PATCH = async ({ request }) => {
	try {
		const user = await getAuthUser(request);
		if (!user) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const body = await request.json().catch(() => ({}));
		const id = typeof body?.id === "string" ? body.id : "";
		const action = typeof body?.action === "string" ? body.action : "";
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || ![
			"delete",
			"mark-sold",
			"mark-available"
		].includes(action)) return new Response(JSON.stringify({
			success: false,
			message: "Valid id and action required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		const rows = await sql`
      SELECT id, image_urls, sold, user_id FROM user_business_adverts
      WHERE id = ${id} LIMIT 1
    `;
		if (rows.length === 0 || rows[0].user_id !== user.id) return new Response(JSON.stringify({
			success: false,
			message: "Advert not found"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const advert = rows[0];
		if (action === "delete") {
			await sql`DELETE FROM user_business_adverts WHERE id = ${id}`;
			const uploadDir = path.join(process.cwd(), "public", "uploads", "adverts");
			for (const u of parseImageUrls(advert.image_urls)) {
				const fname = path.basename(u);
				if (/^ad_[a-f0-9]{8}_[0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i.test(fname)) try {
					fs.unlinkSync(path.join(uploadDir, fname));
				} catch {}
			}
			return new Response(JSON.stringify({
				success: true,
				message: "Advert deleted"
			}), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		const sold = action === "mark-sold";
		if (advert.sold === sold) return new Response(JSON.stringify({
			success: true,
			message: sold ? "Already marked sold" : "Already marked available"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
		await sql`UPDATE user_business_adverts SET sold = ${sold} WHERE id = ${id}`;
		return new Response(JSON.stringify({
			success: true,
			message: sold ? "Advert marked as sold" : "Advert marked as available"
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("User adverts PATCH error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to update advert"
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/user/adverts@_@ts
var page = () => adverts_exports;
//#endregion
export { page };
