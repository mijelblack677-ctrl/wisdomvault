// save as update-settings.cjs
const fs = require('fs');

const filePath = 'src/scripts/admin.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Find the _loadSettings function and replace it
const settingsRegex = /async function _loadSettings\(\) \{[\s\S]*?\n\}/;

const newSettings = `
async function _loadSettings() {
  const container = document.getElementById('panel-content');
  try {
    const res = await fetch('/api/admin/payment-settings', { headers: getHeaders() });
    const data = await res.json();
    const config = data.success ? data.config : {};

    const getVal = (key) => (config && config[key] ? config[key].value : '');

    container.innerHTML = \`
      <div class="admin-page-header">
        <h2>System Settings</h2>
        <span style="font-size:13px;color:var(--gov-gray-500);">Configure billing and payment settings</span>
      </div>
      
      <div class="admin-card" style="max-width:700px;">
        <form class="admin-form" id="settings-form">
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Payment Configuration</h3>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Registration Fee (MWK)</label>
            <input type="number" id="set-fee-mwk" class="admin-form__input" value="\${getVal('registration_fee_mwk') || '13000'}" />
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:4px;">This amount appears on the billing page</div>
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Registration Fee (USD)</label>
            <input type="number" id="set-fee-usd" class="admin-form__input" value="\${getVal('registration_fee_usd') || '7'}" step="0.5" />
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:4px;">USD equivalent for international users</div>
          </div>
          
          <div style="border-top:1px solid var(--gov-border);margin:20px 0;"></div>
          
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Mobile Money Configuration</h3>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Name 1</label>
            <input type="text" id="set-agent-name1" class="admin-form__input" value="\${getVal('agent_name_1')}" placeholder="e.g., John Doe" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Code 1</label>
            <input type="text" id="set-agent1" class="admin-form__input" value="\${getVal('agent_code_1')}" placeholder="*405*..." />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Name 2</label>
            <input type="text" id="set-agent-name2" class="admin-form__input" value="\${getVal('agent_name_2')}" placeholder="e.g., Jane Smith" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Agent Code 2</label>
            <input type="text" id="set-agent2" class="admin-form__input" value="\${getVal('agent_code_2')}" placeholder="*405*..." />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">WhatsApp Number</label>
            <input type="text" id="set-whatsapp" class="admin-form__input" value="\${getVal('whatsapp_number')}" placeholder="+265..." />
            <div style="font-size:12px;color:var(--gov-gray-500);margin-top:4px;">Support contact for payment issues</div>
          </div>
          
          <div style="border-top:1px solid var(--gov-border);margin:20px 0;"></div>
          
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;color:var(--gov-blue);">Withdrawal Settings</h3>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Minimum Withdrawal (MWK)</label>
            <input type="number" id="set-min-withdrawal" class="admin-form__input" value="\${getVal('withdrawal_min_amount') || '5200'}" />
          </div>
          
          <div class="admin-form__group">
            <label class="admin-form__label">Withdrawal Fee (%)</label>
            <input type="number" id="set-withdrawal-fee" class="admin-form__input" value="\${getVal('withdrawal_fee_percent') || '20'}" step="0.5" />
          </div>
          
          <button type="submit" class="admin-btn admin-btn--solid">Save All Settings</button>
          <div id="set-msg" class="admin-msg" style="margin-top:16px;"></div>
        </form>
      </div>
    \`;

    document.getElementById('settings-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const settings = {
        registration_fee_mwk: document.getElementById('set-fee-mwk').value.trim(),
        registration_fee_usd: document.getElementById('set-fee-usd').value.trim(),
        agent_name_1: document.getElementById('set-agent-name1').value.trim(),
        agent_code_1: document.getElementById('set-agent1').value.trim(),
        agent_name_2: document.getElementById('set-agent-name2').value.trim(),
        agent_code_2: document.getElementById('set-agent2').value.trim(),
        whatsapp_number: document.getElementById('set-whatsapp').value.trim(),
        withdrawal_min_amount: document.getElementById('set-min-withdrawal').value.trim(),
        withdrawal_fee_percent: document.getElementById('set-withdrawal-fee').value.trim()
      };
      
      const msg = document.getElementById('set-msg');
      
      try {
        const res = await fetch('/api/admin/payment-settings', {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ settings })
        });
        const data = await res.json();
        
        if (data.success) {
          msg.className = 'admin-msg admin-msg--success';
          msg.textContent = '✅ All settings saved successfully! Billing page updated.';
        } else {
          msg.className = 'admin-msg admin-msg--error';
          msg.textContent = data.message || '❌ Failed to save settings.';
        }
      } catch (err) {
        msg.className = 'admin-msg admin-msg--error';
        msg.textContent = '❌ Network error. Please try again.';
      }
    });
  } catch (err) {
    container.innerHTML = '<div style="padding:40px;color:var(--gov-danger);text-align:center;">Error loading settings.</div>';
  }
}`;

content = content.replace(settingsRegex, newSettings);
fs.writeFileSync(filePath, content);
console.log('✅ Updated settings panel with all billing fields');
