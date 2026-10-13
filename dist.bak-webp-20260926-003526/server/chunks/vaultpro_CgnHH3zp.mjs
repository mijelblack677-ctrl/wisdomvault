import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_C74SdNzq.mjs";
//#region src/pages/vaultpro.astro
var vaultpro_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Vaultpro,
	file: () => $$file,
	url: () => $$url
});
var $$Vaultpro = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "noindex": true }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="vaultpro-app"><div class="vp-bg"></div><div class="vp-overlay"></div><div id="vp-root"></div></div>` })}${renderScript($$result, "/home/miracle/app/src/pages/vaultpro.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/pages/vaultpro.astro", void 0);
var $$file = "/home/miracle/app/src/pages/vaultpro.astro";
var $$url = "/vaultpro";
//#endregion
//#region \0virtual:astro:page:src/pages/vaultpro@_@astro
var page = () => vaultpro_exports;
//#endregion
export { page };
