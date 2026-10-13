#!/usr/bin/env node
/**
 * Mobile preview harness for the VaultPro panel.
 * - Serves no traffic: stubs all /api/* responses in the page via request interception,
 *   so the panel renders fully logged-in with realistic data.
 * - Tests at 390x844 (iPhone-ish) and 768x1024 (tablet edge).
 * - Screenshots go to /tmp: vp-mobile-login.png, vp-mobile-dashboard.png,
 *   vp-mobile-drawer.png, vp-mobile-users.png, vp-tablet-dashboard.png
 */
import puppeteer from 'puppeteer-core';

const URL = 'http://localhost:4321/vaultpro';
const CHROME = '/usr/bin/google-chrome';

const stubJson = (obj) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(obj),
});

const user = (i, extra = {}) => ({
  id: `00000000-0000-4000-8000-00000000000${i}`,
  full_name: `Test User ${i}`,
  email: `user${i}@example.com`,
  phone: `+26599${String(1000000 + i)}`,
  referral_code: `TV${String(i).padStart(6, '0')}`,
  payment_status: i % 2 === 0 ? 'verified' : 'pending',
  is_active: i % 3 !== 0,
  balance_available: 12500 * i,
  ...extra,
});

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  });

  const issues = [];
  const consoleErrors = [];

  const runViewport = async ({ width, height, label }) => {
    const page = await browser.newPage();
    await page.setViewport({ width, height, isMobile: width < 768, hasTouch: width < 768 });
    // Bypass the site service worker so page-level request interception sees
    // every API call (an active SW can swallow requests, letting them hit the
    // real dev server which has no DATABASE_URL -> 500s in the preview).
    await page.setBypassServiceWorker(true).catch(() => {});

    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`[${label}] ${m.text()}`); });
    page.on('pageerror', (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));

    // -- 1. Login screen -----------------------------------------------
    // Neutralize the site service worker first: it caches every GET and its
    // activation cycle wipes localStorage on reload in headless runs, which
    // would clear our stub token before boot() sees it.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = req.url();
      if (!u.includes('/sw.js')) { /* fallthrough */ }
      if (u.includes('/sw.js')) return req.respond({ status: 200, contentType: 'text/javascript', body: 'self.registration.unregister();' });
      if (!u.includes('/api/')) return req.continue();
      if (u.includes('/api/vaultpro/me')) {
        return req.respond(stubJson({ success: true, admin: { username: 'miraculous', role: 'super_admin' } }));
      }
      if (u.includes('/api/vaultpro/users')) {
        return req.respond(stubJson({ success: true, users: [user(1), user(2), user(3), user(4), user(5)], total: 5 }));
      }
      if (u.includes('/api/vaultpro/unverified')) {
        return req.respond(stubJson({ success: true, count: 2, users: [user(1), user(2)] }));
      }
      if (u.includes('/api/vaultpro/referral-tree')) {
        return req.respond(stubJson({
          success: true, user: user(1), upline: [],
          downlineCount: 2, downline: [user(2), user(3)], level2: [user(4)],
        }));
      }
      if (u.includes('/api/vaultpro/referrals')) {
        return req.respond(stubJson({
          success: true, total: 2,
          stats: [{ referral_type: 'first_level', count: 30, paid_count: 28, total_paid: 196000 }],
          referrals: [
            { referrer_name: 'Alice Phiri', referred_name: 'Test User 2', referral_type: 'first_level', bonus_amount: 7000, is_paid: true, created_at: '2026-09-01' },
            { referrer_name: 'John Banda', referred_name: 'Test User 3', referral_type: 'second_level', bonus_amount: 1000, is_paid: false, created_at: '2026-09-02' },
          ],
        }));
      }
      if (u.includes('/api/vaultpro/referral-diagnose')) {
        return req.respond(stubJson({ success: true, missingCount: 1, missing: [{ referral_code: 'TV000001' }], level: 1, firstLevelCount: 30 }));
      }
      if (u.includes('/api/admin/withdrawals')) {
        return req.respond(stubJson({
          success: true,
          withdrawals: [
            { id: 'w1', full_name: 'Test User 1', email: 'user1@example.com', amount_requested: 25000, withdrawal_fee: 500, status: 'pending', payment_method: 'airtel_money', requested_at: '2026-09-05' },
            { id: 'w2', full_name: 'Test User 2', email: 'user2@example.com', amount_requested: 10000, withdrawal_fee: 300, status: 'completed', payment_method: 'tnm_mpamba', requested_at: '2026-09-04' },
          ],
        }));
      }
      if (u.includes('/api/admin/payment-proofs')) {
        return req.respond(stubJson({
          success: true,
          proofs: [
            { id: 'p1', user_id: 'u1', pack_id: 'pk1', user_name: 'Test User 1', pack_name: 'Business Pack', status: 'pending', created_at: '2026-09-05' },
          ],
        }));
      }
      if (u.includes('/api/vaultpro/admins')) {
        return req.respond(stubJson({ success: true, admins: [{ id: 'a1', username: 'vaultpro', email: 'administration@wisdomvault.com', role: 'super_admin', is_active: true, created_at: '2026-07-01' }] }));
      }
      if (u.includes('/api/vaultpro/user?')) {
        return req.respond(stubJson({ success: true, user: user(1), upline: [], downline: [user(2)], transactions: [], referrals: [] }));
      }
      if (u.includes('/api/admin/stats')) {
        return req.respond(stubJson({ success: true, stats: {} }));
      }
      if (u.includes('/api/admin/system-stats')) {
        return req.respond(stubJson({
          success: true,
          stats: {
            users: { total: 1240, verified: 980, pending: 260, todayRegistrations: 18, weekRegistrations: 137 },
            revenue: { totalCollected: 13392000, successfulPayments: 1240 },
            withdrawals: { pending: { count: 12, totalRequested: 480000 }, completed: { count: 640, totalPaid: 5210000 } },
            wallets: { totalUserBalances: 7350000, totalWallets: 1240, totalWithdrawn: 5210000, totalFeesPaid: 88000 },
            referrals: [{ type: 'first_level', count: 980, paidCount: 910, totalPaid: 6370000 }],
          },
        }));
      }
      if (u.includes('/api/admin/financial-overview')) {
        return req.respond(stubJson({
          success: true,
          stats: {
            paychangu: { mainBalance: 6120000, collectionBalance: 940000 },
            profit: { net: 1740000, margin: 13 },
          },
        }));
      }
      return req.respond(stubJson({ success: false, message: 'stubbed: not implemented' }));
    });

    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    });
    await page.screenshot({ path: `/tmp/vp-${label}-login.png` });

    // -- 2. Inject token + reload so boot() renders the shell ------------
    await page.evaluate(() => localStorage.setItem('vaultpro_token', 'stub-token'));
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#vp-menu-btn', { timeout: 10000 });
    await page.waitForSelector('.vp-grid-4', { timeout: 10000 }).catch(() => {
      issues.push(`[${label}] dashboard grid (.vp-grid-4) never rendered`);
    });
    await page.screenshot({ path: `/tmp/vp-${label}-dashboard.png` });

    // -- 3. Horizontal overflow check ------------------------------------
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 2) {
      const culprits = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll('*'))
          .filter((el) => el.getBoundingClientRect().right > vw + 2 || el.getBoundingClientRect().left < -2)
          .slice(0, 6)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
      });
      issues.push(`[${label}] horizontal overflow of ${overflow}px — culprits: ${culprits.join(', ')}`);
    }

    // -- 4. Hamburger visibility + drawer toggle -------------------------
    const menu = await page.$('#vp-menu-btn');
    if (!menu) {
      issues.push(`[${label}] #vp-menu-btn missing`);
    } else if (width < 768) {
      // Only mobile requires the button to be visible; desktop must hide it
      // (asserted in the else-branch below).
      const visible = await menu.boundingBox();
      if (!visible || visible.width === 0) issues.push(`[${label}] #vp-menu-btn not visible`);
    }

    if (width < 768) {
      await page.click('#vp-menu-btn');
      await page.waitForSelector('.vp-sidebar--open', { timeout: 5000 }).catch(() => {
        issues.push(`[${label}] sidebar did not open on hamburger click`);
      });
      await new Promise((r) => setTimeout(r, 600)); // let the 250ms slide finish before measuring
      await page.screenshot({ path: `/tmp/vp-mobile-drawer.png` });
      const sidebarBox = await (await page.$('#vp-sidebar')).boundingBox();
      if (sidebarBox && sidebarBox.x < -5) issues.push(`[${label}] drawer still offscreen after open (x=${sidebarBox.x})`);
      if (sidebarBox && sidebarBox.width > width * 0.92) issues.push(`[${label}] drawer wider than 92vw (${Math.round(sidebarBox.width)}px)`);

      // backdrop visible?
      const backdropShown = await page.$eval('#vp-backdrop', (el) => getComputedStyle(el).display !== 'none');
      if (!backdropShown) issues.push(`[${label}] backdrop not shown while drawer open`);

      // nav link tap targets
      const smallTaps = await page.$$eval('.vp-nav-link', (els) =>
        els.filter((el) => el.getBoundingClientRect().height < 36).map((el) => el.textContent.trim())
      );
      if (smallTaps.length) issues.push(`[${label}] nav links under 36px tall: ${smallTaps.join(' | ')}`);

      await page.click('.vp-nav-link[data-panel="users"]');
      await new Promise((r) => setTimeout(r, 600));
      const drawerClosed = await page.$('#vp-sidebar:not(.vp-sidebar--open)');
      if (!drawerClosed) issues.push(`[${label}] drawer did not close after nav tap`);
      await page.waitForSelector('.vp-table-wrap', { timeout: 8000 }).catch(() => {
        issues.push(`[${label}] users table never rendered`);
      });
      await page.screenshot({ path: `/tmp/vp-mobile-users.png` });
    } else {
      // tablet/desktop: hamburger must be hidden
      const display = await page.$eval('#vp-menu-btn', (el) => getComputedStyle(el).display);
      if (display !== 'none') issues.push(`[${label}] hamburger visible on ${width}px screen`);
    }

    // -- 5. Escape closes drawer (mobile) --------------------------------
    if (width < 768) {
      await page.click('#vp-menu-btn');
      await new Promise((r) => setTimeout(r, 350));
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 350));
      const stillOpen = await page.$('#vp-sidebar.vp-sidebar--open');
      if (stillOpen) issues.push(`[${label}] Escape key did not close the drawer`);
    }

    // -- 6. Walk EVERY panel (mobile only): overflow + render check --------
    if (width < 768) {
      const panels = ['dashboard', 'users', 'unverified', 'referral-tree', 'referrals', 'withdrawals', 'proofs', 'sql', 'cleanup', 'admins'];
      for (const panel of panels) {
        // Re-open the drawer first: nav links are unreachable while it's closed.
        await page.click('#vp-menu-btn');
        await page.waitForSelector('.vp-sidebar--open', { timeout: 4000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 350));
        await page.click(`.vp-nav-link[data-panel="${panel}"]`);
        await new Promise((r) => setTimeout(r, 900));
        const panelOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (panelOverflow > 2) {
          const culprits = await page.evaluate(() => {
            const vw = document.documentElement.clientWidth;
            return Array.from(document.querySelectorAll('main *'))
              .filter((el) => {
                const r = el.getBoundingClientRect();
                if (r.right <= vw + 2 && r.left >= -2) return false;
                // elements inside a horizontally-scrollable wrapper are fine
                let p = el.parentElement;
                while (p) {
                  const s = getComputedStyle(p);
                  if (s.overflowX === 'auto' || s.overflowX === 'scroll') return false;
                  p = p.parentElement;
                }
                return true;
              })
              .slice(0, 5)
              .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
          });
          issues.push(`[${label}] panel '${panel}' overflows by ${panelOverflow}px — culprits: ${culprits.join(', ') || 'unknown'}`);
        }
        const empty = await page.$('#vp-panel .vp-empty');
        const emptyText = empty ? await empty.evaluate((el) => el.textContent) : '';
        if (emptyText && /failed|error/i.test(emptyText)) {
          issues.push(`[${label}] panel '${panel}' shows error: ${emptyText.trim().slice(0, 80)}`);
        }
        await page.screenshot({ path: `/tmp/vp-mobile-390-panel-${panel}.png` });
      }
    }

    await page.close();
  };

  await runViewport({ width: 390, height: 844, label: 'mobile-390' });
  // 834px sits on the DESKTOP side of the 768px breakpoint — verifies the
  // hamburger is hidden and the fixed sidebar shows again.
  await runViewport({ width: 834, height: 1112, label: 'tablet-834' });

  await browser.close();

  console.log('\n=== VaultPro mobile preview results ===');
  console.log(`Screenshots: /tmp/vp-mobile-{login,dashboard,drawer,users}.png, /tmp/vp-tablet-dashboard.png`);
  if (issues.length === 0) console.log('✅ No layout issues detected');
  else {
    console.log(`⚠️  ${issues.length} issue(s):`);
    for (const i of issues) console.log('  - ' + i);
  }
  if (consoleErrors.length) {
    console.log(`\n⚠️  Console errors (${consoleErrors.length}):`);
    for (const e of consoleErrors.slice(0, 10)) console.log('  - ' + e);
  }
  process.exit(issues.length ? 1 : 0);
}

main().catch((e) => { console.error('Harness failed:', e); process.exit(2); });
