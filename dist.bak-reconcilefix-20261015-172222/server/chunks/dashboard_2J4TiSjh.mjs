import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_BPVx87iz.mjs";
/* empty css                          */
//#region src/pages/dashboard.astro
var dashboard_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Dashboard,
	file: () => $$file,
	url: () => $$url
});
var $$Dashboard = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "noindex": true }, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="dash-app"></div>` })}${renderScript($$result, "/home/miracle/app/src/pages/dashboard.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/pages/dashboard.astro", void 0);
var $$file = "/home/miracle/app/src/pages/dashboard.astro";
var $$url = "/dashboard";
//#endregion
//#region \0virtual:astro:page:src/pages/dashboard@_@astro
var page = () => dashboard_exports;
//#endregion
export { page };
