import { C as createAstro, c as renderSlot, d as renderTemplate, f as maybeRenderHead } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
//#region src/components/LegalPage.astro
createAstro("https://astro.build");
var $$LegalPage = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$LegalPage;
	const { title, subtitle, updated } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<section class="legal" data-astro-cid-waosa6pj><header class="legal__header" data-astro-cid-waosa6pj><a href="/" class="legal__brand" data-astro-cid-waosa6pj><svg class="legal__brand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-waosa6pj><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-astro-cid-waosa6pj></path></svg><span data-astro-cid-waosa6pj>Wisdom Vault</span></a><nav class="legal__nav" data-astro-cid-waosa6pj><a href="/login" class="legal__nav-link" data-astro-cid-waosa6pj>Login</a><a href="/register" class="legal__nav-cta" data-astro-cid-waosa6pj>Get Started</a></nav></header><main class="legal__main" data-astro-cid-waosa6pj><div class="legal__card" data-astro-cid-waosa6pj><h1 class="legal__title" data-astro-cid-waosa6pj>${title}</h1><p class="legal__subtitle" data-astro-cid-waosa6pj>${subtitle}</p><p class="legal__updated" data-astro-cid-waosa6pj>Last updated: ${updated}</p><div class="legal__content" data-astro-cid-waosa6pj>${renderSlot($$result, $$slots["default"])}</div></div></main><footer class="legal__footer" data-astro-cid-waosa6pj><span data-astro-cid-waosa6pj>BETTER LEARNERS &nbsp;&bull;&nbsp; BRIGHTER FUTURES</span></footer></section>`;
}, "/home/miracle/app/src/components/LegalPage.astro", void 0);
//#endregion
export { $$LegalPage as t };
