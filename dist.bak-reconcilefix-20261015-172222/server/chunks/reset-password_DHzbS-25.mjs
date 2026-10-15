import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as renderTemplate, f as maybeRenderHead, i as renderComponent } from "./server_DyrZCiIE.mjs";
import { t as createComponent } from "./compiler_DWDOsUKT.mjs";
import { n as renderScript, t as $$BaseLayout } from "./BaseLayout_BPVx87iz.mjs";
//#region src/pages/reset-password.astro
var reset_password_exports = /* @__PURE__ */ __exportAll({
	default: () => $$ResetPassword,
	file: () => $$file,
	url: () => $$url
});
var $$ResetPassword = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "data-astro-cid-iiijcprg": true }, { "default": async ($$result) => renderTemplate`${maybeRenderHead($$result)}<div class="pw-page" data-astro-cid-iiijcprg><section class="pw-card" data-astro-cid-iiijcprg><div class="pw-icon" data-astro-cid-iiijcprg><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c09a8a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" data-astro-cid-iiijcprg><rect x="3" y="11" width="18" height="10" rx="2" data-astro-cid-iiijcprg></rect><path d="M7 11V7a5 5 0 0 1 10 0v4" data-astro-cid-iiijcprg></path></svg></div><h1 class="pw-title" data-astro-cid-iiijcprg>Choose a new password</h1><p class="pw-subtitle" data-astro-cid-iiijcprg>Enter a new password for your Wisdom Vault account.</p><form id="reset-form" class="pw-form" novalidate data-astro-cid-iiijcprg><div class="pw-field" data-astro-cid-iiijcprg><label class="pw-label" for="reset-password" data-astro-cid-iiijcprg>New password</label><input type="password" id="reset-password" class="pw-input" placeholder="At least 6 characters" autocomplete="new-password" required data-astro-cid-iiijcprg></div><div class="pw-field" data-astro-cid-iiijcprg><label class="pw-label" for="reset-confirm" data-astro-cid-iiijcprg>Confirm new password</label><input type="password" id="reset-confirm" class="pw-input" placeholder="Re-enter your new password" autocomplete="new-password" required data-astro-cid-iiijcprg></div><button type="submit" class="pw-btn" id="reset-submit" data-astro-cid-iiijcprg><span data-astro-cid-iiijcprg>Reset password</span></button><div id="reset-message" class="pw-message" style="display:none;" data-astro-cid-iiijcprg></div><!-- Shown only when the page was opened without a valid token, so the
             user is never stranded on a dead end with no way to start over. --><a href="/forgot-password" id="reset-retry" class="pw-retry" style="display:none;" data-astro-cid-iiijcprg>Request a new reset link &rarr;</a></form><p class="pw-back" data-astro-cid-iiijcprg><a href="/login" class="pw-back-link" data-astro-cid-iiijcprg>&larr; Back to sign in</a></p></section></div>${renderScript($$result, "/home/miracle/app/src/pages/reset-password.astro?astro&type=script&index=0&lang.ts")}` })}`;
}, "/home/miracle/app/src/pages/reset-password.astro", void 0);
var $$file = "/home/miracle/app/src/pages/reset-password.astro";
var $$url = "/reset-password";
//#endregion
//#region \0virtual:astro:page:src/pages/reset-password@_@astro
var page = () => reset_password_exports;
//#endregion
export { page };
