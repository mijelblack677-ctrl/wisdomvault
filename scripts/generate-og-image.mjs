// scripts/generate-og-image.mjs
//
// Renders public/og-image.png (1200x630) — the card WhatsApp, Facebook and
// X show when someone shares a Wisdom Vault or referral link.
//
// It is generated rather than hand-drawn so the copy can be changed and the
// image regenerated in one command instead of needing a designer:
//
//   node scripts/generate-og-image.mjs
//
// 1200x630 is the size the Open Graph spec recommends and the ratio every
// scrapers' preview box is shaped for.
//
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
    background: #f7f1ec;
    color: #2d2327;
    position: relative;
  }
  /* Warm glow behind the mark, echoing the landing hero. */
  .glow {
    position: absolute;
    width: 900px; height: 900px;
    left: -220px; top: -330px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(192,154,138,0.38) 0%, rgba(192,154,138,0.10) 45%, rgba(247,241,236,0) 70%);
  }
  .glow--right {
    left: auto; right: -300px; top: auto; bottom: -430px;
    background: radial-gradient(circle, rgba(255,196,74,0.30) 0%, rgba(255,196,74,0.08) 45%, rgba(247,241,236,0) 70%);
  }
  .frame {
    position: absolute;
    inset: 28px;
    border: 1px solid rgba(45,35,39,0.10);
    border-radius: 24px;
  }
  .content {
    position: relative;
    height: 100%;
    padding: 76px 84px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand__mark {
    width: 58px; height: 58px;
    border-radius: 15px;
    background: linear-gradient(140deg, #2d2327, #4a3a3f);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 10px 26px rgba(45,35,39,0.26);
  }
  .brand__name {
    font-family: 'Playfair Display', serif;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .brand__name em { font-style: normal; color: #b8873f; }
  .brand__sub {
    font-size: 13px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9a887e;
    margin-top: 3px;
    font-weight: 500;
  }
  .headline {
    font-family: 'Playfair Display', serif;
    font-size: 76px;
    line-height: 1.06;
    font-weight: 500;
    letter-spacing: -2px;
  }
  .headline em { font-style: italic; color: #b8873f; }
  .rule { width: 96px; height: 3px; background: #c09a8a; border-radius: 2px; margin: 26px 0 22px; }
  .points { display: flex; gap: 30px; font-size: 20px; color: #6b5a52; font-weight: 500; }
  .points span { display: flex; align-items: center; gap: 10px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: #c09a8a; display: inline-block; }
  .foot {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid rgba(45,35,39,0.10);
    padding-top: 22px;
    font-size: 19px;
  }
  .foot__url { font-weight: 600; color: #2d2327; letter-spacing: -0.2px; }
  .foot__note { color: #9a887e; font-size: 16px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500; }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="glow glow--right"></div>
  <div class="frame"></div>
  <div class="content">
    <div class="brand">
      <div class="brand__mark">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f7f1ec" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div>
        <div class="brand__name">Wisdom <em>Vault</em></div>
        <div class="brand__sub">Timeless Wisdom</div>
      </div>
    </div>

    <div>
      <div class="headline">Learn anything.<br /><em>Earn while you learn.</em></div>
      <div class="rule"></div>
      <div class="points">
        <span><i class="dot"></i> Premium courses</span>
        <span><i class="dot"></i> Refer &amp; earn</span>
        <span><i class="dot"></i> Withdraw to mobile money</span>
      </div>
    </div>

    <div class="foot">
      <div class="foot__url">vault-of-wisdom.com</div>
      <div class="foot__note">Join today</div>
    </div>
  </div>
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  // Render only once the webfonts have actually swapped in, otherwise the
  // screenshot captures a fallback serif.
  await page.evaluate(() => document.fonts.ready);

  const png = await page.screenshot({ type: 'png' });
  writeFileSync(OUT, png);
  console.log(`Wrote ${OUT} (${WIDTH}x${HEIGHT}, ${(png.length / 1024).toFixed(1)} KB)`);
} finally {
  await browser.close();
}
