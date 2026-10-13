import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { t as client } from "./connection_B4Gof3ME.mjs";
import "./db_Bl6tw7zK.mjs";
import { n as fetchVideoMeta, t as detectVideoPlatform } from "./video-meta_C86-YQ6N.mjs";
import { t as isAuthorizedUser } from "./auth-check_CHLkWxRW.mjs";
//#region src/pages/api/earn/watch/index.ts
var watch_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
async function getConfigValue(sql, key, fallback) {
	try {
		return (await sql`SELECT config_value FROM platform_config WHERE config_key = ${key}`)[0]?.config_value || fallback;
	} catch {
		return fallback;
	}
}
async function ensureAutoContent(sql) {
	try {
		if (await getConfigValue(sql, "auto_content_enabled", "true") === "false") return;
		const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		const max = Math.min(parseInt(await getConfigValue(sql, "auto_content_max", "7")) || 7, 7);
		const urls = (await getConfigValue(sql, "auto_content_urls", "")).split("\n").map((u) => u.trim()).filter((u) => u.startsWith("http"));
		if (urls.length === 0) return;
		await sql.begin(async (tx) => {
			if ((await tx`SELECT config_value FROM platform_config WHERE config_key = 'auto_content_last_run'`)[0]?.config_value === todayStr) return;
			const todayCount = await tx`SELECT COUNT(*) as c FROM sponsored_content WHERE created_at >= CURRENT_DATE`;
			if (parseInt(todayCount[0]?.c || "0") > 0) {
				await tx`
          INSERT INTO platform_config (config_key, config_value, updated_at)
          VALUES ('auto_content_last_run', ${todayStr}, NOW())
          ON CONFLICT (config_key) DO UPDATE SET config_value = ${todayStr}, updated_at = NOW()
        `;
				return;
			}
			const rewardMin = parseInt(await getConfigValue(sql, "auto_content_reward_min", "1000")) || 1e3;
			const rewardMax = parseInt(await getConfigValue(sql, "auto_content_reward_max", "2300")) || 2300;
			const picked = urls.slice(0, max);
			let order = 1e3;
			for (const link of picked) {
				const detected = detectVideoPlatform(link);
				const meta = await fetchVideoMeta(link, detected !== "unknown" ? detected : void 0);
				const title = meta?.title || `Watch & Earn Video`;
				const thumbnail = meta?.thumbnail || "";
				const platform = meta?.platform || detected || "youtube";
				await tx`
          INSERT INTO sponsored_content (
            title, description, content_type, sponsor_name,
            reward_amount, duration_seconds, external_link,
            video_platform, thumbnail_url, is_active, display_order
          ) VALUES (
            ${title},
            'Auto-uploaded content — watch to earn rewards.',
            'video', 'Auto Content',
            ${Math.max(rewardMin, Math.min(rewardMax, Math.floor(Math.random() * (rewardMax - rewardMin + 1)) + rewardMin))}, 90, ${link},
            ${platform}, ${thumbnail}, true, ${order}
          )
        `;
				order++;
			}
			await tx`
        INSERT INTO platform_config (config_key, config_value, updated_at)
        VALUES ('auto_content_last_run', ${todayStr}, NOW())
        ON CONFLICT (config_key) DO UPDATE SET config_value = ${todayStr}, updated_at = NOW()
      `;
		});
	} catch (e) {
		console.error("Auto-content fallback error:", e);
	}
}
var GET = async ({ request }) => {
	try {
		const userId = new URL(request.url).searchParams.get("userId");
		if (!userId) return new Response(JSON.stringify({
			success: false,
			message: "User ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		await ensureAutoContent(sql);
		let hasVideoPlatform = false;
		try {
			hasVideoPlatform = (await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sponsored_content' 
        AND column_name = 'video_platform'
      `).length > 0;
		} catch (e) {
			console.log("⚠️ Could not check video_platform column");
		}
		let content;
		if (hasVideoPlatform) content = await sql`
        SELECT 
          sc.id, 
          sc.title, 
          sc.description, 
          sc.content_type, 
          sc.sponsor_name, 
          sc.reward_amount, 
          sc.duration_seconds, 
          sc.external_link, 
          sc.file_url,
          sc.thumbnail_url,
          sc.video_platform,
          sc.is_active,
          sc.created_at,
          EXISTS (
            SELECT 1 FROM user_sponsored_views usv 
            WHERE usv.content_id = sc.id 
            AND usv.user_id = ${userId}
            AND usv.watched_date = CURRENT_DATE
          ) as is_watched
        FROM sponsored_content sc
        WHERE sc.is_active = true 
        ORDER BY sc.display_order, sc.created_at DESC
        LIMIT 50
      `;
		else content = await sql`
        SELECT 
          sc.id, 
          sc.title, 
          sc.description, 
          sc.content_type, 
          sc.sponsor_name, 
          sc.reward_amount, 
          sc.duration_seconds, 
          sc.external_link, 
          sc.file_url,
          sc.thumbnail_url,
          sc.is_active,
          sc.created_at,
          EXISTS (
            SELECT 1 FROM user_sponsored_views usv 
            WHERE usv.content_id = sc.id 
            AND usv.user_id = ${userId}
            AND usv.watched_date = CURRENT_DATE
          ) as is_watched
        FROM sponsored_content sc
        WHERE sc.is_active = true 
        ORDER BY sc.display_order, created_at DESC
        LIMIT 50
      `;
		const todayStats = await sql`
      SELECT 
        COUNT(*) as watched_count,
        COALESCE(SUM(reward_earned), 0) as total_earned
      FROM user_sponsored_views 
      WHERE user_id = ${userId} 
      AND watched_date = CURRENT_DATE
    `;
		return new Response(JSON.stringify({
			success: true,
			content: content || [],
			todayStats: {
				watchedCount: parseInt(todayStats[0]?.watched_count || "0"),
				totalEarned: parseFloat(todayStats[0]?.total_earned || "0")
			}
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		console.error("Earn watch GET error:", error);
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to load tasks. Please try again."
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
var POST = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const { userId, contentId } = JSON.parse(rawBody);
		if (!userId || !contentId) return new Response(JSON.stringify({
			success: false,
			message: "User ID and content ID required"
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		if (!await isAuthorizedUser(request, userId)) return new Response(JSON.stringify({
			success: false,
			message: "Unauthorized"
		}), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
		const sql = client;
		if ((await sql`
      SELECT id FROM user_sponsored_views 
      WHERE user_id = ${userId} 
      AND content_id = ${contentId}
      AND watched_date = CURRENT_DATE
    `).length > 0) return new Response(JSON.stringify({
			success: false,
			message: "You already earned reward for this content today"
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		const content = await sql`
      SELECT id, reward_amount, title FROM sponsored_content 
      WHERE id = ${contentId} AND is_active = true
    `;
		if (content.length === 0) return new Response(JSON.stringify({
			success: false,
			message: "Content not found or inactive"
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		const reward = parseFloat(content[0].reward_amount || "50");
		await sql.begin(async (tx) => {
			if ((await tx`
        INSERT INTO user_sponsored_views (
          user_id, 
          content_id, 
          reward_earned,
          watched_date
        ) VALUES (
          ${userId}, 
          ${contentId}, 
          ${reward}, 
          CURRENT_DATE
        )
        ON CONFLICT (user_id, content_id, watched_date) DO NOTHING
        RETURNING id
      `).length === 0) throw new Error("You already earned reward for this content today");
			let wallet = await tx`
        SELECT id, balance_available, gross_earnings, gross_earnings_total, store_credit 
        FROM wallets WHERE user_id = ${userId}
      `;
			if (wallet.length === 0) {
				await tx`
          INSERT INTO wallets (user_id, balance_available, gross_earnings, gross_earnings_total, store_credit)
          VALUES (${userId}, 0, 0, 0, 0)
        `;
				wallet = await tx`
          SELECT id, balance_available, gross_earnings, gross_earnings_total, store_credit 
          FROM wallets WHERE user_id = ${userId}
        `;
			}
			const currentStoreCredit = parseFloat(wallet[0].store_credit || 0);
			const currentGross = parseFloat(wallet[0].gross_earnings || 0);
			const currentGrossTotal = parseFloat(wallet[0].gross_earnings_total || 0);
			const newStoreCredit = currentStoreCredit + reward;
			await tx`
        UPDATE wallets 
        SET 
          store_credit = ${newStoreCredit}, 
          gross_earnings = ${currentGross + reward}, 
          gross_earnings_total = ${currentGrossTotal + reward}, 
          updated_at = NOW() 
        WHERE id = ${wallet[0].id}
      `;
			await tx`
        INSERT INTO transactions (
          wallet_id, 
          transaction_type, 
          amount, 
          balance_before, 
          balance_after, 
          description
        ) VALUES (
          ${wallet[0].id}, 
          'earn_watch', 
          ${reward}, 
          ${currentStoreCredit}, 
          ${newStoreCredit}, 
          ${"Earn & Watch: " + content[0].title}
        )
      `;
			await tx`
        UPDATE users 
        SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + ${reward},
            total_net_earnings = COALESCE(total_net_earnings, 0) + ${reward}
        WHERE id = ${userId}
      `;
		});
		return new Response(JSON.stringify({
			success: true,
			message: `🎉 Earned MWK ${reward}! This has been added to your Learning Wallet (Store Credit).`,
			reward
		}), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch (error) {
		const err = error;
		const msg = err.message || "";
		console.error("Earn watch POST error:", err);
		if (msg.includes("duplicate key") || msg.includes("already earned") || msg.includes("UNIQUE constraint")) return new Response(JSON.stringify({
			success: false,
			message: "You already earned the reward for this content today. Try again tomorrow."
		}), {
			status: 409,
			headers: { "Content-Type": "application/json" }
		});
		if (msg.includes("foreign key") || msg.includes("violates") || msg.includes("user_sponsored_views_content_id_fkey")) return new Response(JSON.stringify({
			success: false,
			message: "This content is no longer available. Please try a different task."
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
		if (msg.includes("not-null") || msg.includes("null value")) return new Response(JSON.stringify({
			success: false,
			message: "Something went wrong with this task. Please try again."
		}), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
		return new Response(JSON.stringify({
			success: false,
			message: "Failed to claim reward. Please try again."
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/earn/watch/index@_@ts
var page = () => watch_exports;
//#endregion
export { page };
