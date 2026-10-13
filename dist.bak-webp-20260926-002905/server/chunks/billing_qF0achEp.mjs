import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_C74SdNzq.mjs";
//#region src/pages/billing.astro
var billing_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Billing,
	file: () => $$file,
	url: () => $$url
});
var $$Billing = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "noindex": true }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="billing-app"><div class="billing-bg"></div><div class="billing-overlay"></div><div id="billing-container"></div><div id="toast">Copied!</div></div>` })}${renderScript($$result, "/home/miracle/app/src/pages/billing.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/pages/billing.astro", void 0);
var $$file = "/home/miracle/app/src/pages/billing.astro";
var $$url = "/billing";
//#endregion
//#region \0virtual:astro:page:src/pages/billing@_@astro
var page = () => billing_exports;
//#endregion
export { page };
