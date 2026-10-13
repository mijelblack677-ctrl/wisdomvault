import{i as e,n as t,r as n}from"./api-cache.BR94BOV0.js";function r(e={}){let t={"Content-Type":`application/json`,...e},n=localStorage.getItem(`wisdom_vault_session`);return n&&(t.Authorization=`Bearer ${n}`),t}document.getElementById(`toast`);var i=new URLSearchParams(window.location.search),a=i.get(`status`),o=i.get(`welcome`),s=i.get(`tx_ref`),c=null,l=0,u=12;async function d(e){try{let t=s?`?userId=${encodeURIComponent(e.id)}&tx_ref=${encodeURIComponent(s)}`:`?userId=${encodeURIComponent(e.id)}`;return await(await fetch(`/api/paychangu/status`+t,{headers:r(),credentials:`include`})).json()}catch{return{verified:!1}}}function f(e){let t=document.getElementById(`pay-btn`);t&&(e?(t.classList.add(`loading`),t.disabled=!0):(t.classList.remove(`loading`),t.disabled=!1))}function p(){try{let e=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);e.paymentStatus=`verified`,localStorage.setItem(`wisdom_vault_user`,JSON.stringify(e))}catch{}let e=document.getElementById(`billing-container`);e&&(e.innerHTML=`<div class="card verified-card">
        <div class="verified-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="verified-title">Payment Confirmed ✅</div>
        <p class="verified-text">Your payment was verified. Redirecting to your dashboard...</p>
      </div>`),setTimeout(()=>{window.location.href=`/dashboard`},1500)}function m(e){!e||!e.id||c||(f(!0),c=setInterval(async()=>{if(document.hidden)return;l++;let t=await d(e);if(t&&t.verified){clearInterval(c),c=null,f(!1),p();return}if(t&&(t.txStatus===`none`||t.txStatus===`failed`)){clearInterval(c),c=null,f(!1);return}l>=u&&(clearInterval(c),c=null,f(!1))},5e3),d(e).then(e=>{c&&(e&&e.verified?(clearInterval(c),c=null,f(!1),p()):e&&(e.txStatus===`none`||e.txStatus===`failed`)&&(clearInterval(c),c=null,f(!1)))}))}async function h(){let s=document.getElementById(`billing-container`),c=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!c.id){s.innerHTML=`
        <div class="card" style="text-align:center;">
          <div class="header-icon">
            <div class="header-icon-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B7791F" stroke-width="2.2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
          </div>
          <h1 class="card-title">Login <span>Required</span></h1>
          <p class="card-subtitle">Please sign in to complete your payment</p>
          <a href="/login" class="pay-btn" style="display:inline-flex; margin-top:20px; width:auto; padding:14px 32px; border-radius:12px;">
            <span class="btn-text">Sign In</span>
          </a>
        </div>
      `;return}s.innerHTML=`
      <div class="loading">
        <div class="spin"></div>
        Loading payment details...
      </div>
    `;try{let n=t(`/wallet/balance`,c.id);if(n===void 0){let t=await fetch(`/api/wallet/balance?userId=`+c.id,{headers:r()});n=await t.json(),t.ok&&e(`/wallet/balance`,c.id,n)}if(n.success&&n.wallet?.paymentStatus===`verified`){s.innerHTML=`
          <div class="card verified-card">
            <div class="verified-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="verified-title">Account Verified ✅</div>
            <p class="verified-text">Your account is already activated! You have full access to Wisdom Vault.</p>
            <a href="/dashboard" class="pay-btn" style="display:inline-flex; width:auto; padding:14px 32px; border-radius:12px;">
              <span class="btn-text">Go to Dashboard</span>
            </a>
          </div>
        `;return}}catch{let e=n(`/wallet/balance`,c.id);if(e&&e.success&&e.wallet&&e.wallet.paymentStatus===`verified`){s.innerHTML=`
          <div class="card verified-card">
            <div class="verified-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="verified-title">Account Verified ✅</div>
            <p class="verified-text">Your account is already activated! You have full access to Wisdom Vault.</p>
            <a href="/dashboard" class="pay-btn" style="display:inline-flex; width:auto; padding:14px 32px; border-radius:12px;">
              <span class="btn-text">Go to Dashboard</span>
            </a>
          </div>
        `;return}s.innerHTML=`
        <div class="card" style="text-align:center;">
          <div class="maint-icon-wrap">
            <div class="header-icon" style="margin-bottom:20px;">
              <span class="maint-ring"></span>
              <span class="maint-ring maint-ring--two"></span>
              <div class="header-icon-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B7791F" stroke-width="2.2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
            </div>
          </div>
          <h1 class="card-title maint-title-billing">System <span>Under Maintenance<span class="maint-dot"></span><span class="maint-dot"></span><span class="maint-dot"></span></span></h1>
          <p class="card-subtitle">We're experiencing technical difficulties right now. Please try again in a few minutes.</p>
          <div class="maint-scan"></div>
          <div class="maint-pill"><span class="maint-pill-dot"></span><span id="maint-countdown">Auto-retrying in 30s…</span></div>
          <button id="maint-retry" class="pay-btn" style="display:inline-flex; margin-top:20px; width:auto; padding:14px 32px; border-radius:12px; border:none; cursor:pointer;">
            <span class="btn-text">Try Again</span>
          </button>
        </div>
      `,document.getElementById(`maint-retry`)?.addEventListener(`click`,()=>window.location.reload());let t=30,r=document.getElementById(`maint-countdown`),i=setInterval(()=>{--t,r&&(r.textContent=t>0?`Auto-retrying in ${t}s…`:`Retrying now…`),t<=0&&(clearInterval(i),window.location.reload())},1e3);return}let l=``;a===`verified`||o===`true`?(l=`<div class="status-msg status-msg--success status-msg--show">🎉 Payment successful! Your account has been activated. Redirecting to dashboard...</div>`,setTimeout(()=>{window.location.href=`/dashboard`},3e3)):a===`failed`?l=`<div class="status-msg status-msg--error status-msg--show">Payment was not completed. Please try again.</div>`:a===`error`?l=`<div class="status-msg status-msg--error status-msg--show">Error: ${i.get(`message`)||`An error occurred`}</div>`:(a===`return`||a===`checking`)&&(l=`<div class="status-msg status-msg--info status-msg--show">We are confirming your payment with PayChangu. Please wait a moment — your account will activate automatically once confirmed.</div>`),s.innerHTML=`
      <div class="card">
        ${l}

        <!-- Header Icon -->
        <div class="header-icon">
          <div class="header-icon-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B7791F" stroke-width="2.2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h1 class="card-title">Complete <span>Payment</span></h1>
        <p class="card-subtitle">Pay securely online to activate your account</p>

        <!-- Amount Box -->
        <div class="amount-box">
          <div class="amount-label">Registration Fee</div>
          <div class="amount-value">MWK 10,800</div>
          <div class="amount-usd">
            <span>One-time payment</span>
            <span class="dot"></span>
            <span>Instant activation</span>
          </div>
          <div style="margin-top:10px; font-size:12px; color:#8B5E34; background:rgba(183,121,31,0.08); border:1px solid rgba(183,121,31,0.15); border-radius:10px; padding:10px 14px; line-height:1.5; position:relative;">
            <strong>ℹ️ Fee Breakdown:</strong> MWK 10,000 registration + MWK 800 agent processing fee = <strong>MWK 10,800 total</strong>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="methods-info">
          <div class="method-chip method-chip--airtel">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
            Airtel Money
          </div>
          <div class="method-chip method-chip--tnm">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
            TNM Mpamba
          </div>
          <div class="method-chip method-chip--card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Card
          </div>
        </div>

        <!-- Pay Button -->
        <button class="pay-btn" id="pay-btn" onclick="initiatePayment()">
          <div class="spinner"></div>
          <span class="btn-text">Pay MWK 10,800 Now</span>
          <svg class="btn-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>

        <div class="divider"></div>

        <!-- Steps -->
        <div class="steps-title">How it works</div>

        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-text">Click <strong>"Pay Now"</strong> to open the secure payment page</div>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-text">Choose <strong>Airtel Money</strong>, <strong>TNM Mpamba</strong>, or <strong>Card</strong> and complete payment</div>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-text">Your account is <strong>automatically activated</strong> after successful payment</div>
          </div>
        </div>

        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <div class="step-text">Start accessing your dashboard and earning immediately</div>
          </div>
        </div>

        <!-- Secure Badge -->
        <div class="secure-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Secured by PayChangu • 256-bit encryption • Instant verification</span>
        </div>

        <!-- Footer -->
        <a href="/dashboard" class="footer-link">Return to Dashboard</a>

        <div class="footer-divider">
          <div class="line"></div>
          <span>Wisdom Vault • Secure Payment</span>
          <div class="line"></div>
        </div>

        <div class="footer-note">
          Payments are processed securely through PayChangu. Once you send exactly <strong>MWK 10,800</strong> (including MWK 800 agent fee), your account is verified instantly — no manual approval needed.
        </div>
      </div>
    `;let u=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);u&&u.id&&a!==`failed`&&a!==`error`&&m(u)}async function g(){let e=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`);if(!e.id){window.location.href=`/login`;return}let t=document.getElementById(`pay-btn`);t.classList.add(`loading`),t.disabled=!0;try{let n=await(await fetch(`/api/paychangu/initiate`,{method:`POST`,headers:r(),body:JSON.stringify({userId:e.id})})).json();if(n.success&&n.checkoutUrl)window.location.href=n.checkoutUrl;else{t.classList.remove(`loading`),t.disabled=!1;let e=document.createElement(`div`);e.className=`status-msg status-msg--error status-msg--show`,e.textContent=n.message||`Failed to start payment. Please try again.`,t.closest(`.card`).insertBefore(e,t)}}catch{t.classList.remove(`loading`),t.disabled=!1;let e=document.createElement(`div`);e.className=`status-msg status-msg--error status-msg--show`,e.textContent=`Network error. Please check your connection and try again.`,t.closest(`.card`).insertBefore(e,t)}}window.initiatePayment=g,document.addEventListener(`DOMContentLoaded`,h);