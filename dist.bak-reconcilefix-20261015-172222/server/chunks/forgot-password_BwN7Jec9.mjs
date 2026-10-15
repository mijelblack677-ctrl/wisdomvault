import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_BPVx87iz.mjs";
//#region src/pages/forgot-password.astro
var forgot_password_exports = /* @__PURE__ */ __exportAll({
	default: () => $$ForgotPassword,
	file: () => $$file,
	url: () => $$url
});
var $$ForgotPassword = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "data-astro-cid-mx6kjore": true }, { "default": async ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="pw-page" data-astro-cid-mx6kjore><section class="pw-card" data-astro-cid-mx6kjore><div class="pw-icon" data-astro-cid-mx6kjore><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-mx6kjore><rect x="3" y="11" width="18" height="10" rx="2" data-astro-cid-mx6kjore></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-astro-cid-mx6kjore></path></svg></div><h1 class="pw-title" data-astro-cid-mx6kjore>Forgot your password?</h1><p class="pw-subtitle" data-astro-cid-mx6kjore>Enter the email address on your account and we'll send you a link to choose a new password.</p><form id="forgot-form" class="pw-form" novalidate data-astro-cid-mx6kjore><div class="pw-field" data-astro-cid-mx6kjore><label class="pw-label" for="forgot-email" data-astro-cid-mx6kjore>Email address</label><input type="email" id="forgot-email" class="pw-input" placeholder="you@example.com" autocomplete="email" required data-astro-cid-mx6kjore></div><button type="submit" class="pw-btn" id="forgot-submit" data-astro-cid-mx6kjore><span data-astro-cid-mx6kjore>Send reset link</span></button><div id="forgot-message" class="pw-message" style="display:none;" data-astro-cid-mx6kjore></div></form><p class="pw-back" data-astro-cid-mx6kjore><a href="/login" class="pw-back-link" data-astro-cid-mx6kjore>&larr; Back to sign in</a></p></section></div>${renderScript($$result, "/home/miracle/app/src/pages/forgot-password.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "/home/miracle/app/src/pages/forgot-password.astro", void 0);
var $$file = "/home/miracle/app/src/pages/forgot-password.astro";
var $$url = "/forgot-password";
//#endregion
//#region \0virtual:astro:page:src/pages/forgot-password@_@astro
var page = () => forgot_password_exports;
//#endregion
export { page };
