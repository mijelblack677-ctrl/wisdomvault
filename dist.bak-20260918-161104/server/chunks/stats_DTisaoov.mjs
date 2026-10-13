import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { d as maybeRenderHead, i as renderComponent, u as renderTemplate } from "./server_DBVQPvxI.mjs";
import { t as createComponent } from "./compiler_Cs_sLqJY.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_DuVdTqfw.mjs";
//#region src/pages/admin/stats.astro
var stats_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Stats,
	file: () => $$file,
	url: () => $$url
});
var $$Stats = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="stats-app"><div class="stats-bg"></div><div class="stats-overlay"></div><div id="stats-container"></div></div>` })}${renderScript($$result, "/home/miracle/app/src/pages/admin/stats.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/pages/admin/stats.astro", void 0);
var $$file = "/home/miracle/app/src/pages/admin/stats.astro";
var $$url = "/admin/stats";
//#endregion
//#region \0virtual:astro:page:src/pages/admin/stats@_@astro
var page = () => stats_exports;
//#endregion
export { page };
