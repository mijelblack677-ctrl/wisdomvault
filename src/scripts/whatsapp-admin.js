// ============================================================
// ADMIN: WHATSAPP GROUP LINKS MANAGER
// Injected into the admin dashboard. Uses the same admin_token
// (localStorage 'admin_token') the rest of this page uses.
//
// The stats page overwrites #stats-container innerHTML several
// times (spinner → error → rendered stats), so mounting once is
// not enough: a MutationObserver re-inserts the card whenever
// the page re-renders it away.
// ============================================================
(function initWhatsAppAdmin() {
  'use strict';

  const CARD_ID = 'wva-card';

  function adminToken() { return localStorage.getItem('admin_token') || ''; }
  function authHeaders(extra) {
    return Object.assign({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminToken() }, extra || {});
  }

  function injectStyles() {
    if (document.getElementById('wv-admin-wa-style')) return;
    const st = document.createElement('style');
    st.id = 'wv-admin-wa-style';
    st.textContent = `
      #wva-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;margin:20px 0;}
      .wva-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
      .wva-title h3{margin:0;font-size:17px;color:#e8e8f5;}
      .wva-sub{font-size:12.5px;color:#9a92ab;margin-bottom:14px;}
      .wva-row{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
      .wva-row input{flex:1;min-width:160px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:10px;padding:10px 12px;color:#e8e8f5;font-size:13.5px;outline:none;}
      .wva-row input::placeholder{color:#7a7290;}
      .wva-btn{padding:10px 16px;border-radius:10px;border:none;background:#6366f1;color:#fff;font-weight:600;font-size:13.5px;cursor:pointer;}
      .wva-btn.secondary{background:rgba(255,255,255,0.08);color:#cfc8e0;}
      .wva-btn.danger{background:rgba(239,68,68,0.15);color:#f87171;}
      .wva-btn:disabled{opacity:0.5;cursor:wait;}
      .wva-item{display:flex;justify-content:space-between;align-items:center;gap:10px;border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.03);flex-wrap:wrap;}
      .wva-item .wva-meta{min-width:200px;flex:1;}
      .wva-item .wva-name{font-weight:700;color:#e8e8f5;font-size:14px;}
      .wva-item .wva-link{font-size:12px;color:#9a92ab;word-break:break-all;}
      .wva-clicks{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-size:11.5px;font-weight:600;}
      .wva-off{opacity:0.45;}
      .wva-msg{font-size:12.5px;margin-top:8px;color:#9a92ab;min-height:16px;}
      .wva-msg.err{color:#f87171;}
      .wva-msg.ok{color:#4ade80;}
    `;
    document.head.appendChild(st);
  }

  let groups = [];
  let editingId = null;
  let uiRefs = null;

  function msg(text, kind) {
    if (!uiRefs || !uiRefs.msgEl || !uiRefs.msgEl.isConnected) return;
    uiRefs.msgEl.textContent = text || '';
    uiRefs.msgEl.className = 'wva-msg' + (kind ? ' ' + kind : '');
  }

  function render() {
    if (!uiRefs || !uiRefs.listEl || !uiRefs.listEl.isConnected) return;
    const list = uiRefs.listEl;
    list.innerHTML = '';
    if (!groups.length) {
      list.innerHTML = '<div class="wva-sub">No groups yet — add your first link above.</div>';
      return;
    }
    groups.forEach((g) => {
      const row = document.createElement('div');
      row.className = 'wva-item' + (g.is_active ? '' : ' wva-off');
      row.innerHTML = `
        <div class="wva-meta">
          <div class="wva-name">${g.name}${g.is_active ? '' : ' (hidden)'}</div>
          <div class="wva-link">${g.link}</div>
          <div class="wva-clicks">👆 ${g.total_clicks || 0} clicks · ${g.unique_users || 0} users</div>
        </div>
        <div class="wva-row" style="margin:0;">
          <button class="wva-btn secondary" data-act="edit">Edit</button>
          <button class="wva-btn secondary" data-act="toggle">${g.is_active ? 'Hide' : 'Show'}</button>
          <button class="wva-btn danger" data-act="del">Delete</button>
        </div>`;

      row.querySelector('[data-act="edit"]').addEventListener('click', () => {
        editingId = g.id;
        uiRefs.nameEl.value = g.name;
        uiRefs.descEl.value = g.description || '';
        uiRefs.linkEl.value = g.link;
        uiRefs.orderEl.value = String(g.sort_order || 0);
        uiRefs.saveBtn.textContent = 'Save Changes';
        uiRefs.cancelBtn.style.display = '';
        msg('Editing “' + g.name + '” — saving will re-show the popup to users.', '');
        uiRefs.nameEl.focus();
      });

      row.querySelector('[data-act="toggle"]').addEventListener('click', async () => {
        await save({
          id: g.id, name: g.name, description: g.description || '',
          link: g.link, sort_order: g.sort_order || 0, is_active: !g.is_active,
        });
      });

      row.querySelector('[data-act="del"]').addEventListener('click', async () => {
        if (!confirm('Delete “' + g.name + '"?')) return;
        const res = await fetch('/api/admin/whatsapp-groups', {
          method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id: g.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) { groups = data.groups; render(); msg('Deleted.', 'ok'); }
        else msg(data.message || 'Delete failed', 'err');
      });
      list.appendChild(row);
    });
  }

  async function save(payload) {
    const isNew = !payload.id;
    uiRefs.saveBtn.disabled = true;
    try {
      const res = await fetch('/api/admin/whatsapp-groups', {
        method: isNew ? 'POST' : 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        groups = data.groups;
        render();
        resetForm();
        msg(isNew ? 'Group added — every verified user will see it now.' : 'Saved — popup will re-show for this group.', 'ok');
      } else {
        msg(data.message || 'Save failed', 'err');
      }
    } catch (e) {
      msg('Network error', 'err');
    } finally {
      uiRefs.saveBtn.disabled = false;
    }
  }

  function resetForm() {
    editingId = null;
    if (!uiRefs || !uiRefs.nameEl || !uiRefs.nameEl.isConnected) return;
    uiRefs.nameEl.value = '';
    uiRefs.descEl.value = '';
    uiRefs.linkEl.value = '';
    uiRefs.orderEl.value = '0';
    uiRefs.saveBtn.textContent = 'Add Group';
    uiRefs.cancelBtn.style.display = 'none';
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/whatsapp-groups', { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) { groups = data.groups; render(); }
      else if (res.status === 401) msg('Admin session missing or expired — log in at /admin/login', 'err');
      else msg(data.message || 'Could not load groups', 'err');
    } catch (e) { msg('Network error loading groups', 'err'); }
  }

  function buildCard() {
    const card = document.createElement('div');
    card.id = CARD_ID;
    card.innerHTML = `
      <div class="wva-title"><h3>💬 WhatsApp Group Links</h3></div>
      <div class="wva-sub">Groups added here pop up in every verified user's dashboard. Editing a group re-shows its popup.</div>
      <div class="wva-row">
        <input id="wva-name" placeholder="Group name (e.g. Psychology of Money)">
        <input id="wva-desc" placeholder="Short description (optional)">
      </div>
      <div class="wva-row">
        <input id="wva-link" placeholder="https://chat.whatsapp.com/...">
        <input id="wva-order" placeholder="Order" style="max-width:90px;" inputmode="numeric">
      </div>
      <div class="wva-row">
        <button id="wva-save" class="wva-btn">Add Group</button>
        <button id="wva-cancel" class="wva-btn secondary" style="display:none;">Cancel edit</button>
      </div>
      <div id="wva-list"></div>
      <div id="wva-msg" class="wva-msg"></div>`;

    uiRefs = {
      nameEl: card.querySelector('#wva-name'),
      descEl: card.querySelector('#wva-desc'),
      linkEl: card.querySelector('#wva-link'),
      orderEl: card.querySelector('#wva-order'),
      saveBtn: card.querySelector('#wva-save'),
      cancelBtn: card.querySelector('#wva-cancel'),
      listEl: card.querySelector('#wva-list'),
      msgEl: card.querySelector('#wva-msg'),
    };

    uiRefs.saveBtn.addEventListener('click', () => {
      const payload = {
        name: uiRefs.nameEl.value.trim(),
        description: uiRefs.descEl.value.trim(),
        link: uiRefs.linkEl.value.trim(),
        sort_order: parseInt(uiRefs.orderEl.value, 10) || 0,
      };
      if (editingId) payload.id = editingId;
      if (!payload.name) return msg('Name is required', 'err');
      save(payload);
    });

    uiRefs.cancelBtn.addEventListener('click', resetForm);
    return card;
  }

  function mount() {
    injectStyles();
    const host = document.getElementById('stats-container');
    if (!host) return;
    if (document.getElementById(CARD_ID)) return; // already present

    const card = buildCard();
    const anchor = host.querySelector('.stats-header');
    if (anchor && anchor.parentNode === host) host.insertBefore(card, anchor.nextSibling);
    else host.insertBefore(card, host.firstChild); // top of container — always visible

    load();
  }

  // Re-insert whenever the stats page wipes the container.
  const hostEl = document.getElementById('stats-container');
  if (hostEl) {
    const obs = new MutationObserver(() => {
      if (!document.getElementById(CARD_ID)) mount();
    });
    obs.observe(hostEl, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
