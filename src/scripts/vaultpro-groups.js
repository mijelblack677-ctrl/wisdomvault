// ============================================================
// VaultPro: WHATSAPP GROUP LINKS PANEL
// Loaded by vaultpro.js into #vp-panel. Talks to
// /api/admin/whatsapp-groups with the panel's vaultpro_token.
// ============================================================
(function () {
  'use strict';

  function vpToken() {
    return localStorage.getItem('vaultpro_token') || '';
  }

  function vpHeaders(extra) {
    const h = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + vpToken() };
    return Object.assign(h, extra || {});
  }

  function esc(v) {
    return String(v || '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c
    ));
  }

  let groups = [];
  let editingId = null;
  let refs = null;

  function msg(text, kind) {
    if (!refs || !refs.msgEl || !refs.msgEl.isConnected) return;
    refs.msgEl.textContent = text || '';
    refs.msgEl.className = 'vp-wa-msg' + (kind ? ' ' + kind : '');
  }

  function render() {
    if (!refs || !refs.listEl || !refs.listEl.isConnected) return;
    const list = refs.listEl;
    list.innerHTML = '';
    if (!groups.length) {
      list.innerHTML = '<div class="vp-empty">No groups yet — add your first link above.</div>';
      return;
    }
    groups.forEach((g) => {
      const row = document.createElement('div');
      row.className = 'vp-wa-item' + (g.is_active ? '' : ' vp-wa-off');
      row.innerHTML = `
        <div class="vp-wa-meta">
          <div class="vp-wa-name">${esc(g.name)}${g.is_active ? '' : ' <span class="vp-wa-chip">hidden</span>'}</div>
          ${g.description ? `<div class="vp-wa-desc">${esc(g.description)}</div>` : ''}
          <div class="vp-wa-link">${esc(g.link)}</div>
          <div class="vp-wa-chip">👆 ${g.total_clicks || 0} clicks · ${g.unique_users || 0} users</div>
        </div>
        <div class="vp-wa-actions">
          <button class="vp-btn vp-btn--ghost" data-act="edit">Edit</button>
          <button class="vp-btn vp-btn--ghost" data-act="toggle">${g.is_active ? 'Hide' : 'Show'}</button>
          <button class="vp-btn vp-btn--danger" data-act="del">Delete</button>
        </div>`;

      row.querySelector('[data-act="edit"]').addEventListener('click', () => {
        editingId = g.id;
        refs.nameEl.value = g.name;
        refs.descEl.value = g.description || '';
        refs.linkEl.value = g.link;
        refs.orderEl.value = String(g.sort_order || 0);
        refs.saveBtn.textContent = 'Save Changes';
        refs.cancelBtn.style.display = '';
        msg('Editing "' + g.name + '" — saving re-shows the popup to users.');
        refs.nameEl.focus();
        try { refs.nameEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
      });

      row.querySelector('[data-act="toggle"]').addEventListener('click', async () => {
        await save({
          id: g.id, name: g.name, description: g.description || '',
          link: g.link, sort_order: g.sort_order || 0, is_active: !g.is_active,
        });
      });

      row.querySelector('[data-act="del"]').addEventListener('click', async () => {
        if (!confirm('Delete "' + g.name + '"? Users will no longer see it.')) return;
        try {
          const res = await fetch('/api/admin/whatsapp-groups', {
            method: 'DELETE', headers: vpHeaders(), body: JSON.stringify({ id: g.id }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.success) { groups = data.groups; render(); msg('Deleted.', 'ok'); }
          else msg(data.message || 'Delete failed', 'err');
        } catch (e) { msg('Network error', 'err'); }
      });

      list.appendChild(row);
    });
  }

  async function save(payload) {
    const isNew = !payload.id;
    refs.saveBtn.disabled = true;
    try {
      const res = await fetch('/api/admin/whatsapp-groups', {
        method: isNew ? 'POST' : 'PUT',
        headers: vpHeaders(),
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
      if (refs.saveBtn) refs.saveBtn.disabled = false;
    }
  }

  function resetForm() {
    editingId = null;
    if (!refs || !refs.nameEl || !refs.nameEl.isConnected) return;
    refs.nameEl.value = '';
    refs.descEl.value = '';
    refs.linkEl.value = '';
    refs.orderEl.value = '0';
    refs.saveBtn.textContent = 'Add Group';
    refs.cancelBtn.style.display = 'none';
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/whatsapp-groups', { headers: vpHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) { groups = data.groups; render(); }
      else if (res.status === 401) msg('Session expired — sign in again.', 'err');
      else msg(data.message || 'Could not load groups', 'err');
    } catch (e) { msg('Network error loading groups', 'err'); }
  }

  function mount(container) {
    container.innerHTML = `
      <div class="vp-card">
        <div class="vp-card-title">💬 WhatsApp Group Links</div>
        <p class="vp-wa-sub">Groups here pop up on every verified user's dashboard. Editing a group re-shows its popup to everyone.</p>
        <div class="vp-wa-grid">
          <input id="vp-wa-name" class="vp-input" placeholder="Group name (e.g. Psychology of Money)">
          <input id="vp-wa-desc" class="vp-input" placeholder="Short description (optional)">
          <input id="vp-wa-link" class="vp-input" placeholder="https://chat.whatsapp.com/...">
          <input id="vp-wa-order" class="vp-input" placeholder="Order" inputmode="numeric" style="max-width:100px;">
        </div>
        <div class="vp-wa-actions" style="margin:10px 0 18px;">
          <button id="vp-wa-save" class="vp-btn">Add Group</button>
          <button id="vp-wa-cancel" class="vp-btn vp-btn--ghost" style="display:none;">Cancel edit</button>
        </div>
        <div id="vp-wa-list"></div>
        <div id="vp-wa-msg" class="vp-wa-msg"></div>
      </div>`;

    refs = {
      nameEl: container.querySelector('#vp-wa-name'),
      descEl: container.querySelector('#vp-wa-desc'),
      linkEl: container.querySelector('#vp-wa-link'),
      orderEl: container.querySelector('#vp-wa-order'),
      saveBtn: container.querySelector('#vp-wa-save'),
      cancelBtn: container.querySelector('#vp-wa-cancel'),
      listEl: container.querySelector('#vp-wa-list'),
      msgEl: container.querySelector('#vp-wa-msg'),
    };

    refs.saveBtn.addEventListener('click', () => {
      const payload = {
        name: refs.nameEl.value.trim(),
        description: refs.descEl.value.trim(),
        link: refs.linkEl.value.trim(),
        sort_order: parseInt(refs.orderEl.value, 10) || 0,
      };
      if (editingId) payload.id = editingId;
      if (!payload.name) return msg('Name is required', 'err');
      save(payload);
    });

    refs.cancelBtn.addEventListener('click', resetForm);
    load();
  }

  window._vpLoadWhatsAppGroups = mount;
})();
