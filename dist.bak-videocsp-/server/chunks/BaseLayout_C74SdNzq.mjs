import { C as createAstro, c as renderSlot, d as renderTemplate, h as createRenderInstruction, m as addAttribute, p as renderHead } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region src/layouts/BaseLayout.astro
createAstro("https://vault-of-wisdom.com");
var $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$BaseLayout;
	const { title = "Wisdom Vault", description = "Timeless Wisdom. Tangible Rewards.", image = "/og-image.png", noindex = false } = Astro.props;
	const canonical = new URL(Astro.url.pathname, Astro.site ?? "https://vault-of-wisdom.com").href;
	const shareImage = new URL(image, Astro.site ?? "https://vault-of-wisdom.com").href;
	return renderTemplate`<html lang="en" data-astro-cid-z4jru4n3><head><meta charset="UTF-8"><!-- ===== MOBILE META TAGS (ADD THESE) ===== --><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><!-- ===== SHARING / SEO ===== --><title>${title}</title><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(canonical, "href")}>${noindex && renderTemplate`<meta name="robots" content="noindex, nofollow">`}<!-- Open Graph — WhatsApp, Facebook, Telegram. All values absolute. --><meta property="og:type" content="website"><meta property="og:site_name" content="Wisdom Vault"><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:url"${addAttribute(canonical, "content")}><meta property="og:image"${addAttribute(shareImage, "content")}><meta property="og:image:secure_url"${addAttribute(shareImage, "content")}><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Wisdom Vault — Timeless Wisdom. Tangible Rewards."><meta property="og:locale" content="en"><!-- Twitter / X: summary_large_image shows the full card rather than a
         cropped thumbnail, which is what a shared referral link wants. --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"${addAttribute(title, "content")}><meta name="twitter:description"${addAttribute(description, "content")}><meta name="twitter:image"${addAttribute(shareImage, "content")}><meta name="twitter:image:alt" content="Wisdom Vault — Timeless Wisdom. Tangible Rewards."><!-- ===== THEME COLOR ===== --><meta name="theme-color" content="#f7f1ec"><!-- ===== API ORIGIN SHIM =====
         The Vercel copy serves the frontend only; every API call belongs to the
         real server. On a Vercel hostname we point /api/* at the primary
         domain, so those requests never touch Vercel's edge — its free-tier
         "Edge Requests" meter counts every request, proxied ones included.

         This must stay inline and in <head>: dashboard.js, admin.js and
         vaultpro.js capture window.fetch at module load, so it has to be
         patched before any page script runs. --><script>
      (function () {
        var API_ORIGIN = 'https://vault-of-wisdom.com';
        // Only the Vercel copy needs to reach across. On the primary domain
        // everything is same-origin, and on localhost we must not hijack dev.
        if (!/(^|\\.)vercel\\.app$/i.test(location.hostname)) return;

        var originalFetch = window.fetch;
        window.fetch = function (input, init) {
          var url = typeof input === 'string' ? input : input && input.url;
          var isApiPath = url === '/api' || (url && url.indexOf('/api/') === 0);
          if (url && url.charAt(0) === '/' && isApiPath) {
            input = API_ORIGIN + url;
            // Sessions travel in the Authorization header (the app sets no
            // cookies), and 'include' would make the browser reject the
            // cross-origin response. There is nothing to lose by dropping it.
            if (init && init.credentials === 'include') {
              init = Object.assign({}, init, { credentials: 'omit' });
            }
          }
          return originalFetch.call(this, input, init);
        };
      })();
    <\/script><!-- Global Fonts --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,900&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"><!-- ====== FAVICONS & PWA SETUP ====== --><!-- Primary High-Res PNG (Modern browsers & PWA) --><link rel="icon" type="image/png" href="/favicon.png"><!-- Universal Fallback .ico (Older browsers, Windows/Edge) --><link rel="icon" type="image/x-icon" href="/favicon.ico"><!-- Apple Touch Icon (iOS home screen) --><link rel="apple-touch-icon" href="/favicon.png"><!-- PWA Manifest (For "Add to Home Screen" functionality) --><link rel="manifest" href="/manifest.json"><!-- =========================================== --><!-- GLOBAL RESET & BASE STYLES -->${renderHead($$result)}</head><body data-astro-cid-z4jru4n3><!-- Premium Vault Loading Overlay --><div id="loader-overlay" data-astro-cid-z4jru4n3><div class="loader-particles" data-astro-cid-z4jru4n3><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div><div class="loader-particle" data-astro-cid-z4jru4n3></div></div><div class="loader-emblem" data-astro-cid-z4jru4n3><div class="loader-emblem-ring" data-astro-cid-z4jru4n3></div><div class="loader-emblem-inner" data-astro-cid-z4jru4n3></div><div class="loader-emblem-glow" data-astro-cid-z4jru4n3></div><div class="loader-emblem-icon" data-astro-cid-z4jru4n3><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-z4jru4n3><rect x="3" y="11" width="18" height="11" rx="2" ry="2" data-astro-cid-z4jru4n3></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-astro-cid-z4jru4n3></path></svg></div></div><div class="loader-brand-text" data-astro-cid-z4jru4n3>Wisdom <span class="gold" data-astro-cid-z4jru4n3>Vault</span></div><div class="loader-tagline" data-astro-cid-z4jru4n3>Timeless Wisdom</div><div class="loader-progress-track" data-astro-cid-z4jru4n3><div class="loader-progress-fill" data-astro-cid-z4jru4n3></div></div></div>${renderSlot($$result, $$slots["default"])}<!-- PWA Install Banner --><div id="pwa-install-banner" class="pwa-banner" data-astro-cid-z4jru4n3><div class="pwa-banner__inner" data-astro-cid-z4jru4n3><div class="pwa-banner__icon" data-astro-cid-z4jru4n3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-z4jru4n3><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" data-astro-cid-z4jru4n3></path><polyline points="7 10 12 15 17 10" data-astro-cid-z4jru4n3></polyline><line x1="12" y1="15" x2="12" y2="3" data-astro-cid-z4jru4n3></line></svg></div><div class="pwa-banner__text" data-astro-cid-z4jru4n3><span class="pwa-banner__title" data-astro-cid-z4jru4n3>Install Wisdom Vault</span><span class="pwa-banner__subtitle" data-astro-cid-z4jru4n3>Add to home screen for the best experience</span></div><button id="pwa-install-btn" class="pwa-banner__install" data-astro-cid-z4jru4n3>Install</button><button id="pwa-install-dismiss" class="pwa-banner__dismiss" aria-label="Dismiss" data-astro-cid-z4jru4n3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-z4jru4n3><line x1="18" y1="6" x2="6" y2="18" data-astro-cid-z4jru4n3></line><line x1="6" y1="6" x2="18" y2="18" data-astro-cid-z4jru4n3></line></svg></button></div></div></body></html>${renderScript($$result, "/home/miracle/app/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/layouts/BaseLayout.astro", void 0);
//#endregion
export { renderScript as n, $$BaseLayout as t };
