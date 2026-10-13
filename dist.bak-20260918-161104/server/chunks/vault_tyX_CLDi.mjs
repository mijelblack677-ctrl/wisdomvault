import { t as __exportAll } from "./rolldown-runtime_BBjsoOtd.mjs";
import { d as maybeRenderHead, i as renderComponent, u as renderTemplate } from "./server_DBVQPvxI.mjs";
import { t as createComponent } from "./compiler_Cs_sLqJY.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_DuVdTqfw.mjs";
/* empty css                          */
//#region src/pages/vault.astro
var vault_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Vault,
	file: () => $$file,
	url: () => $$url
});
var $$Vault = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<div id="admin-app"><!-- Background Elements (FIXED: Outside JS injection) --><div class="admin-bg"></div><div class="admin-overlay-bg"></div><!-- Main App Container --><div id="admin-root"></div></div>` })}${renderScript($$result, "/home/miracle/app/src/pages/vault.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/miracle/app/src/pages/vault.astro", void 0);
var $$file = "/home/miracle/app/src/pages/vault.astro";
var $$url = "/vault";
//#endregion
//#region \0virtual:astro:page:src/pages/vault@_@astro
var page = () => vault_exports;
//#endregion
export { page };
