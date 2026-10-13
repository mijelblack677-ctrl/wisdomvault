export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';
import { fetchVideoMeta, detectVideoPlatform } from '@lib/video-meta';

// ============================================================
// AUTO-CONTENT FALLBACK
// If the admin hasn't uploaded any new content today, the system
// automatically uploads up to `auto_content_max` items from the
// YouTube URL pool stored in platform_config (`auto_content_urls`),
// so users always have fresh content to earn from.
// ============================================================

async function getConfigValue(sql: any, key: string, fallback: string): Promise<string> {
  try {
    const rows = await sql`SELECT config_value FROM platform_config WHERE config_key = ${key}`;
    return rows[0]?.config_value || fallback;
  } catch {
    return fallback;
  }
}

// If the admin hasn't uploaded content today, auto-create up to `max` items
// from the configured YouTube URL pool. Safe to call on every request — the
// per-day marker makes it run at most once per day.
async function ensureAutoContent(sql: any): Promise<void> {
  try {
    const enabled = await getConfigValue(sql, 'auto_content_enabled', 'true');
    if (enabled === 'false') return;

    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const max = Math.min(parseInt(await getConfigValue(sql, 'auto_content_max', '7')) || 7, 7);

    const urlsRaw = await getConfigValue(sql, 'auto_content_urls', '');
    const urls = urlsRaw.split('\n').map((u: string) => u.trim()).filter((u: string) => u.startsWith('http'));
    if (urls.length === 0) return;

    await sql.begin(async (tx: any) => {
      // Already ran today?
      const marker = await tx`SELECT config_value FROM platform_config WHERE config_key = 'auto_content_last_run'`;
      if (marker[0]?.config_value === todayStr) return;

      // Did the admin upload content today? If so, no fallback needed.
      const todayCount = await tx`SELECT COUNT(*) as c FROM sponsored_content WHERE created_at >= CURRENT_DATE`;
      if (parseInt(todayCount[0]?.c || '0') > 0) {
        await tx`
          INSERT INTO platform_config (config_key, config_value, updated_at)
          VALUES ('auto_content_last_run', ${todayStr}, NOW())
          ON CONFLICT (config_key) DO UPDATE SET config_value = ${todayStr}, updated_at = NOW()
        `;
        return;
      }

      // Auto-create up to `max` items from the URL pool.
      // Each video pays a random reward between the configured minimum (default
      // 1,000 MWK) and maximum (default 2,300 MWK) so auto content is worth
      // watching — the old flat 50 MWK made these tasks worthless.
      const rewardMin = parseInt(await getConfigValue(sql, 'auto_content_reward_min', '1000')) || 1000;
      const rewardMax = parseInt(await getConfigValue(sql, 'auto_content_reward_max', '2300')) || 2300;
      const picked = urls.slice(0, max);
      let order = 1000;
      for (const link of picked) {
        const detected = detectVideoPlatform(link);
        const meta = await fetchVideoMeta(link, detected !== 'unknown' ? detected : undefined);
        const title = meta?.title || `Watch & Earn Video`;
        const thumbnail = meta?.thumbnail || '';
        const platform = meta?.platform || detected || 'youtube';
        const reward = Math.max(rewardMin, Math.min(rewardMax, Math.floor(Math.random() * (rewardMax - rewardMin + 1)) + rewardMin));
        await tx`
          INSERT INTO sponsored_content (
            title, description, content_type, sponsor_name,
            reward_amount, duration_seconds, external_link,
            video_platform, thumbnail_url, is_active, display_order
          ) VALUES (
            ${title},
            'Auto-uploaded content — watch to earn rewards.',
            'video', 'Auto Content',
            ${reward}, 90, ${link},
            ${platform}, ${thumbnail}, true, ${order}
          )
        `;
        order++;
      }

      // Mark today as handled
      await tx`
        INSERT INTO platform_config (config_key, config_value, updated_at)
        VALUES ('auto_content_last_run', ${todayStr}, NOW())
        ON CONFLICT (config_key) DO UPDATE SET config_value = ${todayStr}, updated_at = NOW()
      `;
    });
  } catch (e) {
    console.error('Auto-content fallback error:', e);
  }
}

// ============================================================
// GET - Fetch sponsored content for user
// ============================================================
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user exists
    const userExists = await isAuthorizedUser(request, userId);
    if (!userExists) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Auto-content fallback: guarantee users always have content to earn from
    await ensureAutoContent(sql);

    // ✅ Check if video_platform column exists
    let hasVideoPlatform = false;
    try {
      const colCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sponsored_content' 
        AND column_name = 'video_platform'
      `;
      hasVideoPlatform = colCheck.length > 0;
    } catch (e) {
      console.log('⚠️ Could not check video_platform column');
    }

    // Get all active sponsored content
    let content;
    if (hasVideoPlatform) {
      content = await sql`
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
    } else {
      content = await sql`
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
    }

    // Get today's stats
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
        watchedCount: parseInt(todayStats[0]?.watched_count || '0'),
        totalEarned: parseFloat(todayStats[0]?.total_earned || '0')
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Earn watch GET error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to load tasks. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// ============================================================
// POST - Claim reward for watching content
// ============================================================
export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { userId, contentId } = body;

    if (!userId || !contentId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID and content ID required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user exists
    const userExists = await isAuthorizedUser(request, userId);
    if (!userExists) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Check if already watched today
    const existing = await sql`
      SELECT id FROM user_sponsored_views 
      WHERE user_id = ${userId} 
      AND content_id = ${contentId}
      AND watched_date = CURRENT_DATE
    `;

    if (existing.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You already earned reward for this content today' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get content details
    const content = await sql`
      SELECT id, reward_amount, title FROM sponsored_content 
      WHERE id = ${contentId} AND is_active = true
    `;

    if (content.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Content not found or inactive' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reward = parseFloat(content[0].reward_amount || '50');

    // Use transaction to ensure everything is atomic
    await sql.begin(async (tx: any) => {
      // 1. Record the view using INSERT ... ON CONFLICT DO NOTHING
      // This prevents duplicate key errors from race conditions
      const viewResult = await tx`
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
      `;

      // If no row was inserted (conflict occurred), return early with appropriate message
      if (viewResult.length === 0) {
        throw new Error('You already earned reward for this content today');
      }

      // 2. Get or create wallet
      let wallet = await tx`
        SELECT id, balance_available, gross_earnings, gross_earnings_total, store_credit 
        FROM wallets WHERE user_id = ${userId}
      `;

      if (wallet.length === 0) {
        // Create wallet with all fields set to 0
        await tx`
          INSERT INTO wallets (user_id, balance_available, gross_earnings, gross_earnings_total, store_credit)
          VALUES (${userId}, 0, 0, 0, 0)
        `;
        wallet = await tx`
          SELECT id, balance_available, gross_earnings, gross_earnings_total, store_credit 
          FROM wallets WHERE user_id = ${userId}
        `;
      }

      // 3. Calculate new balances
      const currentStoreCredit = parseFloat(wallet[0].store_credit || 0);
      const currentGross = parseFloat(wallet[0].gross_earnings || 0);
      const currentGrossTotal = parseFloat(wallet[0].gross_earnings_total || 0);

      // ✅ Add reward to store_credit
      const newStoreCredit = currentStoreCredit + reward;
      const newGross = currentGross + reward;
      const newGrossTotal = currentGrossTotal + reward;

      // 4. Update wallet - ADD TO STORE_CREDIT
      await tx`
        UPDATE wallets 
        SET 
          store_credit = ${newStoreCredit}, 
          gross_earnings = ${newGross}, 
          gross_earnings_total = ${newGrossTotal}, 
          updated_at = NOW() 
        WHERE id = ${wallet[0].id}
      `;

      // 5. Record transaction (tracking store_credit change)
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
          ${'Earn & Watch: ' + content[0].title}
        )
      `;

      // 6. Update user totals
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
      reward: reward
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    const msg = err.message || '';
    console.error('Earn watch POST error:', err);
    
    // Duplicate key / already watched today
    if (msg.includes('duplicate key') || msg.includes('already earned') || msg.includes('UNIQUE constraint')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You already earned the reward for this content today. Try again tomorrow.' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Foreign key violation — content was deleted or doesn't exist
    if (msg.includes('foreign key') || msg.includes('violates') || msg.includes('user_sponsored_views_content_id_fkey')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'This content is no longer available. Please try a different task.' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Not-null constraint — missing required data
    if (msg.includes('not-null') || msg.includes('null value')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Something went wrong with this task. Please try again.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Failed to claim reward. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
