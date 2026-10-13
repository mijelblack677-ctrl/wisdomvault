var e=document.getElementById(`pay-app`),t=`<?= packId ?>`,n=localStorage.getItem(`wisdom_vault_user`);if(!n)e.innerHTML=`
      <div class="pay-card" style="text-align:center;">
        <div class="pay-title">Login Required</div>
        <p style="color:#6A6A8A;margin:16px 0;">Please sign in to submit payment proof.</p>
        <a href="/login" class="pay-btn" style="display:inline-block;text-decoration:none;padding:12px 32px;">Sign In</a>
      </div>
    `;else{let i=JSON.parse(n);fetch(`/api/premium/packs?userId=`+i.id).then(function(e){return e.json()}).then(function(n){if(n.success){let a=n.packs.find(function(e){return e.id===t});a?r(i,a):e.innerHTML=`<div class="pay-card" style="text-align:center;"><p style="color:#EF4444;">Pack not found.</p><a href="/dashboard" class="pay-back">← Back to Dashboard</a></div>`}}).catch(function(){e.innerHTML=`<div class="pay-card" style="text-align:center;"><p style="color:#EF4444;">Failed to load pack.</p></div>`})}function r(t,n){e.innerHTML=`
      <div class="pay-card">
        <a href="/dashboard" class="pay-back">← Back to Dashboard</a>
        <div class="pay-title">Payment <span>Proof</span></div>
        <div class="pay-price">${parseFloat(n.price).toLocaleString()}</div>
        <div class="pay-subtitle">${n.name}</div>

        <div class="pay-instructions">
          <strong>Instructions:</strong><br/>
          1. Send <strong>${parseFloat(n.price).toLocaleString()}</strong> to the provided payment number.<br/>
          2. Fill in the form below with your payment details.<br/>
          3. Admin will verify and unlock your pack within 24 hours.
        </div>

        <form class="pay-form" id="pay-form" onsubmit="submitProof(event)">
          <div>
            <label>Payment Provider</label>
            <select id="provider" required>
              <option value="">Select provider</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="Mpamba">Mpamba</option>
              <option value="National Bank">National Bank</option>
              <option value="Standard Bank">Standard Bank</option>
              <option value="FDH Bank">FDH Bank</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label>Your Phone Number</label>
            <input type="text" id="phone" placeholder="088XXXXXXX" required />
          </div>
          <div>
            <label>Your Full Name (as on payment)</label>
            <input type="text" id="customer-name" placeholder="Name used for payment" required />
          </div>
          <div>
            <label>Card/Account Name</label>
            <input type="text" id="card-name" placeholder="Name on your account/card" />
          </div>
          <div>
            <label>Amount Sent</label>
            <input type="number" id="amount-sent" placeholder="${parseFloat(n.price).toLocaleString()}" value="${parseFloat(n.price)}" required />
          </div>
          <button type="submit" class="pay-btn" id="submit-btn">Submit Payment Proof</button>
        </form>
        <div id="pay-msg" class="pay-msg"></div>
      </div>
    `}window.submitProof=async function(e){e.preventDefault();let t=JSON.parse(localStorage.getItem(`wisdom_vault_user`)||`{}`),n=document.getElementById(`provider`).value,r=document.getElementById(`phone`).value.trim(),i=document.getElementById(`card-name`).value.trim(),a=document.getElementById(`amount-sent`).value,o=document.getElementById(`pay-msg`),s=document.getElementById(`submit-btn`);if(!n||!r||!a){o.className=`pay-msg pay-msg--error pay-msg--show`,o.textContent=`Please fill in all required fields.`;return}s.disabled=!0,s.textContent=`Submitting...`,o.className=`pay-msg`;try{let e=await(await fetch(`/api/premium/payment-proof`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({userId:t.id,packId:`<?= packId ?>`,providerName:n,phoneNumber:r,cardName:i,customerName:document.getElementById(`customer-name`).value.trim(),amountSent:a})})).json();e.success?(o.className=`pay-msg pay-msg--success pay-msg--show`,o.textContent=e.message,s.style.display=`none`,setTimeout(function(){window.location.href=`/dashboard`},3e3)):(o.className=`pay-msg pay-msg--error pay-msg--show`,o.textContent=e.message||`Submission failed.`,s.disabled=!1,s.textContent=`Submit Payment Proof`)}catch{o.className=`pay-msg pay-msg--error pay-msg--show`,o.textContent=`Network error. Please try again.`,s.disabled=!1,s.textContent=`Submit Payment Proof`}};