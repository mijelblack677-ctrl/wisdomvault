import os

# Paths
pages_dir = "/home/miracleb/wisdom-vault/src/pages"
billing_path = os.path.join(pages_dir, "billing.astro")
backup_path = billing_path + ".backup"

# 1. Backup the original
if os.path.exists(billing_path):
    os.rename(billing_path, backup_path)
    print(f"✅ Backed up old billing.astro to billing.astro.backup")
else:
    print(f"⚠️ billing.astro not found at {billing_path}")
    exit()

# 2. Write the new file
new_content = """---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <div id="billing-app"></div>
</BaseLayout>

<style is:global>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,700&display=swap');

  :root {
    --bg: #0D0D0D; /* Dark background to match your site */
    --card: rgba(20, 20, 35, 0.85);
    --border: rgba(255, 255, 255, 0.06);
    --gold: #F59E0B; --gold-bright: #FBBF24;
    --gold-dim: rgba(245,158,11,0.08); --text: #F5F0FF;
    --text-secondary: #C8BFE0; --muted: #9088A8;
    --green: #4ADE80; --red: #F87171; --radius: 20px;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  
  #billing-app { 
    font-family:'Inter',system-ui,sans-serif; 
    background:var(--bg); 
    min-height:100vh; 
    color:var(--text); 
    display:flex; 
    align-items:center; 
    justify-content:center; 
    padding:40px 20px;
    position: relative;
    overflow: hidden;
  }

  /* ===== FLOATING BACKGROUND ELEMENTS ===== */
  .bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }

  /* Main Glowing Gold Orb (Centered behind card) */
  .bg-orb--main {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulseMain 6s ease-in-out infinite;
  }

  @keyframes pulseMain {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  }

  /* Top-Left Floating Element */
  .bg-orb--tl {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.08), transparent 70%);
    top: 10%;
    left: 5%;
    animation: floatTL 8s ease-in-out infinite alternate;
  }

  @keyframes floatTL {
    0% { transform: translate(0, 0) scale(0.9); }
    100% { transform: translate(40px, 30px) scale(1.1); }
  }

  /* Bottom-Right Floating Element */
  .bg-orb--br {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(255, 215, 0, 0.05), transparent 70%);
    bottom: 5%;
    right: 5%;
    animation: floatBR 10s ease-in-out infinite alternate;
  }

  @keyframes floatBR {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(-30px, -40px) scale(0.8); }
  }

  /* The card itself */
  .billing-container { 
    width:100%; 
    max-width:520px; 
    animation:fadeUp 0.6s ease-out; 
    position: relative; 
    z-index: 10; 
  }

  @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }

  .billing-card { 
    background:var(--card); 
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border:1px solid var(--border); 
    border-radius:var(--radius); 
    padding:44px 36px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  @media(max-width:500px){ .billing-card{padding:32px 22px} }
  
  .billing-header { text-align:center; margin-bottom:32px; }
  .billing-header__icon { width:56px; height:56px; background:var(--gold-dim); border:1px solid rgba(245,158,11,0.2); border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
  .billing-title { font-family:'Playfair Display',serif; font-style:italic; font-size:28px; font-weight:700; letter-spacing:-0.02em; margin-bottom:4px; }
  .billing-title span { background:linear-gradient(135deg,var(--gold),var(--gold-bright)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .billing-subtitle { font-size:13px; color:var(--muted); }
  
  .billing-amount { background:var(--gold-dim); border:1px solid rgba(245,158,11,0.15); border-radius:16px; padding:24px; text-align:center; margin-bottom:28px; }
  .billing-amount__label { font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin-bottom:8px; font-weight:600; }
  .billing-amount__mwk { font-size:42px; font-weight:900; background:linear-gradient(135deg,var(--gold),var(--gold-bright)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1; }
  .billing-amount__usd { font-size:13px; color:var(--muted); margin-top:6px; }
  
  .billing-section-title { font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin-bottom:12px; font-weight:600; }
  .billing-agents { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:28px; }
  @media(max-width:400px){ .billing-agents{grid-template-columns:1fr} }
  
  .billing-agent { background:rgba(255,255,255,0.015); border:1px solid var(--border); border-radius:12px; padding:18px 14px; text-align:center; }
  .billing-agent:hover { border-color:rgba(245,158,11,0.3); background:var(--gold-dim); }
  .billing-agent__label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; font-weight:600; }
  .billing-agent__code { font-size:15px; font-weight:700; color:var(--text); font-family:'SF Mono','Fira Code',monospace; word-break:break-all; }
  
  .billing-instructions { font-size:12px; color:var(--muted); line-height:1.8; margin-bottom:28px; padding:16px; background:rgba(255,255,255,0.012); border-radius:12px; border-left:3px solid var(--gold); }
  .billing-instructions strong { color:var(--text); }
  
  .billing-actions { display:flex; flex-direction:column; gap:10px; }
  .billing-btn { width:100%; padding:14px 0; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; border:none; }
  .billing-btn--whatsapp { background:#25D366; color:#fff; }
  .billing-btn--gold { background:transparent; border:1px solid rgba(245,158,11,0.3); color:var(--gold); }
  .billing-loading { text-align:center; padding:60px 0; color:var(--muted); }
</style>

<script>
  var app = document.getElementById('billing-app');
  var userData = localStorage.getItem('wisdom_vault_user');

  if (!userData) {
    app.innerHTML = `
      <div class="billing-container">
        <div class="billing-card" style="text-align:center;">
          <div class="billing-header__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p style="color:var(--text);font-weight:600;margin-bottom:8px;">Registration Required</p>
          <p style="color:var(--muted);font-size:13px;margin-bottom:20px;">Create an account first to access billing.</p>
          <a href="/register" class="billing-btn billing-btn--gold" style="display:inline-flex;width:auto;padding:12px 32px;">Create Account</a>
        </div>
      </div>`;
  } else {
    loadBilling(JSON.parse(userData));
  }

  async function loadBilling(user) {
    app.innerHTML = `
    <div class="billing-container">
      <div class="billing-card">
        <div class="billing-loading">
          <div style="width:32px;height:32px;border:2px solid var(--gold);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
          <p>Loading...</p>
        </div>
      </div>
    </div>`;

    try {
      var res = await fetch('/api/payment-config');
      var data = await res.json();
      if (!data.success || !data.config) {
        app.innerHTML = `
          <div class="billing-container">
            <div class="billing-card" style="text-align:center;">
              <p style="color:var(--red);">Unavailable.</p>
              <a href="/dashboard" class="billing-btn billing-btn--gold" style="display:inline-flex;width:auto;padding:12px 24px;margin-top:16px;">Dashboard</a>
            </div>
          </div>`;
        return;
      }

      var c = data.config;
      
      // 🟡 SET TO 10,000 MWK
      var feeMwk = '10000'; 
      var feeUsd = '6'; // Approx $6 USD
      
      var agent1 = c.agent_code_1 || 'Not set';
      var agent2 = c.agent_code_2 || 'Not set';
      var name1 = c.agent_name_1 || 'Agent 1';
      var name2 = c.agent_name_2 || 'Agent 2';
      var whatsapp = c.whatsapp_number || '';
      var waNum = whatsapp.replace(/[^0-9]/g, '');
      var waMsg = encodeURIComponent('Hello, I paid for Wisdom Vault. Name: ' + user.fullName + '. Code: ' + user.referralCode);
      var waLink = whatsapp ? 'https://wa.me/' + waNum + '?text=' + waMsg : '#';

      var h = '';
      h += `
      <div class="billing-container">
        <div class="billing-card">
          <div class="billing-header">
            <div class="billing-header__icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h1 class="billing-title">Complete <span>Payment</span></h1>
            <p class="billing-subtitle">Transfer the fee to activate your account</p>
          </div>
          
          <div class="billing-amount">
            <div class="billing-amount__label">Registration Fee</div>
            <div class="billing-amount__mwk">MWK ${parseInt(feeMwk).toLocaleString()}</div>
            <div class="billing-amount__usd">Approx. $${feeUsd} USD</div>
          </div>
          
          <div class="billing-section-title">Send Payment To</div>
          <div class="billing-agents">
            <div class="billing-agent">
              <div class="billing-agent__label">${name1}</div>
              <div class="billing-agent__code">${agent1}</div>
            </div>
            <div class="billing-agent">
              <div class="billing-agent__label">${name2}</div>
              <div class="billing-agent__code">${agent2}</div>
            </div>
          </div>
          
          <div class="billing-instructions">
            <strong>How to complete:</strong><br/>
            1. Send <strong>MWK ${parseInt(feeMwk).toLocaleString()}</strong> to one of the codes above<br/>
            2. Click WhatsApp below to notify admin<br/>
            3. Account activated within 24 hours<br/>
            4. Your code: <strong style="color:var(--gold);">${user.referralCode}</strong>
          </div>
          
          <div class="billing-actions">`;

      if (whatsapp) {
        h += `
          <a href="${waLink}" target="_blank" class="billing-btn billing-btn--whatsapp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contact Admin on WhatsApp
          </a>`;
      } else {
        h += `
          <div style="text-align:center;padding:12px;background:rgba(245,158,11,0.06);border-radius:8px;font-size:12px;color:var(--gold);margin-bottom:8px;">
            WhatsApp not configured yet.
          </div>`;
      }

      h += `
          <a href="/dashboard" class="billing-btn billing-btn--gold">Go to Dashboard</a>
        </div>
      </div>
    </div>`;
      
      app.innerHTML = h;
    } catch(e) {
      app.innerHTML = `
        <div class="billing-container">
          <div class="billing-card" style="text-align:center;">
            <p style="color:var(--red);">Failed to load.</p>
          </div>
        </div>`;
    }
  }
</script>
"""

with open(billing_path, 'w') as f:
    f.write(new_content)
print(f"✅ New billing.astro created with 10,000 MWK fee and floating background.")
print("✅ Backup saved as billing.astro.backup")
print("\n▶️ Restart your server (Ctrl+C, then npm run dev) to see the changes.")
