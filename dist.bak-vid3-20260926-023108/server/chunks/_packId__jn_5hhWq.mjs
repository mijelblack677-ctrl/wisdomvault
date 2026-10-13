import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { C as createAstro, d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_C74SdNzq.mjs";
//#region src/pages/pay/[packId].astro
var _packId__exports = /* @__PURE__ */ __exportAll({
	default: () => $$PackId,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://vault-of-wisdom.com");
var $$PackId = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PackId;
	Astro.params.packId;
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="pay-app"></div>` })}${renderScript($$result, "/home/miracle/app/src/pages/pay/[packId].astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/pages/pay/[packId].astro", void 0);
var $$file = "/home/miracle/app/src/pages/pay/[packId].astro";
var $$url = "/pay/[packId]";
//#endregion
//#region \0virtual:astro:page:src/pages/pay/[packId]@_@astro
var page = () => _packId__exports;
//#endregion
export { page };
