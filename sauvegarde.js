// js/sauvegarde.js
// Gestion des configurations sauvegardées (localStorage)

// ─── STOCKAGE LOCAL ───────────────────────────────────────────────────────────
function loadSaved() {
  try { savedConfigs = JSON.parse(localStorage.getItem('velo_configs') || '[]'); } catch(e) { savedConfigs = []; }
  updateSavedCount();
  // Cacher l'onglet si aucune config sauvegardée
  const tabSaved = document.getElementById('tab-saved');
  if (tabSaved) tabSaved.style.display = savedConfigs.length === 0 ? 'none' : 'flex';
}
function persistSaved() {
  try { localStorage.setItem('velo_configs', JSON.stringify(savedConfigs)); } catch(e) {}
}
function updateSavedCount() {
  document.getElementById('saved-count').textContent = savedConfigs.length;
  const tabSaved = document.getElementById('tab-saved');
  if (tabSaved) tabSaved.style.display = savedConfigs.length === 0 ? 'none' : 'flex';
}

// ─── BOUTONS PAR ONGLET ───────────────────────────────────────────────────────
function showTabBtns(tab) {
  document.getElementById('btns-tab1').style.display = tab === 'config' ? 'block' : 'none';
  document.getElementById('btns-tab2').style.display = tab === 'size'   ? 'block' : 'none';
}

function toggleSaveForm1() {
  const f = document.getElementById('save-form-1');
  f.classList.toggle('open');
  if (f.classList.contains('open')) {
    const model = MODELS.find(m => m.id === selModel);
    if (model) document.getElementById('save-name-1').value = model.name + ' — ma configuration';
    document.getElementById('save-toast-1').style.display = 'none';
    setTimeout(() => document.getElementById('save-name-1').focus(), 50);
  }
}

function toggleSaveForm2() {
  const f = document.getElementById('save-form-2');
  f.classList.toggle('open');
  if (f.classList.contains('open')) {
    const model = MODELS.find(m => m.id === selModel);
    if (model) document.getElementById('save-name-2').value = model.name + ' — ma configuration';
    document.getElementById('save-toast-2').style.display = 'none';
    setTimeout(() => document.getElementById('save-name-2').focus(), 50);
  }
}

function doSave(inputId, toastId) {
  syncSelSize();
  const name = document.getElementById(inputId).value.trim();
  if (!name) return;
  const model = MODELS.find(m => m.id === selModel);
  if (!model) return;
  const { price, weight } = computeTotals(selModel, selOpts);
  const details = POST_META.map(p => {
    const opt = optionsFor(p.id, selModel).find(o => o.id === selOpts[p.id]);
    return { post: p.name, option: opt ? opt.name : '—', locked: opt ? !!opt.locked : false, price: opt && !opt.locked ? opt.price : 0 };
  });
  const entry = { id: Date.now(), name, modelName: model.name, modelBadge: model.badge, date: new Date().toLocaleDateString('fr-FR'), price, weight, details, selModel, selOpts: { ...selOpts }, selSize: { ...selSize } };
  savedConfigs.unshift(entry);
  persistSaved();
  updateSavedCount();
  const toast = document.getElementById(toastId);
  if (toast) toast.style.display = 'block';
  document.getElementById('save-form-1').classList.remove('open');
  document.getElementById('save-form-2').classList.remove('open');
  setTimeout(() => { if (toast) toast.style.display = 'none'; }, 1800);
}

// Alias pour compatibilité avec restoreConfig
function toggleSaveForm() { toggleSaveForm1(); }

function deleteConfig(id) {
  if (!confirm('Supprimer cette configuration ?')) return;
  savedConfigs = savedConfigs.filter(c => c.id !== id);
  persistSaved();
  updateSavedCount();
  renderSaved();
}

function restoreConfig(id) {
  const cfg = savedConfigs.find(c => c.id === id);
  if (!cfg) return;
  selModel = cfg.selModel; selOpts = { ...cfg.selOpts }; openPost = null;
  window._singleModel = cfg.selModel;
  window._activePreset = null;
  switchTab('config');
  renderModels(); renderPosts(); updateRecap(); updateFloatingPrice();
  document.getElementById('posts-section').style.display = 'block';
  ['btn-devis','btn-save','btn-reset','btn-size'].forEach(bid => {
    const b = document.getElementById(bid);
    if (b) { b.disabled = false; b.style.opacity = '1'; b.style.cursor = ''; }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSaved() {
  const el = document.getElementById('saved-list');
  if (!savedConfigs.length) {
    el.innerHTML = '<div class="empty-saved"><i class="ti ti-bookmark" style="font-size:24px;display:block;margin-bottom:10px;opacity:.4"></i>Aucune configuration sauvegardée.<br>Complétez une configuration et cliquez sur "Sauvegarder".</div>';
    return;
  }
  el.innerHTML = savedConfigs.map(c => `
    <div class="saved-card">
      <div class="sc-head">
        <div>
          <div class="sc-name">${c.name}</div>
          <div class="sc-meta">${c.modelBadge} · sauvegardé le ${c.date}</div>
        </div>
        <button class="sc-delete" onclick="deleteConfig(${c.id})" title="Supprimer"><i class="ti ti-trash"></i></button>
      </div>
      <div class="sc-detail">${c.details.map(d => `<span style="opacity:.6">${d.post} :</span> ${d.option}`).join(' &nbsp;·&nbsp; ')}</div>
      <div class="sc-totals">
        <div class="sc-tot">Prix : <strong>${c.price.toLocaleString('fr-FR')} €</strong></div>
      </div>
      <div class="sc-actions">
        <button class="sc-btn blue" onclick="restoreConfig(${c.id})"><i class="ti ti-edit"></i> Reprendre / modifier</button>
        <button class="sc-btn" onclick="openOrderModalFrom(${c.id})"><i class="ti ti-send"></i> Demander mon devis</button>
      </div>
    </div>`).join('');
}

