
function exitSharedMode() {
  document.body.classList.remove('config-shared-mode');
  window.history.pushState({}, '', window.location.pathname);
  ['dtr-btn-devis','dtr-btn-save'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = ''; el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
  });
  const bloc = document.getElementById('shared-mode-bloc');
  if (bloc) bloc.remove();
}


// ─── CHARGEMENT CONFIG DEPUIS URL (?config=OBV-...) ──────────────────────────
async function loadConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const configId = params.get('config');
  if (!configId) return;

  try {
    const cfg = await getConfigFromSupabase(configId);
    if (!cfg) { console.warn('Config introuvable:', configId); return; }

    const json = cfg.config_json;
    selModel = json.modele;
    selOpts  = json.composants || {};
    selSize  = json.dimensions || {};
    window._activePreset = json.preset || null;
    window._singleModel  = selModel;

    // Afficher l'info dans le header principal (badge proto)
    const protoBadge = document.getElementById('proto-badge');
    if (protoBadge) {
      protoBadge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:none;color:#ffffff;font-size:13px;font-weight:700;padding:2px 0;letter-spacing:.02em;';
      protoBadge.textContent = (cfg.nom_client || '') + ' — Configuration ' + configId;
    }

    // Charger selon contexte desktop ou mobile
    if (window.innerWidth >= 768) {
      dtStep = 4; dtRender();
    } else {
      renderModels(); switchTab(4);
    }

    // ── Mode "config partagée" : adapter l'interface ──────────────────
    // Marquer le body pour le CSS
    document.body.classList.add('config-shared-mode');
    if (typeof dtRenderS4 === 'function') dtRenderS4();
    if (typeof dtRenderS4 === 'function') dtRenderS4();

    // Masquer les boutons inutiles dans le récap droit
    setTimeout(() => {
      const btnDevis = document.getElementById('dtr-btn-devis');
      const btnSave  = document.getElementById('dtr-btn-save');
      const btnReset = document.getElementById('dtr-btn-reset');
      if (btnDevis) btnDevis.style.display = 'none';
      if (btnSave)  btnSave.style.display  = 'none';

      // Injecter le bloc "en cours de traitement" dans le récap
      const actions = document.querySelector('.dtr-actions');
      if (actions && btnReset) {
        const bloc = document.createElement('div');
        bloc.id = 'shared-mode-bloc';
        bloc.style.cssText = 'background:#1a1a1a;border:0.5px solid #333;padding:1rem;margin-bottom:.75rem;';
        bloc.innerHTML =
          '<div style="font-size:11px;color:#F5C400;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">Votre demande est en cours</div>' +
          '<p style="font-size:12px;color:#aaa;line-height:1.5;margin-bottom:.75rem;">Nous vous contacterons sous 48h pour finaliser votre projet.</p>' +
          '<button onclick="openContactDrawer()" style="width:100%;background:none;border:0.5px solid #F5C400;color:#F5C400;padding:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);margin-bottom:.5rem;"><i class="ti ti-message"></i> Poser une question</button>' +
          '<button onclick="exitSharedMode()" style="width:100%;background:none;border:0.5px solid #555;color:#888;padding:9px;font-size:12px;cursor:pointer;font-family:var(--font);"><i class="ti ti-edit"></i> Modifier ma configuration</button>';
        actions.insertBefore(bloc, btnReset);
      }
    }, 300);

  } catch(e) {
    console.error('Erreur chargement config:', e);
  }
}



// ─── MAIL VISITEUR — via Supabase Edge Function (clé Brevo sécurisée côté serveur)
async function sendBrevoEmail({ toEmail, toName, configId, shareUrl, modeleNom, prix }) {
  const res = await fetch(SUPABASE_URL + '/functions/v1/send-config-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    },
    body: JSON.stringify({ toEmail, toName, configId, shareUrl, modeleNom, prix })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Edge Function error:', err);
    throw new Error('Edge Function: ' + res.status);
  }
  return await res.json();
}


// ─── SUPABASE CONFIG ─────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://tpxfpmubhkvzratnftnn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRweGZwbXViaGt2enJhdG5mdG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzEwMjQsImV4cCI6MjA5NzkwNzAyNH0.-4podykoAjWV3lJDTQelMoYCAqBikGY0yqu9aVXU0qs';

function generateConfigId() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 900000) + 100000); // 6 chiffres
  return 'OBV-' + year + '-' + num;
}

async function saveConfigToSupabase(configData) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/configurations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(configData)
  });
  if (!res.ok) throw new Error('Supabase error: ' + res.status);
  const data = await res.json();
  return data[0];
}

async function getConfigFromSupabase(configId) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/configurations?config_id=eq.' + configId + '&select=*', {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    }
  });
  if (!res.ok) throw new Error('Supabase error: ' + res.status);
  const data = await res.json();
  return data[0] || null;
}

// ─── DONNÉES ────────────────────────────────────────────────────────────────







// ─── ÉTAT ────────────────────────────────────────────────────────────────────
let selModel = null, selOpts = {}, openPost = null, savedConfigs = [];

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
  const sc = document.getElementById('saved-count');
  if (sc) sc.textContent = savedConfigs.length;
  const tabSaved = document.getElementById('tab-saved');
  if (tabSaved) tabSaved.style.display = savedConfigs.length === 0 ? 'none' : 'flex';
  const dtCount = document.getElementById('dt-saved-count');
  if (dtCount) {
    dtCount.textContent = savedConfigs.length;
    dtCount.style.display = savedConfigs.length > 0 ? 'inline' : 'none';
  }
}

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────
function optionsFor(postId, modelId) {
  const incompatFromOthers = getIncompatFromSelections(postId);
  let opts = ALL_OPTIONS[postId].filter(o => {
    const compatible = o.compat.some(c => c.mid === modelId);
    const blocked = incompatFromOthers.includes(o.id);
    return compatible && !blocked;
  });

  // Filtre freins VTT : selon transmission choisie
  if (postId === 'frein' && selModel === 'vtt_enduro' && selOpts['transmission']) {
    const isVttTrans = selOpts['transmission'].startsWith('trans_vtt_');
    const isSramVtt = selOpts['transmission'].startsWith('trans_vtt_sr_');
    opts = opts.filter(o => {
      if (isSramVtt) return o.id !== 'frein_all';   // SRAM : tout sauf frein_all
      if (isVttTrans) return o.id === 'frein_all' || o.id === 'frein_vtt_hp_tr4'; // Shimano : frein_all + Hope
      return o.id === 'frein_all';
    });
  }

  // Filtre power : n'afficher que pwr_all + le powermeter de la transmission choisie
  if (postId === 'power' && selOpts['transmission']) {
    const transId = selOpts['transmission'];
    const linkedPwr = FORCE_SELECT.find(r => r.if_selected !== 'pwr_all' &&
      r.force && r.force.transmission === transId);
    if (linkedPwr) {
      opts = opts.filter(o => o.id === 'pwr_all' || o.id === linkedPwr.if_selected);
    } else {
      opts = opts.filter(o => o.id === 'pwr_all');
    }
  }
  return opts.sort((a, b) => {
    const aRec = isRecommended(a, modelId) ? 0 : 1;
    const bRec = isRecommended(b, modelId) ? 0 : 1;
    if (aRec !== bRec) return aRec - bRec;
    const aLocked = a.lockedFor.includes(modelId) ? 0 : 1;
    const bLocked = b.lockedFor.includes(modelId) ? 0 : 1;
    if (aLocked !== bLocked) return aLocked - bLocked;
    return a.price - b.price;
  });
}

function isLocked(opt, modelId) {
  return opt.lockedFor && opt.lockedFor.includes(modelId);
}

// Retourne true si l'option est celle de la préconfig active pour ce poste
function isPresetDefault(postId, optId) {
  const preset = window._activePreset && PRESETS[selModel] && PRESETS[selModel][window._activePreset];
  if (!preset) return false;
  return preset[postId] === optId;
}

function getIncompatFromSelections(excludePostId) {
  let blocked = [];
  POST_META.forEach(p => {
    if (p.id === excludePostId) return;
    const selId = selOpts[p.id];
    if (!selId) return;
    const allOpts = ALL_OPTIONS[p.id] || [];
    const selOpt = allOpts.find(o => o.id === selId);
    if (selOpt && selOpt.incompat) blocked = blocked.concat(selOpt.incompat);
  });
  return blocked;
}

function isRecommended(opt, modelId) {
  const c = opt.compat.find(x => x.mid === modelId);
  return c ? c.rec : false;
}

function autoSelectLocked(modelId) {
  POST_META.forEach(p => {
    if (selOpts[p.id]) return;
    const opts = optionsFor(p.id, modelId);
    const toSelect = opts.find(o => isLocked(o, modelId));
    if (toSelect) selOpts[p.id] = toSelect.id;
  });
}

function computeTotals(modelId, opts) {
  const model = MODELS.find(m => m.id === modelId);
  let price = model.basePrice + (model.assembly || 0), weight = 0;
  POST_META.forEach(p => {
    const allOpts = ALL_OPTIONS[p.id] || [];
    const opt = allOpts.find(o => o.id === opts[p.id]);
    if (opt && !isLocked(opt, modelId)) { price += opt.price; weight += opt.weight; }
  });
  return { price, weight };
}

function buildConfigText(modelId, opts) {
  const model = MODELS.find(m => m.id === modelId);
  const { price, weight } = computeTotals(modelId, opts);
  let lines = ['Modèle : ' + model.name];
  POST_META.forEach(p => {
    const allOpts = ALL_OPTIONS[p.id] || [];
    const opt = allOpts.find(o => o.id === opts[p.id]);
    if (opt) lines.push(p.name + ' : ' + opt.name + (isLocked(opt, modelId) ? ' (inclus)' : (opt.price >= 0 ? ' (+' + opt.price.toLocaleString('fr-FR') + ' €)' : ' (' + opt.price.toLocaleString('fr-FR') + ' €)')));
  });
  if (model.assembly) lines.push('Assemblage & mise en route : ' + model.assembly.toLocaleString('fr-FR') + ' €');
  lines.push('Prix total : ' + price.toLocaleString('fr-FR') + ' €');

  return lines.join('\n');
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab !== 'size') document.getElementById('view-' + tab).classList.add('active');
  if (tab === 'config') window.sizeValidated = false;
  document.body.classList.toggle('on-tab-saved', tab === 'saved');
  document.body.classList.toggle('on-tab-size', tab === 'size');
  showTabBtns(tab);
  if (tab === 'saved') renderSaved();
  if (tab === 'size') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const br = document.getElementById('bottom-row');
    if (br && br.style.display === 'none') {
      br.style.display = window.innerWidth >= 768 ? 'flex' : 'block';
    }
    if (currentSizeMode) buildDimsGrid();
  }
}

// ─── RENDU MODÈLES ────────────────────────────────────────────────────────────
function renderModels() {
  const models = window._singleModel
    ? MODELS.filter(m => m.id === window._singleModel)
    : MODELS;

  // Adapter le titre de l'étape 1
  const stepLabel = document.querySelector('#view-config > div:first-child .step-label');
  const stepTitle = document.querySelector('#view-config > div:first-child .section-title');
  if (window._singleModel && stepLabel && stepTitle) {
    const m = MODELS.find(x => x.id === window._singleModel);
    stepLabel.textContent = 'Étape 1 sur 2';
    stepTitle.textContent = 'Configurer votre ' + m.name;
  }

  document.getElementById('model-grid').className = 'model-grid' + (window._singleModel ? ' single' : '');

  // Bouton "Changer de modèle" visible uniquement en mode single
  const changeBtn = document.getElementById('change-model-btn');
  if (changeBtn) changeBtn.style.display = window._singleModel ? 'block' : 'none';

  document.getElementById('model-grid').innerHTML = models.map(m => {
    const isSingle = !!window._singleModel;
    const hasPresets = isSingle && PRESETS[m.id];
    return `<div class="model-card ${selModel === m.id ? 'sel' : ''}" onclick="selectModel('${m.id}')">
      ${m.photo ? `<img class="mc-photo" src="${m.photo}" alt="${m.name}" loading="lazy">` : ''}
      <div class="mc-text">
        <span class="mc-badge">${m.badge}</span>
        <span class="mc-name">${m.name}</span>
        <span class="mc-desc">${m.desc}</span>
        <span class="mc-price">à partir de ${(m.basePrice + (m.assembly||0)).toLocaleString('fr-FR')} €</span>
      </div>
      ${hasPresets ? `<div class="preset-bar" id="preset-bar-${m.id}" style="display:block" onclick="event.stopPropagation()">
        <div class="preset-label">3 suggestions pour démarrer — tout reste modifiable</div>
        <div class="preset-btns">
          ${['Signature','Ti1','Ti2'].map(decl => `
            <div class="preset-btn-wrap">
              <button class="preset-btn-main ${window._activePreset === decl ? 'active' : ''}" onclick="loadPreset('${decl}')">${decl}</button>
              <button class="preset-btn-info" onclick="togglePresetInfoDt('${decl}', this)"><i class="ti ti-info-circle"></i></button>
              <div class="preset-info-popup" data-decl="${decl}"><strong>${decl}</strong>${PRESET_DESCS_DT[decl]}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
}

function selectModel(id) {
  selModel = id; selOpts = {}; openPost = null;
  ['btn-devis','btn-save','btn-reset','btn-size'].forEach(bid => {
    const b = document.getElementById(bid);
    if (b) { b.disabled = false; b.style.opacity = '1'; b.style.cursor = ''; }
  });
  // Passer en mode single uniquement si on vient d'un clic depuis la grille des 4 (pas déjà single)
  if (!window._singleModel) {
    window._singleModel = id;
    renderModels(); // re-render pour afficher mode single
  }
  // Charger Ti1 par défaut sauf si un preset est déjà actif (URL pré-config)
  if (!window._activePreset && PRESETS[id] && PRESETS[id]['Ti1']) {
    window._activePreset = 'Ti1';
    selOpts = {...PRESETS[id]['Ti1']};
    Object.keys(selOpts).forEach(postId => {
      const optId = selOpts[postId];
      if (!optId) return;
      FORCE_SELECT.forEach(rule => {
        if (rule.if_selected === optId) {
          Object.entries(rule.force).forEach(([fp, fid]) => {
            if (!selOpts[fp]) selOpts[fp] = fid;
          });
        }
      });
    });
  } else {
    autoSelectLocked(id);
  }
  document.getElementById('posts-section').style.display = 'block';
  renderModels();
  renderPosts();
  updateRecap(); updateFloatingPrice();
  document.getElementById('save-form-1').classList.remove('open'); document.getElementById('save-form-2').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ─── RENDU POSTES ─────────────────────────────────────────────────────────────
function renderPosts() {
  // Masquer le poste power s'il ne contient que pwr_all
  const visiblePosts = POST_META.filter(p => {
    if (p.id !== 'power') return true;
    return optionsFor('power', selModel).length > 1;
  });

  const pb = document.getElementById('prog-bar');
  if (pb) pb.innerHTML = visiblePosts.map(p =>
    '<div class="prog-step ' + (selOpts[p.id] ? 'done' : '') + '"></div>').join('');

  document.getElementById('posts-list').innerHTML = visiblePosts.map(p => {
    const opts = optionsFor(p.id, selModel);
    if (selOpts[p.id] && !opts.find(o => o.id === selOpts[p.id])) selOpts[p.id] = null;
    const selOpt = selOpts[p.id] ? opts.find(o => o.id === selOpts[p.id]) : null;
    const isOpen = openPost === p.id;

    const hasPhotos = opts.some(o => o.image && o.image.length > 0);

    const optsHTML = hasPhotos
      ? '<div class="opt-photo-grid">' +
          opts.map(o => {
            const rec = isRecommended(o, selModel);
            const locked = isLocked(o, selModel);
            let priceStr;
            if (locked) {
              const currentOpt = selOpts[p.id] ? opts.find(x => x.id === selOpts[p.id]) : null;
              const currentPrice = (currentOpt && !isLocked(currentOpt, selModel)) ? currentOpt.price : 0;
              if (currentPrice === 0) priceStr = '';
              else priceStr = (-currentPrice).toLocaleString('fr-FR') + ' €';
            } else {
              const currentOpt = selOpts[p.id] ? opts.find(x => x.id === selOpts[p.id]) : null;
              const currentPrice = (currentOpt && !isLocked(currentOpt, selModel)) ? currentOpt.price : 0;
              const diff = o.price - currentPrice;
              if (selOpts[p.id] === o.id) priceStr = '±0 €';
              else if (diff === 0) priceStr = '±0 €';
              else if (diff > 0) priceStr = '+' + diff.toLocaleString('fr-FR') + ' €';
              else priceStr = diff.toLocaleString('fr-FR') + ' €';
            }
            const imgHTML = o.image
              ? '<img src="' + o.image + '" alt="' + o.name + '" loading="lazy" onerror="this.style.display=\'none\'">'
              : '<div class="opc-img-placeholder"><i class="ti ti-photo"></i><span>photo à venir</span></div>';
            return '<div class="opt-photo-card ' + (selOpts[p.id] === o.id ? 'sel' : '') + '" onclick="selectOpt(\'' + p.id + '\',\'' + o.id + '\')">' +
              '<div class="opc-check"><i class="ti ti-check"></i></div>' +
              '<div class="opc-img-wrap">' + imgHTML + '</div>' +
              '<div class="opc-body">' +
                ((rec || isPresetDefault(p.id, o.id)) ? '<div class="opc-badges">' +
                  (isPresetDefault(p.id, o.id) ? '<span class="opc-badge-incl">inclus</span>' : '') +
                  (rec ? '<span class="opc-badge-rec"><i class="ti ti-star" style="font-size:8px"></i> Recommandé</span>' : '') +
                '</div>' : '') +
                '<div class="opc-name">' + o.name + '</div>' +
                (o.desc ? '<div class="opc-desc">' + o.desc + '</div>' : '') +
                (priceStr ? '<div class="opc-price' + (priceStr.startsWith('-') ? ' negative' : '') + '">' + priceStr + '</div>' : '') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>'
      : '<div class="opt-list">' +
          opts.map(o => {
            const rec = isRecommended(o, selModel);
            let priceStr;
            if (o.locked || isLocked(o, selModel)) {
              const currentOpt = selOpts[p.id] ? opts.find(x => x.id === selOpts[p.id]) : null;
              const currentPrice = (currentOpt && !isLocked(currentOpt, selModel)) ? currentOpt.price : 0;
              if (currentPrice === 0) priceStr = '—';
              else priceStr = (-currentPrice).toLocaleString('fr-FR') + ' €';
            } else {
              const currentOpt = selOpts[p.id] ? opts.find(x => x.id === selOpts[p.id]) : null;
              const currentPrice = (currentOpt && !isLocked(currentOpt, selModel)) ? currentOpt.price : 0;
              const diff = o.price - currentPrice;
              if (selOpts[p.id] === o.id) priceStr = '±0 €';
              else if (diff === 0) priceStr = '±0 €';
              else if (diff > 0) priceStr = '+' + diff.toLocaleString('fr-FR') + ' €';
              else priceStr = diff.toLocaleString('fr-FR') + ' €';
            }
            return '<div class="opt-item ' + (selOpts[p.id] === o.id ? 'sel' : '') + '" onclick="selectOpt(\'' + p.id + '\',\'' + o.id + '\')">' +
              '<div class="opt-radio"><div class="radio-dot"></div></div>' +
              '<div class="oi-info">' +
                '<div class="oi-name">' + o.name +
                  (isPresetDefault(p.id, o.id) ? '<span class="incl-badge">inclus</span>' : '') +
                  (rec ? '<span class="rec-badge"><i class="ti ti-star-filled" style="font-size:9px"></i> Recommandé</span>' : '') +
                '</div>' +
                '<div class="oi-desc">' + o.desc + '</div>' +
              '</div>' +
              '<div class="oi-meta">' +
                '<div class="oi-price' + (o.price < 0 ? ' negative' : '') + '">' + priceStr + '</div>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>';

    return '<div class="post-block" data-post-id="' + p.id + '">' +
      '<div class="post-hdr" onclick="togglePost(\'' + p.id + '\')">' +
        '<i class="ti ' + p.icon + ' ph-icon"></i>' +
        '<span class="ph-name">' + p.name + '</span>' +
        (selOpt ? '<span class="ph-sel">' + selOpt.name + '</span>' : '<span class="ph-pending">choisir →</span>') +
        '<i class="ti ti-chevron-down ph-chev ' + (isOpen ? 'open' : '') + '"></i>' +
      '</div>' +
      '<div class="post-opts ' + (isOpen ? 'open' : '') + '">' +
        optsHTML +
        (function() {
          if ((p.id === 'transmission' || p.id === 'pilotage') &&
              selOpts['transmission'] === 'trans_gr_sh_cuf' &&
              selOpts['pilotage'] === 'pilotage_gr_flat_ext') {
            const other = p.id === 'transmission' ? 'le cintre' : 'la transmission';
            return '<div class="force-undo" onclick="resetFlatBarForce()"><i class="ti ti-rotate-left"></i> Changer ce choix (réinitialise aussi ' + other + ')</div>';
          }
          if (p.id === 'power') {
            const pwrId = selOpts['power'];
            if (pwrId && pwrId !== 'pwr_all') {
              return '<div class="force-undo" onclick="resetForceLink(\'power\',\'transmission\',\'transmission\')"><i class="ti ti-rotate-left"></i> Changer ce choix (réinitialise la transmission et le powermeter)</div>';
            }
          }
          return '';
        })() +
      '</div>' +
    '</div>';
  }).join('');
}

function togglePost(id) {
  openPost = openPost === id ? null : id;
  renderPosts();
  if (openPost) {
    setTimeout(() => {
      const el = document.querySelector('[data-post-id="' + openPost + '"]');
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 50);
  }
}

// Règles de sélection forcée bidirectionnelle


function selectOpt(postId, optId) {
  updateFloatingPrice();
  selOpts[postId] = optId;

  // Transmission VTT : gestion des freins
  if (postId === 'transmission' && selModel === 'vtt_enduro') {
    const isSramVtt = optId && optId.startsWith('trans_vtt_sr_');
    if (isSramVtt) {
      // SRAM → frein_all interdit, pré-sélectionner DB8
      if (!selOpts['frein'] || selOpts['frein'] === 'frein_all') {
        selOpts['frein'] = 'frein_vtt_sr_db8';
      }
    } else {
      // Shimano → frein_all par défaut (Hope disponible aussi)
      if (!selOpts['frein'] || ['frein_vtt_sr_db8','frein_vtt_sr_mvs','frein_vtt_sr_mvu'].includes(selOpts['frein'])) {
        selOpts['frein'] = 'frein_all';
      }
    }
  }
  // Si frein_all avec trans SRAM VTT → bloquer
  if (postId === 'frein' && optId === 'frein_all' && selModel === 'vtt_enduro') {
    const isSramVtt = selOpts['transmission'] && selOpts['transmission'].startsWith('trans_vtt_sr_');
    if (isSramVtt) return;
  }

  // Vérifier si la config courante correspond à un preset
  const postes = ['fourche','roues','pneus','transmission','power','frein','pilotage','selle','tige','pedales'];
  const modelPresets = PRESETS[selModel];
  window._activePreset = null;
  if (modelPresets) {
    for (const [decl, preset] of Object.entries(modelPresets)) {
      if (postes.every(p => selOpts[p] === preset[p])) {
        window._activePreset = decl;
        break;
      }
    }
  }

  // 1. Si on change de transmission → remettre power sur pwr_all (sauf si pwr_all déjà)
  if (postId === 'transmission') {
    const currentPwr = selOpts['power'];
    if (currentPwr && currentPwr !== 'pwr_all') {
      // Le powermeter actuel est-il compatible avec la nouvelle transmission ?
      const pwrRule = FORCE_SELECT.find(r => r.if_selected === currentPwr && r.force.transmission);
      if (!pwrRule || pwrRule.force.transmission !== optId) {
        selOpts['power'] = 'pwr_all';
      }
    }
  }

  // 2. Sélections forcées (power → transmission, cintre plat ↔ CUES FLAT)
  FORCE_SELECT.forEach(rule => {
    if (rule.if_selected === optId) {
      Object.entries(rule.force).forEach(([forcePost, forceId]) => {
        const available = optionsFor(forcePost, selModel);
        if (available.find(o => o.id === forceId)) {
          selOpts[forcePost] = forceId;
        }
      });
    }
  });

  // 3. Effacer les sélections incompatibles dans les autres postes
  POST_META.forEach(p => {
    if (p.id === postId) return;
    if (!selOpts[p.id]) return;
    const allIncompat = POST_META.reduce((acc, pp) => {
      if (!selOpts[pp.id]) return acc;
      const o = ALL_OPTIONS[pp.id]?.find(x => x.id === selOpts[pp.id]);
      return o ? acc.concat(o.incompat) : acc;
    }, []);
    if (allIncompat.includes(selOpts[p.id])) selOpts[p.id] = null;
  });

  renderModels(); // mettre à jour surbrillance boutons preset
  renderPosts(); updateRecap(); updateFloatingPrice();
}

// ─── RÉCAPITULATIF ────────────────────────────────────────────────────────────
function updateRecap() {
  const model = MODELS.find(m => m.id === selModel);
  if (!model) return;
  const allDone = POST_META.every(p => !!selOpts[p.id]);
  const bottomRow = document.getElementById('bottom-row');
  if (bottomRow) bottomRow.style.display = allDone ? (window.innerWidth >= 768 ? 'flex' : 'block') : 'none';
  if (window.innerWidth < 768) document.getElementById('recap-col').style.display = allDone ? 'block' : 'none';
  if (!allDone) return;

  const { price, weight } = computeTotals(selModel, selOpts);

  const postIcons = {
    fourche: 'ti-git-fork', roues: 'ti-circle', pneus: 'ti-circle-dotted',
    transmission: 'ti-settings', power: 'ti-activity', frein: 'ti-hand-stop',
    pilotage: 'ti-adjustments-horizontal', selle: 'ti-armchair',
    tige: 'ti-arrows-vertical', pedales: 'ti-rotate-clockwise'
  };

  // Build cards
  let cards = '';
  POST_META.forEach(p => {
    const opt = optionsFor(p.id, selModel).find(o => o.id === selOpts[p.id]);
    if (!opt) return;
    let priceLabel = '', priceClass = '';
    if (opt.locked)       { priceLabel = 'Inclus';                                     priceClass = 'incl'; }
    else if (opt.price === 0) { priceLabel = '±0 €';                                   priceClass = 'zero'; }
    else if (opt.price > 0)   { priceLabel = '+' + opt.price.toLocaleString('fr-FR') + ' €'; priceClass = 'pos';  }
    else                      { priceLabel = opt.price.toLocaleString('fr-FR') + ' €'; priceClass = 'neg';  }

    const isModCard = !!(window._activePreset && PRESETS[selModel] &&
      PRESETS[selModel][window._activePreset] &&
      PRESETS[selModel][window._activePreset][p.id] !== selOpts[p.id]);
    cards += '<div class="recap-card">' +
      '<div class="recap-card-header"><i class="ti ' + (postIcons[p.id]||'ti-point') + '"></i>' + p.name +
        (isModCard ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F5C400;margin-left:5px;vertical-align:middle;"></span>' : '') +
      '</div>' +
      '<div class="recap-card-name">' + opt.name + '</div>' +
      '<div class="recap-card-price ' + priceClass + '">' + priceLabel + '</div>' +
    '</div>';
  });

  // Build price detail
  let details = '<div class="recap-price-detail"><span>Cadre — ' + model.name + '</span><span>' + model.basePrice.toLocaleString('fr-FR') + ' €</span></div>';
  if (model.assembly) {
    details += '<div class="recap-price-detail assembly"><span>Assemblage &amp; mise en route</span><span>' + model.assembly.toLocaleString('fr-FR') + ' €</span></div>';
  }
  POST_META.forEach(p => {
    const opt = optionsFor(p.id, selModel).find(o => o.id === selOpts[p.id]);
    if (!opt || isLocked(opt, selModel)) return;
    let cls = '', label = '';
    if (opt.price === 0)      { cls = ''; label = '±0 €'; }
    else if (opt.price > 0)   { cls = 'upgrade'; label = '+' + opt.price.toLocaleString('fr-FR') + ' €'; }
    else                      { cls = 'saving';  label = opt.price.toLocaleString('fr-FR') + ' €'; }
    details += '<div class="recap-price-detail ' + cls + '"><span>' + p.name + ' — ' + opt.name + '</span><span>' + label + '</span></div>';
  });

  // Prix total hors assemblage (surcouts options)
  const optionsTotal = price - model.basePrice;
  const baseLabel = 'Base : ' + model.basePrice.toLocaleString('fr-FR') + ' € <span style="font-size:11px;opacity:.6">(dont 300 € assemblage et mise en route)</span>';

  const recapHTML =
    '<div class="recap-visual">' +
      '<div class="recap-model-card">' +
        (model.photo ? '<img class="recap-model-photo" src="' + model.photo + '" alt="' + model.name + '">' : '') +
        '<div class="recap-model-info">' +
          '<div class="recap-model-badge">' + model.badge + '</div>' +
          '<div class="recap-model-name">' + model.name + '</div>' +
          '<div class="recap-model-price">' + baseLabel + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="recap-cards">' + cards + '</div>' +
      '<div class="recap-price-block">' +
        '<hr class="recap-price-divider">' +
        '<div class="recap-total-block">' +
          '<div class="recap-total-card" id="recap-total-card"><div class="recap-total-label">Prix total</div><div class="recap-total-val price" id="recap-total-price">' + price.toLocaleString('fr-FR') + ' €</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('recap-box-container').innerHTML = recapHTML;
}

function resetConfig() {
  window.sizeValidated = false;
  const currentModel = selModel; // conserver le modèle en cours
  selOpts = {}; openPost = null;
  document.getElementById('save-form-1').classList.remove('open'); document.getElementById('save-form-2').classList.remove('open');
  if (currentModel && PRESETS[currentModel] && PRESETS[currentModel]['Ti1']) {
    window._activePreset = 'Ti1';
    selOpts = { ...PRESETS[currentModel]['Ti1'] };
  }
  renderModels();
  renderPosts();
  updateRecap(); updateFloatingPrice();
  document.getElementById('posts-section').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── SAUVEGARDE ───────────────────────────────────────────────────────────────
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

// ─── SYNCHRONISER selSize DEPUIS LA GRILLE ACTUELLE ──────────────────────────
function syncSelSize() {
  const keyMap = {
    'dim-taille':'taille', 'dim-manivelle':'manivelle', 'dim-plateaux':'plateaux',
    'dim-cassette':'cassette', 'dim-cintre':'cintre', 'dim-potence':'potence',
    'dim-section':'section', 'dim-debattement':'debattement', 'dim-largeur-selle':'largeur_selle'
  };
  Object.entries(keyMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) {
      // select
      if (el.tagName === 'SELECT' && el.value) selSize[key] = el.value;
    } else {
      // dim-single : valeur déjà dans selSize via buildDimsGrid, rien à faire
    }
  });
}

function saveConfig() { doSave('save-name-1', 'save-toast-1'); }

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

// ─── MODAL COMMANDE ───────────────────────────────────────────────────────────
function buildSizeText() {
  const lines = [];
  if (selSize.taille)        lines.push('Taille cadre : ' + selSize.taille);
  if (selSize.manivelle)     lines.push('Manivelle : ' + selSize.manivelle + ' mm');
  if (selSize.plateaux)      lines.push('Plateau(x) : ' + selSize.plateaux);
  if (selSize.cassette)      lines.push('Cassette : ' + selSize.cassette);
  if (selSize.cintre)        lines.push('Cintre : ' + selSize.cintre + ' mm');
  if (selSize.potence)       lines.push('Potence : ' + selSize.potence + ' mm');
  if (selSize.section)       lines.push('Section pneu : ' + selSize.section);
  if (selSize.debattement)   lines.push('Débattement fourche : ' + selSize.debattement + ' mm');
  if (selSize.largeur_selle) lines.push('Largeur selle : ' + selSize.largeur_selle + ' mm');
  return lines.length ? lines.join('\n') : '—';
}

// ─── OUVERTURE MODAL DEPUIS ONGLET TAILLE ────────────────────────────────────
function openOrderModalFromSize() {
  syncSelSize();
  if (!window.sizeValidated) {
    // Pas de taille validée → alerte
    document.getElementById('size-alert-modal').classList.add('open');
  } else {
    openOrderModal();
  }
}
function closeSizeAlert() {
  document.getElementById('size-alert-modal').classList.remove('open');
}

function openOrderModal() {
  syncSelSize();
  document.getElementById('order-config-display').value = buildConfigText(selModel, selOpts);
  const sizeText = buildSizeText();
  const sizeField = document.getElementById('order-size-field');
  if (sizeText !== '—') {
    document.getElementById('order-size-display').value = sizeText;
    sizeField.style.display = 'block';
  } else {
    sizeField.style.display = 'none';
  }
  document.getElementById('order-modal').classList.add('open');
}
function openOrderModalFrom(id) {
  const cfg = savedConfigs.find(c => c.id === id);
  if (!cfg) return;
  document.getElementById('order-config-display').value = buildConfigText(cfg.selModel, cfg.selOpts);
  document.getElementById('order-modal').classList.add('open');
}
function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('open');
}
async function sendOrder() {
  const name    = document.getElementById('order-name').value.trim();
  const email   = document.getElementById('order-email').value.trim();
  const phone   = document.getElementById('order-phone').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const msg     = document.getElementById('order-msg').value.trim();
  const config  = document.getElementById('order-config-display').value;

  if (!name) { alert('Merci de renseigner votre nom et prénom.'); return; }
  if (!email) { alert('Merci de renseigner votre adresse email.'); return; }
  if (!address) { alert('Merci de renseigner votre adresse postale — elle est nécessaire pour établir votre devis.'); return; }

  const btnSend = document.querySelector('.btn-send');
  btnSend.textContent = 'Envoi en cours...';
  btnSend.disabled = true;

  try {
    // 1. Générer l'ID unique
    const configId = generateConfigId();

    // 2. Construire le JSON de config
    const model = MODELS.find(m => m.id === selModel);
    const { price } = computeTotals(selModel, selOpts);
    const configJson = {
      config_id: configId,
      modele: selModel,
      modele_nom: model ? model.name : '',
      preset: window._activePreset || null,
      composants: selOpts,
      dimensions: selSize || {},
      prix: price,
      nom_client: name,
      email_client: email,
      adresse_postale: address,
    };

    // 3. Sauvegarder dans Supabase
    await saveConfigToSupabase({
      config_id: configId,
      modele: selModel,
      preset: window._activePreset || null,
      prix: price,
      config_json: configJson,
      nom_client: name,
      email_client: email,
      statut: 'devis',
    });

    // 4. URL partageable
    const shareUrl = 'https://obviouscycles.github.io/configurateur/configurateur/proto14.html?config=' + configId;

    // 5. Envoyer via Formspree
    const response = await fetch('https://formspree.io/f/mqeoqewy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nom: name,
        email: email,
        telephone: phone || '—',
        adresse_postale: address,
        configuration: config,
        dimensions: buildSizeText(),
        message: msg || '—',
        config_id: configId,
        url_config: shareUrl,
        _replyto: email,
        _subject: '[' + configId + '] Demande de devis OBVIOUS ON DEMAND — ' + name,
      })
    });

    if (response.ok) {
      closeOrderModal();
      ['order-name','order-email','order-phone','order-address','order-msg'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      // Afficher l'ID et l'URL au visiteur
      // Envoyer mail visiteur via Brevo
      if (email) {
        try {
          const model = MODELS.find(m => m.id === selModel);
          const { price } = computeTotals(selModel, selOpts);
          await sendBrevoEmail({
            toEmail: email,
            toName: name,
            configId,
            shareUrl,
            modeleNom: model ? model.name : selModel,
            prix: price,
          });
        } catch(e) {
          console.warn('Mail visiteur non envoyé:', e);
          // Ne pas bloquer si Brevo échoue
        }
      }
      alert('✅ Votre demande a bien été envoyée !\n\nVotre référence : ' + configId + '\n\nUn email de confirmation vous a été envoyé.\n\nNous vous recontacterons sous 48h.');
    } else {
      alert("Une erreur s'est produite. Merci de réessayer ou de nous contacter directement.");
    }
  } catch(e) {
    console.error('sendOrder error:', e);
    alert("Impossible d'envoyer le formulaire. Vérifiez votre connexion internet.");
  } finally {
    btnSend.textContent = '↗ Envoyer';
    btnSend.disabled = false;
  }
}


// Réinitialiser un duo forcé (cintre plat ↔ CUES FLAT, powermeter ↔ transmission)
function resetForceLink(postA, postB, scrollTo) {
  selOpts[postA] = null;
  selOpts[postB] = null;
  openPost = scrollTo || postA;
  renderPosts(); updateRecap(); updateFloatingPrice();
  setTimeout(() => {
    const el = document.querySelector('[data-post-id="' + (scrollTo || postA) + '"]');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, 50);
}
// Alias pour compatibilité
function resetFlatBarForce() { resetForceLink('transmission','pilotage','transmission'); }


// Pré-configurations depuis l'onglet Gamme 2026


function loadPreset(decl) {
  const preset = PRESETS[selModel] && PRESETS[selModel][decl];
  if (!preset) return;
  window._activePreset = decl;
  selOpts = {...preset};
  // Appliquer FORCE_SELECT
  Object.keys(selOpts).forEach(postId => {
    const optId = selOpts[postId];
    if (!optId) return;
    FORCE_SELECT.forEach(rule => {
      if (rule.if_selected === optId) {
        Object.entries(rule.force).forEach(([fp, fid]) => {
          if (!selOpts[fp]) selOpts[fp] = fid;
        });
      }
    });
  });
  renderModels(); // mettre à jour la surbrillance du bouton actif
  document.getElementById('posts-section').style.display = 'block';
  renderPosts();
  updateRecap(); updateFloatingPrice();
  // Pas de scroll — on reste en haut de page
}


// ─── MODALE CHANGER DE MODÈLE ──────────────────────────────────────
function openChangeModelModal() {
  const modal = document.getElementById('modal-change-model');
  const grid = document.getElementById('cmm-grid');
  if (!modal || !grid) return;
  grid.innerHTML = MODELS.map(m => {
    const isCurrent = m.id === selModel;
    return '<div onclick="changeModelTo(\'' + m.id + '\')" style="border:' + (isCurrent ? '2px solid #F5C400' : '0.5px solid #333') + ';background:' + (isCurrent ? '#1a1500' : '#111') + ';cursor:pointer;overflow:hidden;transition:border-color .15s;" onmouseover="this.style.borderColor=\'#555\';" onmouseout="this.style.borderColor=\'' + (isCurrent ? '#F5C400' : '#333') + '\';">' +
      (m.photo ? '<img src="' + m.photo + '" style="width:100%;height:100px;object-fit:cover;display:block;">' : '') +
      '<div style="padding:10px 12px;">' +
        '<div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">' + m.badge + '</div>' +
        '<div style="font-size:14px;font-weight:500;color:' + (isCurrent ? '#FFF8D6' : '#f2f2f2') + ';margin-bottom:2px;">' + m.name + (isCurrent ? ' <span style="font-size:10px;color:#F5C400;">✓ actuel</span>' : '') + '</div>' +
        '<div style="font-size:11px;color:#888;line-height:1.3;margin-bottom:6px;">' + m.desc + '</div>' +
        '<div style="font-size:12px;color:' + (isCurrent ? '#F5C400' : '#888') + ';">à partir de ' + (m.basePrice + (m.assembly||0)).toLocaleString('fr-FR') + ' €</div>' +
      '</div>' +
    '</div>';
  }).join('');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeChangeModelModal() {
  const modal = document.getElementById('modal-change-model');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function changeModelTo(modelId) {
  if (modelId === selModel) { closeChangeModelModal(); return; }
  // Forcer le reset de _singleModel pour que renderModels affiche le bon modèle
  window._singleModel = modelId;
  window._activePreset = null;
  selectModel(modelId);
  closeChangeModelModal();
}

// Fermer modale au clic sur fond
document.addEventListener('click', e => {
  const modal = document.getElementById('modal-change-model');
  if (modal && e.target === modal) closeChangeModelModal();
});


// Descriptions préconfigs desktop

function togglePresetInfoDt(decl, btn) {
  // Fermer les autres
  document.querySelectorAll('.preset-info-popup').forEach(p => {
    if (p.dataset.decl !== decl) { p.style.display = 'none'; }
  });
  const popup = btn.nextElementSibling;
  if (popup) popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
  event.stopPropagation();
}
document.addEventListener('click', () => {
  document.querySelectorAll('.preset-info-popup').forEach(p => p.style.display = 'none');
});

// ════════════════════════════════════════════════════════════════
// PROTO13 — STEPPER DESKTOP
// ════════════════════════════════════════════════════════════════
let dtStep = 1;

function dtGo(n) {
  if (window.innerWidth < 768) return;
  if (n > 1 && !selModel) return;
  dtStep = n;
  document.body.classList.toggle('dt-step-4', n === 5 && v2Parcours === 'standard');
  dtRender();
  v2UpdateStepper();
}

function dtRender() {
  if (window.innerWidth < 768) return;
  const n = dtStep;
  // Activer "Nouvelle configuration" dès qu'un modèle est sélectionné
  const resetBtn = document.getElementById('dtr-btn-reset');
  if (resetBtn) {
    if (selModel) { resetBtn.style.opacity='1'; resetBtn.style.pointerEvents='auto'; }
    else { resetBtn.style.opacity='.3'; resetBtn.style.pointerEvents='none'; }
  }

  // Stepper
  for (let i = 1; i <= 5; i++) {
    const s = document.getElementById('dts-' + i);
    const d = document.getElementById('dts-dot-' + i);
    if (!s || !d) continue;
    s.className = 'dts-step' + (i === n ? ' active' : i < n ? ' done' : '');
    d.innerHTML = i < n ? '<i class="ti ti-check" style="font-size:9px;"></i>' : i === 5 ? '→' : String(i);
  }
  const model = MODELS.find(m => m.id === selModel);
  const el = (id) => document.getElementById(id);
  if (el('dts-d1')) el('dts-d1').textContent = model ? model.name : '';
  if (el('dts-d2')) el('dts-d2').textContent = window._activePreset || (model ? 'Base' : '');
  if (el('dts-d3')) el('dts-d3').textContent = window.sizeValidated ? 'Enregistrée ✓' : 'Optionnel';

  // Modif count stepper
  const mc = dtModifCount();
  if (el('dts-modif')) el('dts-modif').style.display = mc > 0 ? 'flex' : 'none';
  if (el('dts-modif-txt')) el('dts-modif-txt').textContent = mc + ' perso.';

  // Sections
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  const active = document.getElementById('dt-s' + n);
  if (active) active.classList.add('active');

  // Bouton next step 1
  const next1 = el('dt-next-1');
  if (next1) next1.disabled = !selModel;

  // Bouton next step 3
  const next3lbl = el('dt-next-taille-lbl');
  v2SetTailleLabel(window.sizeValidated);

  // Bouton "changer de vélo" dans le récap — visible après reset


  // Rendu spécifique V2
  if (n === 1) dtRenderS1();
  if (n === 2) dtRenderS2();
  if (n === 3) {
    document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
    document.getElementById('dt-s3bif')?.classList.add('active');
  }
  if (n === 4) {
    if (v2Parcours === 'standard') { dtRenderS3(); setTimeout(() => dtToggleSizeMode('guide'), 50); }
    else { evoRender(); }
  }
  if (n === 5) {
    if (v2Parcours === 'standard') { document.body.classList.add('dt-step-4'); dtRenderS4(); }
  }

  // Récap droit (pas aux étapes 4evo/5std/5perf)
  if (n !== 5) dtRenderRecap();

  // Scroll haut
  const main = el('dt-main');
  if (main) main.scrollTop = 0;
}

// ── Étape 1 : grille modèles ──
function dtRenderS1() {
  const grid = document.getElementById('dt-model-grid');
  if (!grid) return;
  grid.className = 'model-grid';
  grid.innerHTML = MODELS.map(m => {
    const sel = m.id === selModel;
    const hasPresets = PRESETS[m.id];
    return '<div class="model-card' + (sel ? ' sel' : '') + '" onclick="dtSelectModel(\'' + m.id + '\')">' +
      '<img class="mc-photo" src="' + (m.photo||'') + '" alt="' + m.name + '" loading="lazy">' +
      '<div class="mc-body">' +
        '<span class="mc-badge">' + m.badge + '</span>' +
        '<span class="mc-name">' + m.name + '</span>' +
        '<span class="mc-desc">' + (m.desc||'') + '</span>' +
        '<span class="mc-price">à partir de ' + (m.basePrice + (m.assembly||0)).toLocaleString('fr-FR') + ' €</span>' +
      '</div>' +
      (hasPresets && sel ? dtPresetBar(m.id) : '') +
    '</div>';
  }).join('');
}

function dtPresetBar(modelId) {
  const infoPopupId = 'dt-preset-info-' + modelId;
  return '<div class="preset-bar" onclick="event.stopPropagation()">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<div class="preset-label" style="margin-bottom:0;color:#F5C400;">3 suggestions pour démarrer</div>' +
      '<button onclick="toggleDtPresetInfo(\'' + infoPopupId + '\')" style="background:none;border:none;color:#F5C400;font-size:15px;cursor:pointer;padding:0;line-height:1;" title="En savoir plus"><i class="ti ti-info-circle"></i></button>' +
    '</div>' +
    '<div id="' + infoPopupId + '" style="display:none;font-size:12px;color:#aaa;background:#111;border:0.5px solid #333;padding:10px 12px;margin-bottom:10px;line-height:1.7;">' +
      Object.entries(PRESET_DESCS_DT).map(([k,v]) =>
        '<div><span style="color:#F5C400;font-weight:600;">' + k + '</span> — ' + v + '</div>'
      ).join('') +
      '<div style="font-size:11px;color:#555;margin-top:4px;">Tout reste modifiable.</div>' +
    '</div>' +
    '<div class="preset-btns">' +
    ['Signature','Ti1','Ti2'].map(decl =>
      '<button class="preset-btn' + (window._activePreset===decl?' active':'') + '" onclick="dtLoadPreset(\'' + decl + '\')">' + decl + '</button>'
    ).join('') +
    '</div></div>';
}

function toggleDtPresetInfo(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function dtSelectModel(id) {
  // Réinitialiser le _init des panels step 3 si on change de modèle
  if (id !== selModel) {
    const gz = document.getElementById('dt-s3-panel-guide');
    const mz = document.getElementById('dt-s3-panel-manual');
    if (gz) gz._init = false;
    if (mz) mz._init = false;
  }
  selModel = id; selOpts = {}; openPost = null;
  window._singleModel = id; window._activePreset = null;
  const preset = PRESETS[id] && PRESETS[id]['Ti1'];
  if (preset) { window._activePreset = 'Ti1'; selOpts = {...preset}; }
  Object.keys(selOpts).forEach(pid => {
    const optId = selOpts[pid]; if (!optId) return;
    FORCE_SELECT.forEach(rule => {
      if (rule.if_selected === optId)
        Object.entries(rule.force).forEach(([fp,fid]) => { if (!selOpts[fp]) selOpts[fp]=fid; });
    });
  });
  // Activer les boutons du récap
  ['dtr-btn-devis','dtr-btn-save'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
  });
  // Passer directement à l'étape 2
  dtStep = 2; dtRender();
}

function dtLoadPreset(decl) {
  const preset = PRESETS[selModel] && PRESETS[selModel][decl];
  if (!preset) return;
  window._activePreset = decl; selOpts = {...preset};
  Object.keys(selOpts).forEach(pid => {
    const optId = selOpts[pid]; if (!optId) return;
    FORCE_SELECT.forEach(rule => {
      if (rule.if_selected === optId)
        Object.entries(rule.force).forEach(([fp,fid]) => { if (!selOpts[fp]) selOpts[fp]=fid; });
    });
  });
  dtRender();
}



function dtToggleOOD() {
  const btn = document.getElementById('dt-ood-btn');
  let popup = document.getElementById('dt-ood-popup');

  // Créer le popup dans body s'il n'existe pas encore
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'dt-ood-popup';
    popup.style.cssText = 'display:none;position:fixed;width:280px;background:#1a1a1a;border:0.5px solid #444;padding:1.5rem;z-index:2000;box-shadow:0 8px 40px rgba(0,0,0,.7);';
    popup.innerHTML =
      '<button onclick="dtToggleOOD()" style="position:absolute;top:10px;right:12px;background:none;border:none;color:#666;font-size:18px;cursor:pointer;line-height:1;padding:0;">×</button>' +
      '<div style="font-size:10px;color:#F5C400;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.75rem;">OBVIOUS ON DEMAND — Pour aller plus loin</div>' +
      '<p style="font-size:13px;color:#f2f2f2;line-height:1.6;margin-bottom:.5rem;font-weight:500;">Géométrie personnalisée, adaptations cadre, sur-mesure total.</p>' +
      '<p style="font-size:12px;color:#888;line-height:1.5;margin-bottom:1.25rem;">OBVIOUS ON DEMAND propose 3 niveaux supplémentaires de personnalisation.</p>' +
      '<a href="https://www.obviouscycles.com/velos-titane/velo-titane-sur-mesure/" target="_blank" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#1a1a00;text-decoration:none;font-weight:700;background:#F5C400;padding:10px 14px;width:100%;box-sizing:border-box;justify-content:center;">' +
        '<i class="ti ti-external-link" style="font-size:13px;"></i> Découvrir OBVIOUS ON DEMAND' +
      '</a>';
    document.body.appendChild(popup);
  }

  const isOpen = popup.style.display !== 'none';
  if (isOpen) { popup.style.display = 'none'; return; }

  // Positionner à droite du bouton
  popup.style.display = 'block';
  if (btn) {
    const r = btn.getBoundingClientRect();
    const pw = 280, ph = popup.offsetHeight;
    const left = r.right + 8;
    let top = r.top + r.height / 2 - ph / 2;
    top = Math.max(60, Math.min(top, window.innerHeight - ph - 20));
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
  }

  // Fermer au clic extérieur
  setTimeout(() => {
    document.addEventListener('click', function closeOOD(e) {
      if (!popup.contains(e.target) && e.target.id !== 'dt-ood-btn' && !btn.contains(e.target)) {
        popup.style.display = 'none';
        document.removeEventListener('click', closeOOD);
      }
    });
  }, 10);
}
function dtUpdateSavedBadge() {
  loadSaved(); // sync avec localStorage
  const cnt = document.getElementById('dt-saved-count');
  if (!cnt) return;
  const n = savedConfigs ? savedConfigs.length : 0;
  if (n > 0) { cnt.textContent = n; cnt.style.display = 'inline-block'; }
  else cnt.style.display = 'none';
}

function dtShowSaved() {
  loadSaved(); // sync localStorage → savedConfigs
  dtStep = 4;
  document.body.classList.add('dt-step-4');
  const inner = document.getElementById('dt-s6devis-inner');
  if (!inner) return;
  
  const configs = savedConfigs || [];
  if (configs.length === 0) {
    inner.innerHTML = '<div style="padding:2rem 0;"><p class="section-title" style="color:#f2f2f2;margin-bottom:1rem;">Mes configurations</p><p style="color:#666;font-size:14px;">Aucune configuration sauvegardée.<br><span style="font-size:12px;color:#444;">Utilisez le bouton \"Sauvegarder\" pour en enregistrer une.</span></p></div>';
  } else {
    inner.innerHTML = '<p class="section-title" style="color:#f2f2f2;margin-bottom:1.5rem;">Mes configurations (' + configs.length + ')</p>' +
      configs.map((c, idx) => {
        // Assigner un id si manquant (anciennes configs)
        if (!c.id) { c.id = 'cfg_' + idx + '_' + Date.now(); savedConfigs[idx] = c; persistSaved(); }
        const model = MODELS.find(m => m.id === (c.selModel || c.model));
        const cid = String(c.id).replace(/'/g, "\\'");
        return '<div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;margin-bottom:8px;">' +
          (model && model.photo ? '<img src="' + model.photo + '" style="width:60px;height:40px;object-fit:cover;flex-shrink:0;border:0.5px solid #222;">' : '') +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:500;color:#f2f2f2;margin-bottom:2px;">' + c.name + '</div>' +
            '<div style="font-size:11px;color:#666;">' + (model ? model.name : '') + (c.preset ? ' · ' + c.preset : '') + (c.date ? ' · ' + c.date : '') + '</div>' +
          '</div>' +
          '<button onclick="dtLoadSaved(\'' + cid + '\')" style="background:#F5C400;border:none;color:#1a1a00;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">Charger</button>' +
          '<button onclick="dtDeleteSaved(\'' + cid + '\')" style="background:none;border:0.5px solid #444;color:#666;padding:7px 10px;font-size:12px;cursor:pointer;margin-left:4px;font-family:var(--font);">✕</button>' +
        '</div>';
      }).join('');
  }
  // Activer dt-s4 (afficher le contenu)
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  const s4el = document.getElementById('dt-s4');
  if (s4el) s4el.classList.add('active');
  // Mettre à jour stepper
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('dts-' + i);
    const d = document.getElementById('dts-dot-' + i);
    if (!s || !d) continue;
    s.className = 'dts-step' + (i === 4 ? ' active' : i < 4 ? ' done' : '');
    d.innerHTML = i < 4 ? '<i class="ti ti-check" style="font-size:9px;"></i>' : '→';
  }
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}


function dtLoadSaved(id) {
  // Chercher par id, ou par index si l'id est numérique (ancien format)
  let cfg = savedConfigs.find(c => c.id === id || c.id === String(id));
  if (!cfg) cfg = savedConfigs[parseInt(id)] || null; // fallback index
  if (!cfg) return;
  selModel = cfg.selModel || cfg.model;
  selOpts = {...(cfg.selOpts || cfg.opts || {})};
  selSize = {...(cfg.selSize || cfg.size || {})};
  window._activePreset = cfg.preset || null;
  window._singleModel = selModel;
  window.sizeValidated = !!(cfg.selSize && Object.keys(cfg.selSize || {}).length > 0);
  // Retirer dt-step-4 AVANT dtRender pour que dt-main soit visible
  document.body.classList.remove('dt-step-4');
  // Activer les boutons du récap
  ['dtr-btn-devis','dtr-btn-save','dtr-btn-reset'].forEach(id2 => {
    const el = document.getElementById(id2);
    if (el) { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
  });
  dtStep = 2; dtRender();
}

function dtDeleteSaved(id) {
  savedConfigs = savedConfigs.filter(c => c.id !== id);
  persistSaved();
  dtUpdateSavedBadge();
  dtShowSaved();
}

function dtShowAllModels() {
  window._singleModel = null; window._activePreset = null;
  selModel = null; selOpts = {}; openPost = null;
  dtStep = 1;
  dtRender();
}

// ── Étape 2 : split modèle | composants ──
function dtRenderS2() {
  // Left : fiche modèle
  const left = document.getElementById('dt-s2-left');
  const model = MODELS.find(m => m.id === selModel);
  if (left && model) {
    left.innerHTML =
      '<img class="mc-photo" src="' + (model.photo||'') + '" alt="' + model.name + '" loading="lazy">' +
      '<div class="mc-text">' +
        '<span class="mc-badge">' + model.badge + '</span>' +
        '<span class="mc-name">' + model.name + '</span>' +
        '<span class="mc-desc">' + (model.desc||'') + '</span>' +
        '<span class="mc-price">à partir de ' + (model.basePrice + (model.assembly||0)).toLocaleString('fr-FR') + ' €</span>' +
      '</div>' +
      dtPresetBar(model.id);
  }
  // Right : composants — réutiliser renderPosts vers dt-posts-list
  dtRenderPosts();
}

// Rendu des postes dans dt-posts-list — délégation d'événements pour éviter l'escaping
function dtRenderPosts() {
  const container = document.getElementById('dt-posts-list');
  if (!container || !selModel) return;
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise'};

  container.innerHTML = POST_META.map(p => {
    const opts = optionsFor(p.id, selModel);
    if (!opts.length) return '';
    // Masquer "mesure de puissance" si une seule option (= non disponible)
    if (p.id === 'power' && opts.length <= 1) return '';
    const selOpt = opts.find(o => o.id === selOpts[p.id]);
    const isOpen = openPost === p.id;
    const curPrice = selOpt && !isLocked(selOpt, selModel) ? selOpt.price : 0;
    const hasPhotos = opts.some(o => o.image && o.image.length > 0 && o.image !== 'assets/no_option.png');

    function buildOpt(o) {
      const sel2 = selOpts[p.id] === o.id;
      const isDef = isPresetDefault(p.id, o.id);
      const rec2 = isRecommended(o, selModel);
      const d = o.price - curPrice;
      const diff = isDef ? 'inclus' : sel2 ? '±0 €' : d===0 ? '±0 €' : (d>0?'+':'')+d.toLocaleString('fr-FR')+' €';
      if (hasPhotos) {
        const imgHtml = (o.image && o.image !== 'assets/no_option.png')
          ? '<img src="' + o.image + '" alt="" loading="lazy" style="width:100%;height:80px;object-fit:cover;display:block;">'
          : '<div class="opc-img-placeholder"><i class="ti ti-photo"></i></div>';
        return '<div class="opt-photo-card' + (sel2?' sel':'') + '" data-pid="' + p.id + '" data-oid="' + o.id + '">' +
          '<div class="opc-check"><i class="ti ti-check"></i></div>' +
          '<div class="opc-img-wrap">' + imgHtml + '</div>' +
          '<div class="opc-body">' +
          ((rec2||isDef)?'<div class="opc-badges">'+(isDef?'<span class="opc-badge-incl">inclus</span>':'')+(rec2?'<span class="opc-badge-rec"><i class="ti ti-star" style="font-size:8px;"></i> Recommandé</span>':'')+'</div>':'') +
          '<div class="opc-name">' + o.name + '</div>' +
          (o.desc?'<div class="opc-desc">'+o.desc+'</div>':'') +
          '<div class="opc-price' + (d<0?' negative':'') + '">' + diff + '</div>' +
          '</div></div>';
      } else {
        return '<div class="opt-item' + (sel2?' sel':'') + '" data-pid="' + p.id + '" data-oid="' + o.id + '">' +
          '<div class="opt-radio"><div class="radio-dot"></div></div>' +
          '<div class="oi-info"><div class="oi-name">' + o.name + (isDef?'<span class="incl-badge">inclus</span>':'') + '</div>' + (o.desc?'<div class="oi-desc">'+o.desc+'</div>':'') + '</div>' +
          '<div class="oi-meta"><div class="oi-price' + (d<0?' negative':'') + '">' + diff + '</div></div>' +
          '</div>';
      }
    }

    const optHtml = (hasPhotos ? '<div class="opt-photo-grid">' : '<div class="opt-list">') +
      opts.map(buildOpt).join('') + '</div>';

    const _isModDt = !!(window._activePreset && PRESETS[selModel] && PRESETS[selModel][window._activePreset] && PRESETS[selModel][window._activePreset][p.id] !== selOpts[p.id]);
    return '<div class="post-block" data-post-id="' + p.id + '">' +
      '<div class="post-hdr" data-toggle="' + p.id + '">' +
        '<i class="ti ' + (icons[p.id]||'ti-point') + ' ph-icon"></i>' +
        '<span class="ph-name">' + p.name + (_isModDt ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F5C400;margin-left:6px;vertical-align:middle;"></span>' : '') + '</span>' +
        (selOpt?'<span class="ph-sel">'+selOpt.name+'</span>':'<span class="ph-pending">choisir →</span>') +
        '<i class="ti ti-chevron-down ph-chev' + (isOpen?' open':'') + '"></i>' +
      '</div>' +
      '<div class="post-opts' + (isOpen?' open':'') + '">' + optHtml + '</div>' +
    '</div>';
  }).join('');

  // Délégation d'événements (évite tout problème d'escaping onclick)
  container.onclick = function(e) {
    // Clic sur toggle post
    const hdr = e.target.closest('[data-toggle]');
    if (hdr) { dtTogglePost(hdr.dataset.toggle); return; }
    // Clic sur option
    const opt = e.target.closest('[data-pid][data-oid]');
    if (opt) { dtSelectOpt(opt.dataset.pid, opt.dataset.oid); return; }
  };

  dtRenderRecap();
}

function dtSelectOpt(postId, optId) {
  const opt = optionsFor(postId, selModel).find(o => o.id === optId);
  if (!opt) return;
  // Ne pas bloquer les options locked — elles sont sélectionnables
  selOpts[postId] = optId;
  // FORCE_SELECT
  FORCE_SELECT.forEach(rule => {
    if (rule.if_selected === optId)
      Object.entries(rule.force).forEach(([fp,fid]) => {
        const av = optionsFor(fp, selModel);
        if (av.find(o => o.id === fid)) selOpts[fp] = fid;
      });
  });
  dtRenderPosts();
}

function dtTogglePost(postId) {
  openPost = openPost === postId ? null : postId;
  dtRenderPosts();
  if (openPost) {
    setTimeout(() => {
      const el = document.querySelector('#dt-posts-list .post-block[data-post-id="'+postId+'"]');
      if (el) { const r = document.getElementById('dt-s2-right'); if (r) r.scrollTo({top: el.offsetTop - 56, behavior:'smooth'}); }
    }, 50);
  }
}

// ── Étape 3 : taille ──
function dtRenderS3() {
  const cardsZone = document.getElementById('dt-s3-cards');
  if (!cardsZone) return;

  // Mettre les cartes dans la zone
  const cardGuide  = document.getElementById('card-guide');
  const cardManual = document.getElementById('card-manual');
  cardsZone.innerHTML = '';
  if (cardGuide)  { cardGuide.style.cursor='pointer'; cardGuide.onclick=()=>dtToggleSizeMode('guide');  cardsZone.appendChild(cardGuide); }
  if (cardManual) { cardManual.style.cursor='pointer'; cardManual.onclick=()=>dtToggleSizeMode('manual'); cardsZone.appendChild(cardManual); }

  // Mettre le contenu des panels dans leurs zones dédiées (par innerHTML, pas move)
  const guideZone  = document.getElementById('dt-s3-panel-guide');
  const manualZone = document.getElementById('dt-s3-panel-manual');
  const panelGuide  = document.getElementById('panel-guide');
  const panelManual = document.getElementById('panel-manual');

  if (guideZone && panelGuide && !guideZone._init) {
    guideZone.appendChild(panelGuide);
    panelGuide.classList.add('open');
    guideZone._init = true;
  }
  if (manualZone && panelManual && !manualZone._init) {
    manualZone.appendChild(panelManual);
    panelManual.classList.add('open');
    manualZone._init = true;
  }
  // Toujours reconstruire la grille dims (modèle peut avoir changé)
  if (typeof buildDimsGrid === 'function') buildDimsGrid();

  // Cacher les deux au départ
  if (guideZone)  guideZone.style.display  = 'none';
  if (manualZone) manualZone.style.display = 'none';

  // Hooker les fonctions de calcul
  if (!window._dtCalcHooked) {
    window._dtCalcHooked = true;
    const _calcSize = window.calcSize;
    window.calcSize = function() { if (_calcSize) _calcSize(); setTimeout(dtCheckSizeResult, 400); };
    const _chooseUsage = window.chooseUsage;
    window.chooseUsage = function(u) { if (_chooseUsage) _chooseUsage(u); setTimeout(dtCheckSizeResult, 200); };
    const _validateDims = window.validateDims;
    window.validateDims = function() { if (_validateDims) _validateDims(); window.sizeValidated=true; setTimeout(dtCheckSizeResult, 100); };
  }
}

function dtCheckSizeResult() {
  const guideResult = document.getElementById('guide-result');
  const dimsResult  = document.getElementById('dims-summary');
  let validated = false;

  // Guide result
  if (guideResult && guideResult.classList.contains('show')) {
    const main = document.getElementById('guide-result-main');
    if (main && main.textContent) { window.sizeValidated = true; validated = true; }
  }
  // Manual result
  if (dimsResult && dimsResult.classList.contains('show')) {
    window.sizeValidated = true; validated = true;
  }
  // selSize rempli
  if (!validated && window.sizeValidated) validated = true;

  if (validated) {
    v2SetTailleLabel(true);
  }
}

function dtToggleSizeMode(mode) {
  const guideZone  = document.getElementById('dt-s3-panel-guide');
  const manualZone = document.getElementById('dt-s3-panel-manual');
  const cardGuide  = document.getElementById('card-guide');
  const cardManual = document.getElementById('card-manual');

  if (cardGuide)  cardGuide.classList.toggle('active',  mode === 'guide');
  if (cardManual) cardManual.classList.toggle('active', mode === 'manual');

  if (guideZone)  guideZone.style.display  = mode === 'guide'  ? 'block' : 'none';
  if (manualZone) manualZone.style.display = mode === 'manual' ? 'block' : 'none';

  // Reset résultat pour permettre un nouveau calcul
  const dtResult = document.getElementById('dt-s3-result');
  if (dtResult) { dtResult.style.display = 'none'; dtResult.innerHTML = ''; }
  const lbl = document.getElementById('dt-next-taille-lbl');
  if (lbl) lbl.textContent = 'Continuer sans taille';

  // Reset résultats proto12 pour guide
  if (mode === 'guide') {
    const guideResult = document.getElementById('guide-result');
    if (guideResult) guideResult.classList.remove('show');
    const overlap = document.getElementById('size-overlap');
    if (overlap) overlap.style.display = 'none';
  }
}

// ── Étape 4 : récap plein écran ──
function dtRenderS4() {
  const inner = document.getElementById('dt-s6devis-inner');
  if (!inner || !selModel) return;
  const model = MODELS.find(m => m.id === selModel);
  const { price } = computeTotals(selModel, selOpts);
  const preset = (window._activePreset && PRESETS[selModel]) ? PRESETS[selModel][window._activePreset] : {};
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise'};
  const mc = dtModifCount();

  inner.innerHTML =
    '<div style="display:grid;grid-template-columns:'+(document.body.classList.contains('config-shared-mode')?'340px':'280px')+' 1fr;gap:2rem;align-items:start;">' +
      // Colonne gauche : photo + infos
      '<div>' +
        (model.photo ? '<img src="'+model.photo+'" style="width:100%;height:'+(document.body.classList.contains('config-shared-mode')?'280px':'180px')+';object-fit:cover;display:block;border:0.5px solid #222;margin-bottom:1rem;">' : '') +
        '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">'+model.badge+'</div>' +
        '<div style="font-size:20px;font-weight:500;color:#f2f2f2;margin-bottom:4px;">'+model.name+'</div>' +
        (window._activePreset ? '<div style="font-size:11px;color:#666;margin-bottom:.75rem;">'+window._activePreset+'</div>' : '<div style="min-height:1.4em;"></div>') +
        '<div style="font-size:28px;font-weight:700;color:#F5C400;margin-bottom:.5rem;">'+price.toLocaleString('fr-FR')+' €</div>' +
        (mc > 0 ? '<div style="font-size:13px;color:#F5C400;display:flex;align-items:center;gap:6px;margin-bottom:1rem;font-weight:500;"><span style="width:7px;height:7px;border-radius:50%;background:#F5C400;display:inline-block;flex-shrink:0;"></span>'+mc+' personnalisation'+(mc>1?'s':'')+' · '+window._activePreset+'</div>' : '') +
        (!document.body.classList.contains('config-shared-mode') ?
          '<div style="display:flex;flex-direction:column;gap:8px;margin-top:1rem;">' +
            '<button class="dtr-btn-main" onclick="openOrderModal()"><i class="ti ti-send"></i> Recevoir mon devis personnalisé</button>' +
            '<button class="dtr-btn-sec" onclick="dtQuickSave()"><i class="ti ti-bookmark"></i> Sauvegarder</button>' +
            '<button class="dtr-btn-sec" onclick="dtReset()"><i class="ti ti-refresh"></i> Nouvelle configuration</button>' +
          '</div>'
        : '') +
      '</div>' +
      // Colonne droite : composants
      '<div>' +
        '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:1rem;">Votre configuration</div>' +
        POST_META.map(p => {
          const opt = (typeof ALL_OPTIONS !== 'undefined' && ALL_OPTIONS[p.id]) ? ALL_OPTIONS[p.id].find(o => o.id === selOpts[p.id]) : null;
          if (!opt) return '';
          const isModified = !!(window._activePreset && preset && Object.keys(preset).length && preset[p.id] !== selOpts[p.id]);
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid #1e1e1e;">' +
            '<div style="font-size:13px;color:'+(isModified?'#ccc':'#666')+';display:flex;align-items:center;gap:8px;">' +
              '<i class="ti '+(icons[p.id]||'ti-point')+'" style="font-size:11px;color:#F5C400;"></i>' +
              p.name +
              (isModified ? '<span style="width:6px;height:6px;border-radius:50%;background:#F5C400;display:inline-block;"></span>' : '') +
            '</div>' +
            '<div style="font-size:13px;font-weight:500;color:'+(isModified?'#F5C400':'#999')+';">'+opt.name+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>' +
    // Dimensions si validées
    '<div style="margin-top:1.5rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Dimensions</div>' +
      ((!window.sizeValidated || !Object.keys(selSize).some(k => selSize[k])) ?
        '<div style="font-size:13px;color:#555;font-style:italic;">Non renseignées — nous vous contacterons pour affiner et valider vos cotes.</div>' :
        (() => {
          const parts = [];
          if (selSize.taille)        parts.push('<span><strong>Taille :</strong> ' + selSize.taille + '</span>');
          if (selSize.manivelle)     parts.push('<span><strong>Manivelle :</strong> ' + selSize.manivelle + ' mm</span>');
          if (selSize.potence)       parts.push('<span><strong>Potence :</strong> ' + selSize.potence + ' mm</span>');
          if (selSize.cintre)        parts.push('<span><strong>Cintre :</strong> ' + selSize.cintre + ' mm</span>');
          if (selSize.plateaux)      parts.push('<span><strong>Plateau(x) :</strong> ' + selSize.plateaux + '</span>');
          if (selSize.section)       parts.push('<span><strong>Section pneu :</strong> ' + selSize.section + '</span>');
          if (selSize.debattement)   parts.push('<span><strong>Débattement :</strong> ' + selSize.debattement + ' mm</span>');
          if (selSize.largeur_selle) parts.push('<span><strong>Largeur selle :</strong> ' + selSize.largeur_selle + ' mm</span>');
          return '<div style="font-size:13px;color:#f2f2f2;line-height:2;display:flex;flex-wrap:wrap;gap:8px 24px;">' + parts.join('') + '</div>';
        })() +
      '</div>') +
    '</div>' +
    v2RecapBlock() +
    '';
}

// Bloc récap du parcours OOD (cadre standard / évolution / sur mesure / hors gamme)
function v2RecapBlock() {
  if (typeof v2Parcours === 'undefined') return '';

  if (v2Parcours === 'standard') {
    return ''; // rien à afficher — le parcours standard est déjà couvert par Dimensions
  }

  if (v2Parcours === 'standard_evo') {
    const checkedOpts = (typeof EVO_OPTIONS !== 'undefined') ? EVO_OPTIONS.filter(o => evoChecked[o.id]) : [];
    const total = (typeof evoTotalPrice === 'function') ? evoTotalPrice() : null;
    let lines = '';
    if (checkedOpts.length === 0 && !evoCustomText) {
      lines = '<div style="font-size:13px;color:#555;font-style:italic;">Aucune option sélectionnée.</div>';
    } else {
      lines = '<div style="font-size:13px;color:#f2f2f2;line-height:1.8;display:flex;flex-direction:column;gap:2px;">' +
        checkedOpts.map(o => {
          if (o.id === 'evo_gravure') {
            return '<div>' + o.label + (evoGravureText ? ' : « ' + evoGravureText + ' »' : '') + '</div>';
          }
          if (o.id === 'evo_inserts') {
            const selectedInserts = (typeof EVO_INSERTS !== 'undefined')
              ? EVO_INSERTS.filter(i => evoInsertsChecked[i.id]).map(i => i.label)
              : [];
            return '<div>' + o.label + (selectedInserts.length ? ' : ' + selectedInserts.join(', ') : '') + '</div>';
          }
          return '<div>' + o.label + '</div>';
        }).join('') +
      '</div>';
    }
    const customBlock = evoCustomText
      ? '<div style="margin-top:8px;padding-top:8px;border-top:0.5px solid #2a2a2a;"><div style="font-size:11px;color:#666;margin-bottom:4px;">Demande particulière :</div><div style="font-size:13px;color:#f2f2f2;white-space:pre-wrap;">' + evoCustomText.replace(/</g,'&lt;') + '</div></div>'
      : '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Options Évolution</div>' +
      lines +
      customBlock +
      (total !== null ? '<div style="font-size:13px;color:#F5C400;font-weight:500;margin-top:8px;padding-top:8px;border-top:0.5px solid #333;">Total options : ' + total + ' €</div>' : '') +
    '</div>';
  }

  if (v2Parcours === 'sur_mesure') {
    const msg = window._v2Message || '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Cadre sur mesure — Niveau Performance</div>' +
      (msg ? '<div style="font-size:13px;color:#f2f2f2;line-height:1.6;white-space:pre-wrap;">' + msg.replace(/</g,'&lt;') + '</div>' : '<div style="font-size:13px;color:#555;font-style:italic;">Aucune description fournie.</div>') +
    '</div>';
  }

  if (v2Parcours === 'hors_gamme') {
    const msg = window._v2Message || '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Projet spécifique — Niveau Titanium</div>' +
      (msg ? '<div style="font-size:13px;color:#f2f2f2;line-height:1.6;white-space:pre-wrap;">' + msg.replace(/</g,'&lt;') + '</div>' : '<div style="font-size:13px;color:#555;font-style:italic;">Aucune description fournie.</div>') +
    '</div>';
  }

  return '';
}

// ── Récap droit ──
function dtRenderRecap() {
  if (window.innerWidth < 768) return;
  const model = MODELS.find(m => m.id === selModel);
  const get = id => document.getElementById(id);
  if (!model) {
    [get('dtr-thumb'),get('dtr-model'),get('dtr-price'),get('dtr-sep')].forEach(el => { if(el) el.style.display='none'; });
    const mod = get('dtr-modif'); if (mod) mod.classList.remove('show');
    return;
  }
  if (get('dtr-thumb')) { get('dtr-thumb').src = model.photo||''; get('dtr-thumb').style.display = model.photo?'block':'none'; }
  if (get('dtr-model')) { get('dtr-model').textContent = model.name; get('dtr-model').style.display = 'block'; }
  if (get('dtr-preset')) get('dtr-preset').textContent = window._activePreset || '';
  const {price} = computeTotals(selModel, selOpts);
  if (get('dtr-price')) { get('dtr-price').textContent = price.toLocaleString('fr-FR')+' €'; get('dtr-price').style.display = 'block'; }
  if (get('dtr-sep')) get('dtr-sep').style.display = 'block';

  const mc = dtModifCount();
  const modifEl = get('dtr-modif');
  if (modifEl) {
    if (mc > 0) { get('dtr-modif-txt').textContent = mc+' personnalisation'+(mc>1?'s':'')+' · '+window._activePreset; modifEl.classList.add('show'); }
    else modifEl.classList.remove('show');
  }

  const preset = (window._activePreset && PRESETS[selModel]) ? PRESETS[selModel][window._activePreset] : {};
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise'};
  const rows = get('dtr-rows');
  if (!rows) return;
  rows.innerHTML = POST_META.map(p => {
    const opts = (typeof ALL_OPTIONS !== 'undefined' && ALL_OPTIONS[p.id]) ? ALL_OPTIONS[p.id] : [];
    const opt = opts.find(o => o.id === selOpts[p.id]);
    if (!opt) return '';
    const isModified = !!(window._activePreset && preset && Object.keys(preset).length && preset[p.id] !== selOpts[p.id]);
    return '<div class="dtr-row'+(isModified?' mod':'')+'">' +
      '<span class="dtr-lbl"><i class="ti '+(icons[p.id]||'ti-point')+'" style="font-size:8px;margin-right:3px;"></i>'+p.name+(isModified?'<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#F5C400;margin-left:3px;vertical-align:middle;"></span>':'')+'</span>' +
      '<span class="dtr-val">'+opt.name+'</span>' +
    '</div>';
  }).join('');
}

// ── Helpers ──
function dtModifCount() {
  if (!selModel || !window._activePreset || !PRESETS[selModel] || !PRESETS[selModel][window._activePreset]) return 0;
  const preset = PRESETS[selModel][window._activePreset];
  let c = 0;
  Object.keys(selOpts).forEach(pid => { if (selOpts[pid] && preset[pid] !== selOpts[pid]) c++; });
  return c;
}

function dtQuickSave() {
  if (!selModel) { alert('Sélectionnez d\'abord un modèle.'); return; }
  const name = prompt('Nom de cette configuration :', 'Ma config');
  if (!name || !name.trim()) return;
  // Utiliser le système de sauvegarde existant de proto12
  const entry = {
    id: Date.now().toString(),
    name: name.trim(),
    selModel,
    selOpts: {...selOpts},
    selSize: {...selSize},
    preset: window._activePreset,
    date: new Date().toLocaleDateString('fr-FR')
  };
  savedConfigs.unshift(entry);
  persistSaved();
  loadSaved(); // recharger pour sync
  dtUpdateSavedBadge();
  // Aussi sauvegarder dans Supabase
  const { price: qPrice } = computeTotals(selModel, selOpts);
  const qId = generateConfigId();
  const qJson = { config_id: qId, modele: selModel, modele_nom: (MODELS.find(m=>m.id===selModel)||{}).name||'', preset: window._activePreset||null, composants: selOpts, dimensions: selSize||{}, prix: qPrice, nom_client: name.trim(), email_client: '' };
  saveConfigToSupabase({ config_id: qId, modele: selModel, preset: window._activePreset||null, prix: qPrice, config_json: qJson, nom_client: name.trim(), email_client: '', statut: 'sauvegarde' }).catch(e => console.warn('Supabase save error:', e));
  // Feedback visuel
  const btn = document.getElementById('dtr-btn-save');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check" style="color:#F5C400;"></i> Sauvegardé';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  }
}

function dtReset() {
  // Réinitialiser le _init des panels step 3 pour forcer le re-rendu
  const gz = document.getElementById('dt-s3-panel-guide');
  const mz = document.getElementById('dt-s3-panel-manual');
  if (gz) gz._init = false;
  if (mz) mz._init = false;
  // Garder le modèle ET _singleModel — réinitialiser uniquement les options
  const keptModel = selModel;
  selOpts = {}; selSize = {}; window.sizeValidated = false; openPost = null;
  window._activePreset = null;
  selModel = keptModel; // on garde le modèle
  window._singleModel = keptModel; // bouton "choisir un autre vélo" visible
  // Recharger Ti1 par défaut
  if (selModel && PRESETS[selModel] && PRESETS[selModel]['Ti1']) {
    window._activePreset = 'Ti1'; selOpts = {...PRESETS[selModel]['Ti1']};
  }
  dtStep = 1; document.body.classList.remove('dt-step-4');
  dtRender();
}

// ── Init ──
function dtInit() {
  if (window.innerWidth < 768) return;
  // Masquer tout le desktop legacy
  const hide = ['view-config','bottom-row','view-size','view-saved'];
  hide.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  const tb = document.querySelector('.tab-bar');
  if (tb) tb.style.display = 'none';
  dtRender();
}



// ─── OBVIOUS ON DEMAND — DONNÉES ÉVOLUTION ────────────────────────────────────
const EVO_FIXE = 50;
const EVO_OPTIONS = [
  {
    "id": "evo_inserts",
    "label": "Ajout d'inserts",
    "price": 10,
    "note": "Ajout d'inserts taraudés pour fixations sur cadre — porte-bidons, bagagerie, porte-bagages, garde-boue. Prix unique quelle que soit la quantité.",
    "modeles": [
      "route",
      "gravel_racing",
      "gravel_bikepacking",
      "vtt_enduro"
    ]
  },
  {
    "id": "evo_iscg",
    "label": "Fixation ISCG05",
    "price": 20,
    "note": "Ajout d'une patte de fixation pour guide-chaîne ISCG05 sur VTT.",
    "modeles": [
      "vtt_enduro"
    ]
  },
  {
    "id": "evo_integ",
    "label": "Intégration direction",
    "price": 50,
    "note": "Intégration des gaines et durites dans la direction.",
    "modeles": [
      "gravel_bikepacking"
    ]
  },
  {
    "id": "evo_gravure",
    "label": "Gravure sur tube supérieur",
    "price": 10,
    "note": "Gravez votre nom, votre groupe sanguin ou autre sur le tube supérieur — 20 caractères maximum.",
    "modeles": [
      "route",
      "gravel_racing",
      "gravel_bikepacking",
      "vtt_enduro"
    ]
  }
];

const EVO_INSERTS = [
  {
    "id": "ins_pb1",
    "label": "Porte-bidon 1",
    "note": "Tube diagonal",
    "avail": {
      "route": 1,
      "gravel_racing": 1,
      "gravel_bikepacking": 1,
      "vtt_enduro": 1
    }
  },
  {
    "id": "ins_pb2",
    "label": "Porte-bidon 2",
    "note": "Tube de selle",
    "avail": {
      "route": 1,
      "gravel_racing": 1,
      "gravel_bikepacking": 1,
      "vtt_enduro": "x"
    }
  },
  {
    "id": "ins_pb3",
    "label": "Porte-bidon 3",
    "note": "Sous tube diagonal",
    "avail": {
      "route": 0,
      "gravel_racing": 1,
      "gravel_bikepacking": 1,
      "vtt_enduro": 0
    }
  },
  {
    "id": "ins_sacoche",
    "label": "Sacoche de tube supérieur",
    "note": "Tube supérieur",
    "avail": {
      "route": 0,
      "gravel_racing": 0,
      "gravel_bikepacking": 1,
      "vtt_enduro": 0
    }
  },
  {
    "id": "ins_pbag4",
    "label": "Porte-bagages arrière 4 points",
    "note": "Pour porte-bagages classique",
    "avail": {
      "route": "x",
      "gravel_racing": 0,
      "gravel_bikepacking": 1,
      "vtt_enduro": 0
    }
  },
  {
    "id": "ins_pbag2",
    "label": "Porte-bagages arrière 2 points",
    "note": "2 points en bas des haubans pour soutenir porte-bagages fixé sur tige de selle",
    "avail": {
      "route": 0,
      "gravel_racing": 0,
      "gravel_bikepacking": "x",
      "vtt_enduro": 0
    }
  },
  {
    "id": "ins_gardeboue",
    "label": "Garde-boue",
    "note": "",
    "avail": {
      "route": "x",
      "gravel_racing": "x",
      "gravel_bikepacking": 1,
      "vtt_enduro": "x"
    }
  }
];

let evoInsertsChecked = {}; // état des inserts individuels
let evoCustomText = ''; // demande texte libre

let evoChecked = {};
let evoOrder = []; // ordre de sélection — le premier élément paie le fixe
let evoGravureText = '';

function evoUpdateGravureText(val) {
  const upperVal = val.toUpperCase();
  evoGravureText = upperVal;
  const input = document.getElementById('evo-gravure-input');
  // Préserver la position du curseur lors de la conversion en majuscules
  const cursorPos = input ? input.selectionStart : null;
  if (input && input.value !== upperVal) {
    input.value = upperVal;
    if (cursorPos !== null) input.setSelectionRange(cursorPos, cursorPos);
  }
  const errorSpan = input ? input.parentElement.querySelector('span') : null;
  const isError = upperVal.length > 20;
  if (input) input.style.borderColor = isError ? '#e05555' : '#333';
  if (errorSpan) {
    errorSpan.style.color = isError ? '#e05555' : '#555';
    errorSpan.textContent = isError ? 'Maximum 20 caractères, espaces compris' : (upperVal.length + ' / 20 caractères');
  }
}
let v2Parcours = 'standard'; // 'standard' | 'standard_evo' | 'sur_mesure' | 'hors_gamme'

// Calcul du prix affiché pour UNE option
// Rien de coché : toutes affichent fixe + xx
// Au moins 1 coché : SEULE la première option cochée (evoOrder[0]) affiche fixe + xx
//                    toutes les autres (cochées ou non) affichent xx seul
function evoOptionPrice(optId) {
  const opt = EVO_OPTIONS.find(o => o.id === optId);
  if (!opt) return 0;
  if (evoOrder.length === 0) return EVO_FIXE + opt.price;
  return optId === evoOrder[0] ? EVO_FIXE + opt.price : opt.price;
}

// Total global = fixe (1 seul) + somme des xx cochés
function evoTotalPrice() {
  const checked = EVO_OPTIONS.filter(o => evoChecked[o.id]);
  if (checked.length === 0) return null; // rien de coché
  return EVO_FIXE + checked.reduce((sum, o) => sum + o.price, 0);
}

// Rendu des options Évolution
function evoRender() {
  const container = document.getElementById('v2-evo-options');
  if (!container) return;
  const opts = EVO_OPTIONS.filter(o => o.modeles.includes(selModel));
  const firstId = evoOrder[0];

  container.innerHTML = opts.map(opt => {
    const checked = evoChecked[opt.id] || false;
    const priceLabel = evoOptionPrice(opt.id) + ' €';
    const isGravure = opt.id === 'evo_gravure';
    const isInserts = opt.id === 'evo_inserts';
    const gravureText = evoGravureText || '';
    const gravureError = gravureText.length > 20;

    return `<div style="background:#111;border:0.5px solid ${checked ? '#F5C400' : '#222'};padding:1rem;border-radius:2px;transition:border-color .15s;">
      <div style="display:flex;align-items:flex-start;gap:.75rem;${isInserts ? '' : 'cursor:pointer;'}" ${isInserts ? '' : `onclick="evoToggle('${opt.id}')"`}>
        ${isInserts ? '' : `<div style="width:18px;height:18px;border:0.5px solid ${checked ? '#F5C400' : '#444'};background:${checked ? '#F5C400' : 'transparent'};flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;">
          ${checked ? '<i class="ti ti-check" style="font-size:11px;color:#1a1a00;"></i>' : ''}
        </div>`}
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;">
            <span style="font-size:13px;font-weight:500;color:#f2f2f2;">${opt.label}</span>
            ${isInserts ? '' : `<span style="font-size:12px;font-weight:500;color:${checked ? '#F5C400' : firstId ? '#aaa' : '#666'};white-space:nowrap;">${priceLabel}</span>`}
          </div>
          ${opt.note && !isInserts ? `<div style="font-size:12px;color:#555;line-height:1.5;margin-top:4px;">${opt.note}</div>` : ''}
        </div>
      </div>
      ${isInserts ? evoRenderInsertsSubList(checked, priceLabel) : ''}
      ${isGravure && checked ? `
      <div style="margin-top:.75rem;padding-top:.75rem;border-top:0.5px solid #222;" onclick="event.stopPropagation()">
        <input type="text" id="evo-gravure-input" maxlength="30" value="${gravureText.replace(/"/g,'&quot;')}" placeholder="TEXTE À GRAVER (20 CARACTÈRES MAX)" oninput="evoUpdateGravureText(this.value)" style="width:100%;box-sizing:border-box;background:#0d0d0d;border:0.5px solid ${gravureError ? '#e05555' : '#333'};color:#f2f2f2;padding:8px 10px;font-size:13px;font-family:var(--font);text-transform:uppercase;letter-spacing:.03em;">
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span style="font-size:11px;color:${gravureError ? '#e05555' : '#555'};">${gravureError ? 'Maximum 20 caractères, espaces compris' : (gravureText.length + ' / 20 caractères')}</span>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');

  // Bloc demande libre — toujours affiché en bas
  container.innerHTML += evoRenderCustomText();

  evoUpdateTotal();
}

// Sous-liste des inserts filtrée par modèle
function evoRenderInsertsSubList(evoInsertsChecked_unused, priceLabel) {
  const items = EVO_INSERTS.filter(i => i.avail[selModel] !== 'x');
  if (items.length === 0) return '';

  const anyInsertChecked = items.some(i => i.avail[selModel] === 0 && evoInsertsChecked[i.id]);

  return `<div style="margin-top:.75rem;padding-top:.75rem;border-top:0.5px solid #222;display:flex;flex-direction:column;gap:6px;">` +
    items.map(item => {
      const isIncluded = item.avail[selModel] === 1;
      const isChecked = evoInsertsChecked[item.id] || false;
      if (isIncluded) {
        return `<div style="display:flex;align-items:center;gap:8px;opacity:.5;">
          <div style="width:14px;height:14px;border:0.5px solid #444;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><i class="ti ti-check" style="font-size:9px;color:#666;"></i></div>
          <span style="font-size:12px;color:#888;">${item.label}${item.note ? ' — ' + item.note : ''}</span>
          <span style="font-size:10px;color:#555;margin-left:auto;">sur cadre standard</span>
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="event.stopPropagation();evoToggleInsert('${item.id}')">
        <div style="width:14px;height:14px;border:0.5px solid ${isChecked ? '#F5C400' : '#444'};background:${isChecked ? '#F5C400' : 'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          ${isChecked ? '<i class="ti ti-check" style="font-size:9px;color:#1a1a00;"></i>' : ''}
        </div>
        <span style="font-size:12px;color:#f2f2f2;">${item.label}${item.note ? ' — ' + item.note : ''}</span>
      </div>`;
    }).join('') +
    `<div style="display:flex;justify-content:flex-end;margin-top:4px;padding-top:6px;border-top:0.5px solid #1a1a1a;">
      <span style="font-size:12px;font-weight:500;color:${anyInsertChecked ? '#F5C400' : '#666'};">${priceLabel}</span>
    </div>
  </div>`;
}

// Champ texte libre pour demande spécifique
function evoRenderCustomText() {
  return `<div style="margin-top:.5rem;padding:1rem;background:#0d0d0d;border:0.5px dashed #333;">
    <div style="font-size:12px;color:#888;margin-bottom:6px;">Une demande particulière non listée ci-dessus ?</div>
    <textarea id="evo-custom-text" rows="2" placeholder="Décrivez votre besoin..." oninput="evoCustomText=this.value" style="width:100%;box-sizing:border-box;background:#111;border:0.5px solid #333;color:#f2f2f2;padding:8px 10px;font-size:13px;font-family:var(--font);resize:vertical;line-height:1.5;">${evoCustomText}</textarea>
    <div style="font-size:11px;color:#555;margin-top:6px;">Cette demande sera soumise à validation de faisabilité par notre équipe.</div>
  </div>`;
}

function evoToggleInsert(id) {
  evoInsertsChecked[id] = !evoInsertsChecked[id];
  // Synchronise evo_inserts checked/order selon si au moins un insert cochable est sélectionné
  const items = EVO_INSERTS.filter(i => i.avail[selModel] === 0);
  const anyChecked = items.some(i => evoInsertsChecked[i.id]);
  evoChecked['evo_inserts'] = anyChecked;
  if (anyChecked) {
    if (!evoOrder.includes('evo_inserts')) evoOrder.push('evo_inserts');
  } else {
    evoOrder = evoOrder.filter(x => x !== 'evo_inserts');
  }
  evoRender();
}

function evoToggle(id) {
  evoChecked[id] = !evoChecked[id];
  if (evoChecked[id]) {
    if (!evoOrder.includes(id)) evoOrder.push(id);
  } else {
    evoOrder = evoOrder.filter(x => x !== id);
  }
  evoRender();
}

function evoUpdateTotal() {
  const totalEl = document.getElementById('v2-evo-total');
  if (!totalEl) return;
  const total = evoTotalPrice();
  if (total === null) {
    totalEl.innerHTML = '<span style="color:#666;font-size:13px;">Sélectionnez les options souhaitées</span>';
  } else {
    totalEl.innerHTML = 'Total options : <strong style="color:#F5C400;">' + total + ' €</strong>';
  }
}

// ─── NAVIGATION V2 ────────────────────────────────────────────────────────────


// ─── NAVIGATION V2 ────────────────────────────────────────────────────────────


// Helper centralisé : définit le bon texte du bouton "Continuer" après la taille
function v2SetTailleLabel(validated) {
  const lbl = document.getElementById('dt-next-taille-lbl');
  if (!lbl) return;
  if (validated) {
    lbl.textContent = v2Parcours === 'standard_evo' ? 'Mes personnalisations' : 'Ma configuration';
  } else {
    lbl.textContent = 'Continuer sans taille';
  }
}

// Passe de l'écran bifurcation (2 cartes) à l'écran des 3 niveaux OOD
function v2ShowOodLevels() {
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s3ood')?.classList.add('active');
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

// Retour de l'écran des 3 niveaux OOD vers l'écran bifurcation (2 cartes)
function v2BackToBif() {
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s3bif')?.classList.add('active');
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

function v2ChooseParcours(parcours) {
  v2Parcours = parcours;

  ['standard','standard_evo','sur_mesure','hors_gamme'].forEach(p => {
    const card = document.getElementById('v2-card-' + p);
    if (card) card.style.borderColor = p === parcours ? '#F5C400' : '#333';
  });

  setTimeout(() => {
    document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
    const main = document.getElementById('dt-main');

    if (parcours === 'standard' || parcours === 'standard_evo') {
      dtStep = 4;
      document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
      document.getElementById('dt-s3')?.classList.add('active');
      dtRenderS3();
      setTimeout(() => dtToggleSizeMode('guide'), 50);
      // Update next button label
      const lbl = document.getElementById('dt-next-taille-lbl');
      if (lbl) {
        if (window.sizeValidated) {
          lbl.textContent = v2Parcours === 'standard_evo' ? 'Mes personnalisations' : 'Ma configuration';
        } else {
          lbl.textContent = 'Continuer sans taille';
        }
      }
    } else if (parcours === 'sur_mesure') {
      dtStep = 4;
      document.getElementById('dt-s4mesure')?.classList.add('active');
    } else if (parcours === 'hors_gamme') {
      dtStep = 4;
      document.getElementById('dt-s4horsgamme')?.classList.add('active');
    }
    v2UpdateStepper();
    if (main) main.scrollTop = 0;
  }, 150);
}

function v2RenderTaille() {
  dtRenderS3 && dtRenderS3();
  setTimeout(() => dtToggleSizeMode && dtToggleSizeMode('guide'), 50);
  v2UpdateStepper();
}
// Bouton "Suivant" depuis la taille — selon le parcours
function v2NextFromTaille() {
  if (v2Parcours === 'standard') {
    v2GoRecap();
  } else if (v2Parcours === 'standard_evo') {
    v2GoEvo();
  }
}

// Aller au récap avant devis
function v2GoRecap() {
  dtStep = 6;
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s6devis')?.classList.add('active');
  document.body.classList.add('dt-step-4');
  v2UpdateStepper();
  dtRenderS4 && dtRenderS4();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}


function v2GoEvo() {
  dtStep = 5;
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s5evo')?.classList.add('active');
  v2UpdateStepper();
  evoRender();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

function v2GoDevis() {
  // Blocage si gravure trop longue
  if (v2Parcours === 'standard_evo' && evoChecked['evo_gravure'] && evoGravureText.length > 20) {
    const input = document.getElementById('evo-gravure-input');
    if (input) { input.style.borderColor = '#e05555'; input.focus(); }
    return;
  }
  // Collect data from current parcours
  if (v2Parcours === 'sur_mesure') {
    window._v2Message = document.getElementById('v2-mesure-message')?.value || '';
  } else if (v2Parcours === 'hors_gamme') {
    window._v2Message = document.getElementById('v2-horsgamme-message')?.value || '';
  }
  v2GoRecap();
}

function v2UpdateStepper() {
  const n = dtStep;
  for (let i = 1; i <= 6; i++) {
    const s = document.getElementById('dts-' + i);
    const d = document.getElementById('dts-dot-' + i);
    if (!s || !d) continue;
    s.className = 'dts-step' + (i === n ? ' active' : i < n ? ' done' : '');
    d.innerHTML = i < n
      ? '<i class="ti ti-check" style="font-size:9px;"></i>'
      : i === 6 ? '→' : String(i);
  }
  const d3 = document.getElementById('dts-d3');
  if (d3) d3.textContent = n > 3
    ? ({standard:'Standard',standard_evo:'Standard + perso',sur_mesure:'Sur mesure',hors_gamme:'Projet unique'}[v2Parcours] || '') + ' ✓'
    : '';
  const d4 = document.getElementById('dts-d4');
  if (d4) {
    if (v2Parcours === 'standard') d4.textContent = window.sizeValidated ? 'Taille ✓' : 'Optionnel';
    else if (v2Parcours === 'standard_evo') d4.textContent = window.sizeValidated ? 'Taille ✓' : 'Optionnel';
    else d4.textContent = '';
  }
}

function v2GoBackToTailleEvo() {
  dtStep = 4;
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s3')?.classList.add('active');
  v2RenderTaille();
  v2UpdateStepper();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadSaved();
renderModels();
dtInit();
loadConfigFromUrl();

// ── Masquer l'écran de chargement après init + chargement des photos ──
(function hideLoader() {
  const loader = document.getElementById('obv-loader');
  if (!loader) return;

  // Précharger les photos des 4 modèles
  const photos = MODELS.map(m => m.photo).filter(Boolean);
  let loaded = 0;

  function tryHide() {
    loaded++;
    if (loaded >= photos.length) {
      loader.classList.add('hidden');
      setTimeout(function() { loader.style.display = 'none'; }, 450);
    }
  }

  if (photos.length === 0) {
    // Pas de photos — masquer directement
    setTimeout(function() {
      loader.classList.add('hidden');
      setTimeout(function() { loader.style.display = 'none'; }, 450);
    }, 400);
  } else {
    photos.forEach(function(src) {
      const img = new Image();
      img.onload = tryHide;
      img.onerror = tryHide; // ne pas bloquer si une photo est manquante
      img.src = src;
    });
    // Sécurité : masquer après 5s max quoi qu'il arrive
    setTimeout(function() {
      loader.classList.add('hidden');
      setTimeout(function() { loader.style.display = 'none'; }, 450);
    }, 5000);
  }
})();

// Présélection via paramètre URL (?modele=ON/OFF&roues=roue_gr_ob_35...)
const ALIASES = {
  'ON/':       'route',
  'ON/OFF':    'gravel_racing',
  'OUT/QUEST': 'gravel_bikepacking',
  '/OFF':      'vtt_enduro',
};

const urlParams = new URLSearchParams(window.location.search);
const modeleParam = urlParams.get('modele');

// ── Mode embed (?embed=1) : masquer header pour intégration iframe Wordpress ──
const isEmbed = urlParams.get('embed') === '1';
if (isEmbed) {
  const style = document.createElement('style');
  style.textContent = `
    /* Embed mode — masquer tout le header */
    header { display: none !important; }
  `;
  document.head.appendChild(style);

  // Envoyer la hauteur au parent Wordpress pour ajustement dynamique
  function sendHeight() {
    const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent.postMessage({ type: 'obv-height', height: h }, '*');
  }

  // Envoyer au chargement
  window.addEventListener('load', function() {
    setTimeout(sendHeight, 300);
    setTimeout(sendHeight, 1000);
  });

  // Envoyer à chaque mutation du DOM (changement de step, ouverture accordéon...)
  new MutationObserver(function() {
    setTimeout(sendHeight, 100);
  }).observe(document.body, { childList: true, subtree: true });

  // Répondre aux demandes explicites du parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'obv-request-height') sendHeight();
  });
}
if (modeleParam) {
  const decoded = decodeURIComponent(modeleParam);
  const resolvedId = ALIASES[decoded] || ALIASES[modeleParam] || decoded || modeleParam;
  const modeleAuto = MODELS.find(m => m.id === resolvedId);
  if (modeleAuto) {
    window._singleModel = modeleAuto.id;
    renderModels();
    selectModel(modeleAuto.id);

    // Pré-charger les postes depuis les paramètres URL
    const postes = ['fourche','roues','pneus','transmission','power','frein','pilotage','selle','tige','pedales'];
    let hasPreset = false;
    postes.forEach(poste => {
      const val = urlParams.get(poste);
      if (val) {
        const opts = optionsFor(poste, modeleAuto.id);
        if (opts.find(o => o.id === val)) {
          selOpts[poste] = val;
          hasPreset = true;
        }
      }
    });

    // Présélection via paramètre URL ?preset=Signature|Ti1|Ti2
    const presetParam = urlParams.get('preset');
    if (presetParam && PRESETS[modeleAuto.id] && PRESETS[modeleAuto.id][presetParam]) {
      window._v2Parcours = 'standard';
      window._activePreset = presetParam;
      selOpts = { ...PRESETS[modeleAuto.id][presetParam] };
      // Mobile : masquer grille, afficher composants
      const step1Wrap = document.getElementById('step1-wrap');
      const postsSection = document.getElementById('posts-section');
      if (step1Wrap) step1Wrap.style.display = 'none';
      if (postsSection) postsSection.style.display = 'block';
      renderPosts();
      updateRecap();
      renderModels();
      // Desktop : forcer step 2 avec le bon preset APRES que selectModel a tout initialisé
      if (window.innerWidth >= 768) {
        setTimeout(() => {
          window._activePreset = presetParam;
          selOpts = { ...PRESETS[modeleAuto.id][presetParam] };
          dtStep = 2;
          dtRender();
        }, 50);
      }
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 10);
    }

    if (hasPreset) {
      Object.keys(selOpts).forEach(postId => {
        const optId = selOpts[postId];
        if (!optId) return;
        FORCE_SELECT.forEach(rule => {
          if (rule.if_selected === optId) {
            Object.entries(rule.force).forEach(([fp, fid]) => {
              if (!selOpts[fp]) selOpts[fp] = fid;
            });
          }
        });
      });

      // Identifier quel preset correspond à la config chargée
      const modelPresets = PRESETS[modeleAuto.id];
      if (modelPresets) {
        const postes = ['fourche','roues','pneus','transmission','power','frein','pilotage','selle','tige','pedales'];
        for (const [decl, preset] of Object.entries(modelPresets)) {
          if (postes.every(p => selOpts[p] === preset[p])) {
            window._activePreset = decl;
            break;
          }
        }
      }

      document.getElementById('posts-section').style.display = 'block';
      renderPosts();
      updateRecap();
      renderModels(); // re-render pour afficher bouton actif
    }

    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 10);
  }
};
;

// ─── ÊTRE RAPPELÉ (Formspree) ─────────────────────────────────────────────────
async function sendCallbackSize() {
  const phone = document.getElementById('cf-phone-s').value.trim();
  const email = document.getElementById('cf-email-s').value.trim();
  const toast = document.getElementById('cf-toast-s');
  const error = document.getElementById('cf-error-s');
  toast.style.display = 'none'; error.style.display = 'none';
  if (!phone && !email) { error.style.display = 'block'; return; }
  const model = MODELS.find(m => m.id === selModel);
  try {
    const res = await fetch('https://formspree.io/f/mqeoqewy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ telephone: phone, email, modele: model ? model.name : '', _subject: 'Demande de rappel — Obvious Configurateur' })
    });
    if (res.ok) { toast.style.display = 'block'; document.getElementById('cf-phone-s').value = ''; document.getElementById('cf-email-s').value = ''; }
    else { error.textContent = 'Erreur, réessayez.'; error.style.display = 'block'; }
  } catch(e) { error.textContent = 'Erreur réseau.'; error.style.display = 'block'; }
}

async function sendCallback() {
  const phone = document.getElementById('cf-phone').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const toast = document.getElementById('cf-toast');
  const error = document.getElementById('cf-error');
  toast.style.display = 'none';
  error.style.display = 'none';
  if (!phone && !email) { error.style.display = 'block'; return; }
  const model = MODELS.find(m => m.id === selModel);
  const modelName = model ? model.name + ' titane' : '';
  try {
    const res = await fetch('https://formspree.io/f/mqeoqewy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ telephone: phone, email, modele: modelName, _subject: 'Demande de rappel — Obvious Configurateur' })
    });
    if (res.ok) {
      toast.style.display = 'block';
      document.getElementById('cf-phone').value = '';
      document.getElementById('cf-email').value = '';
    } else { error.textContent = 'Erreur, réessayez.'; error.style.display = 'block'; }
  } catch(e) { error.textContent = 'Erreur réseau.'; error.style.display = 'block'; }
}

// ─── INIT AU CHARGEMENT ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Clic fenêtre flottante → scroll vers résumé
  const fp = document.getElementById('floating-price');
  if (fp) {
    fp.addEventListener('click', () => {
      const recap = document.getElementById('bottom-row') || document.getElementById('recap-col');
      if (recap) {
        const top = recap.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // Disparition fenêtre flottante quand prix fixe est atteint par scroll
  window.addEventListener('scroll', () => {
    const fp = document.getElementById('floating-price');
    const fixed = document.getElementById('recap-total-card');
    if (!fp || !fixed) return;
    const fixedRect = fixed.getBoundingClientRect();
    const fpRect = fp.getBoundingClientRect();
    if (fixedRect.top <= window.innerHeight) {
      fp.classList.add('hidden');
    } else {
      if (MODELS.find(m => m.id === selModel)) fp.classList.remove('hidden');
    }
  }, { passive: true });
});

// ─── LIEN RETOUR AU SITE ─────────────────────────────────────────────────────
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

// ─── FENÊTRE PRIX FLOTTANTE ───────────────────────────────────────────────────
function updateFloatingPrice() {
  if (window.innerWidth >= 768) dtRenderRecap();
  const fp = document.getElementById('floating-price');
  if (!fp) return;
  const model = MODELS.find(m => m.id === selModel);
  if (!model) { fp.classList.add('hidden'); return; }
  const { price } = computeTotals(selModel, selOpts);
  document.getElementById('fp-price').textContent = price.toLocaleString('fr-FR') + ' €';
  fp.classList.remove('hidden');
  // Aligner la largeur sur recap-total-card si visible
  if (window.innerWidth >= 768) {
    const card = document.getElementById('recap-total-card');
    if (card) {
      const w = card.getBoundingClientRect().width;
      if (w > 0) fp.style.width = w + 'px';
    }
  }
}

// ─── OBSERVER : masquer fenêtre flottante quand prix total visible ─────────

// ─── DONNÉES TAILLES CADRE ────────────────────────────────────────────────────


// ─── ÉTAT TAILLE ──────────────────────────────────────────────────────────────
let selSize = {};  // {taille, potence, cintre, manivelle, cassette, plateaux, largeur_selle, section, debattement}
let currentSizeMode = null;
let overlapTailles = null;

function toggleSizeMode(mode) {
  currentSizeMode = mode;
  document.getElementById('card-guide').classList.toggle('active', mode === 'guide');
  document.getElementById('card-manual').classList.toggle('active', mode === 'manual');
  document.getElementById('panel-guide').classList.toggle('open', mode === 'guide');
  document.getElementById('panel-manual').classList.toggle('open', mode === 'manual');
  if (mode === 'manual') buildDimsGrid();
  // Auto-scroll vers le panel ouvert
  setTimeout(() => {
    const panel = document.getElementById(mode === 'guide' ? 'panel-guide' : 'panel-manual');
    if (panel) {
      const top = panel.getBoundingClientRect().top + window.pageYOffset - (window.innerHeight / 2);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, 50);
}

// ─── CALCUL TAILLE GUIDÉE ─────────────────────────────────────────────────────
function calcSize() {
  const stature = parseInt(document.getElementById('guide-stature').value);
  const selle   = parseInt(document.getElementById('guide-selle').value) || null;
  const acroRaw = parseFloat(document.getElementById('guide-acro').value) || null;
  const acro    = acroRaw ? Math.round(acroRaw * 10) : null; // cm → mm
  const result  = document.getElementById('guide-result');
  const main    = document.getElementById('guide-result-main');
  const sub     = document.getElementById('guide-result-sub');
  const overlap = document.getElementById('guide-overlap');

  if (!selModel) {
    main.textContent = 'Veuillez d\'abord choisir un modèle de vélo.';
    result.classList.add('show'); overlap.style.display='none'; return;
  }
  if (!stature || stature < 140 || stature > 220) {
    main.textContent = 'Veuillez saisir une taille valide (140–220 cm).';
    result.classList.add('show'); overlap.style.display='none'; return;
  }

  const tailles = TAILLES_CADRE[selModel] || [];
  // Chercher par entrejambe en priorité, sinon par stature
  let matches;
  if (selle && selle > 0) {
    // selle = entrejambe en mm
    matches = tailles.filter(t => selle >= t.ej_min && selle <= t.ej_max);
    if (matches.length === 0) {
      // Pas de correspondance exacte — prendre la plus proche
      const closest = tailles.reduce((a,b) => {
        const da = Math.min(Math.abs(selle-a.ej_min), Math.abs(selle-a.ej_max));
        const db = Math.min(Math.abs(selle-b.ej_min), Math.abs(selle-b.ej_max));
        return da < db ? a : b;
      });
      matches = [closest];
    }
  } else {
    matches = tailles.filter(t => stature >= t.stature_min && stature <= t.stature_max);
  }

  result.classList.add('show');
  overlap.style.display = 'none';
  document.getElementById('btn-sport').classList.remove('sel');
  document.getElementById('btn-confort').classList.remove('sel');
  overlapTailles = null;

  if (matches.length === 0) {
    main.textContent = 'Aucune taille trouvée pour cette stature.';
    sub.textContent = 'Contactez-nous pour un conseil personnalisé.';
    return;
  }

  if (matches.length === 1) {
    const t = matches[0];
    selSize.taille = t.taille;
    showSizeActionBtns();
    selSize.taille = t.taille;
    // Pré-remplir avec les valeurs par défaut de cette taille
    const defs = DEFAULTS_BY_TAILLE[selModel] ? DEFAULTS_BY_TAILLE[selModel][t.taille] : {};
    if (defs) Object.assign(selSize, Object.fromEntries(Object.entries(defs).map(([k,v]) => [k, String(v)])));
    // Calculer cintre depuis inter-acromions
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let info = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (selle) info += ' · Entrejambe ' + t.ej_min + '–' + t.ej_max + ' cm';
    if (acro && selSize.cintre) info += ' · Cintre recommandé : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    sub.innerHTML = info;
    return;
  }

  // Chevauchement
  overlapTailles = matches;
  main.innerHTML = 'Votre stature correspond à deux tailles : <span style="color:#F5C400">' + matches.map(t=>t.taille).join(' ou ') + '</span>';
  sub.textContent = 'Précisez votre usage pour affiner le choix.';
  overlap.style.display = 'block';
}

function chooseUsage(usage) {
  if (!overlapTailles) return;
  document.getElementById('btn-sport').classList.toggle('sel', usage === 'sport');
  document.getElementById('btn-confort').classList.toggle('sel', usage === 'confort');
  // sport → petite taille, confort → grande taille
  const sorted = [...overlapTailles].sort((a,b) => a.stature_min - b.stature_min);
  const chosen = usage === 'sport' ? sorted[0] : sorted[sorted.length-1];
  selSize.taille = chosen.taille;
  showSizeActionBtns();
  selSize.taille = chosen.taille;
  const defsC = DEFAULTS_BY_TAILLE[selModel] ? DEFAULTS_BY_TAILLE[selModel][chosen.taille] : {};
  if (defsC) Object.assign(selSize, Object.fromEntries(Object.entries(defsC).map(([k,v]) => [k, String(v)])));
  const acroRawU = parseFloat(document.getElementById('guide-acro').value) || null;
  const acroU = acroRawU ? Math.round(acroRawU * 10) : null;
  if (acroU) calcCintreFromAcro(acroU);
  const cintreInfo = (acroU && selSize.cintre) ? ' · Cintre recommandé : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>' : '';
  document.getElementById('guide-result-main').innerHTML =
    'Taille recommandée : <span style="color:#F5C400">' + chosen.taille + '</span>' +
    ' <span style="font-size:13px;color:var(--text2)">(' + (usage==='sport'?'usage sportif':'usage confort') + ')</span>';
  document.getElementById('guide-result-sub').innerHTML =
    'Stature ' + chosen.stature_min + '–' + chosen.stature_max + ' cm' + cintreInfo;
}

// ─── GRILLE DIMENSIONS MANUELLES ─────────────────────────────────────────────
const DEFAULTS_BY_TAILLE = {
  "route": {
    "XXS": {
      "section": 28,
      "cassette": "11x34",
      "plateaux": "52x36",
      "manivelle": 165,
      "cintre": 380,
      "potence": 80,
      "largeur_selle": 145
    },
    "XS": {
      "section": 28,
      "cassette": "11x34",
      "plateaux": "52x36",
      "manivelle": 165,
      "cintre": 400,
      "potence": 90,
      "largeur_selle": 145
    },
    "S": {
      "section": 28,
      "cassette": "11x34",
      "plateaux": "52x36",
      "manivelle": 170,
      "cintre": 400,
      "potence": 90,
      "largeur_selle": 145
    },
    "M": {
      "section": 28,
      "cassette": "11x34",
      "plateaux": "52x36",
      "manivelle": 170,
      "cintre": 420,
      "potence": 100,
      "largeur_selle": 145
    },
    "L": {
      "section": 28,
      "cassette": "11x34",
      "plateaux": "52x36",
      "manivelle": 172.5,
      "cintre": 420,
      "potence": 110,
      "largeur_selle": 145
    },
    "XL": {
      "section": 28,
      "cassette": "11x34",
      "plateaux": "52x36",
      "manivelle": 175,
      "cintre": 440,
      "potence": 120,
      "largeur_selle": 145
    }
  },
  "gravel_racing": {
    "XS": {
      "section": 45,
      "cassette": "10x45",
      "plateaux": "40",
      "manivelle": 165,
      "cintre": 400,
      "potence": 80,
      "largeur_selle": 145
    },
    "S": {
      "section": 45,
      "cassette": "10x45",
      "plateaux": "40",
      "manivelle": 170,
      "cintre": 420,
      "potence": 90,
      "largeur_selle": 145
    },
    "M": {
      "section": 45,
      "cassette": "10x45",
      "plateaux": "40",
      "manivelle": 170,
      "cintre": 420,
      "potence": 100,
      "largeur_selle": 145
    },
    "L": {
      "section": 45,
      "cassette": "10x45",
      "plateaux": "40",
      "manivelle": 172.5,
      "cintre": 440,
      "potence": 110,
      "largeur_selle": 145
    },
    "XL": {
      "section": 45,
      "cassette": "10x45",
      "plateaux": "40",
      "manivelle": 175,
      "cintre": 460,
      "potence": 120,
      "largeur_selle": 145
    }
  },
  "gravel_bikepacking": {
    "XS": {
      "section": 40,
      "cassette": "10x51",
      "plateaux": "40",
      "manivelle": 165,
      "cintre": 400,
      "potence": 80,
      "largeur_selle": 145
    },
    "S": {
      "section": 40,
      "cassette": "10x52",
      "plateaux": "40",
      "manivelle": 170,
      "cintre": 420,
      "potence": 90,
      "largeur_selle": 145
    },
    "M": {
      "section": 40,
      "cassette": "10x53",
      "plateaux": "40",
      "manivelle": 170,
      "cintre": 420,
      "potence": 100,
      "largeur_selle": 145
    },
    "L": {
      "section": 40,
      "cassette": "10x54",
      "plateaux": "40",
      "manivelle": 172.5,
      "cintre": 440,
      "potence": 110,
      "largeur_selle": 145
    },
    "XL": {
      "section": 40,
      "cassette": "10x55",
      "plateaux": "40",
      "manivelle": 175,
      "cintre": 460,
      "potence": 120,
      "largeur_selle": 145
    }
  },
  "vtt_enduro": {
    "S": {
      "debattement": 150,
      "section": "2.4\"",
      "cassette": "10x52",
      "plateaux": "32",
      "manivelle": 165,
      "largeur_selle": 145
    },
    "M": {
      "debattement": 150,
      "section": "2.4\"",
      "cassette": "10x52",
      "plateaux": "32",
      "manivelle": 170,
      "largeur_selle": 145
    },
    "L": {
      "debattement": 150,
      "section": "2.4\"",
      "cassette": "10x52",
      "plateaux": "32",
      "manivelle": 170,
      "largeur_selle": 145
    },
    "XL": {
      "debattement": 150,
      "section": "2.4\"",
      "cassette": "10x52",
      "plateaux": "32",
      "manivelle": 172.5,
      "largeur_selle": 145
    }
  }
}

function buildDimsGrid() {
  const grid = document.getElementById('dims-grid');
  if (!grid) return;
  const fields = [];

  // Taille de cadre
  const tailles = TAILLES_CADRE[selModel] || [];
  if (tailles.length > 0) {
    fields.push({
      id: 'dim-taille', label: 'Taille de cadre',
      options: tailles.map(t => t.taille),
      key: 'taille'
    });
  }

  // Dimensions issues de la transmission sélectionnée
  const transOpt = selOpts.transmission ? ALL_OPTIONS.transmission.find(o => o.id === selOpts.transmission) : null;
  if (transOpt && transOpt.dims) {
    if (transOpt.dims.manivelle && transOpt.dims.manivelle.length > 1)
      fields.push({id:'dim-manivelle', label:'Longueur manivelle (mm)', options: transOpt.dims.manivelle, key:'manivelle'});
    if (transOpt.dims.plateaux && transOpt.dims.plateaux.length >= 1)
      fields.push({id:'dim-plateaux', label:'Plateau(x)', options: transOpt.dims.plateaux, key:'plateaux'});
    if (transOpt.dims.cassette && transOpt.dims.cassette.length >= 1)
      fields.push({id:'dim-cassette', label:'Cassette', options: transOpt.dims.cassette, key:'cassette'});
  }

  // Pilotage
  const pilOpt = selOpts.pilotage ? ALL_OPTIONS.pilotage.find(o => o.id === selOpts.pilotage) : null;
  if (pilOpt && pilOpt.dims) {
    // Cas spécial : pilotage_rd_ala = monobloc
    if (selOpts.pilotage === 'pilotage_rd_ala') {
      if (pilOpt.dims.cintre && pilOpt.dims.cintre.length > 1)
        fields.push({id:'dim-cintre', label:'Largeur ensemble ext-ext (mm)', options: pilOpt.dims.cintre, key:'cintre',
          note:'Ensemble monobloc cintre + potence'});
    } else {
      if (pilOpt.dims.cintre && pilOpt.dims.cintre.length > 1)
        fields.push({id:'dim-cintre', label:'Largeur cintre ext-ext (mm)', options: pilOpt.dims.cintre, key:'cintre'});
      if (pilOpt.dims.potence && pilOpt.dims.potence.length > 1)
        fields.push({id:'dim-potence', label:'Longueur potence (mm)', options: pilOpt.dims.potence, key:'potence'});
    }
  }

  // Pneus
  const pneuOpt = selOpts.pneus ? ALL_OPTIONS.pneus.find(o => o.id === selOpts.pneus) : null;
  if (pneuOpt && pneuOpt.dims && pneuOpt.dims.section && pneuOpt.dims.section.length >= 1) {
    // Modification 1 : gravel_bikepacking = max 42mm (cadre limité)
    let sectionOpts = pneuOpt.dims.section;
    if (selModel === 'gravel_bikepacking') {
      sectionOpts = sectionOpts.filter(s => {
        const num = parseFloat(String(s).replace(',', '.'));
        return isNaN(num) || num <= 42;
      });
    }
    if (sectionOpts.length >= 1)
      fields.push({id:'dim-section', label:'Section pneu', options: sectionOpts, key:'section',
        });
  }

  // Fourche VTT
  const fourcheOpt = selOpts.fourche ? ALL_OPTIONS.fourche.find(o => o.id === selOpts.fourche) : null;
  if (fourcheOpt && fourcheOpt.dims && fourcheOpt.dims.debattement && fourcheOpt.dims.debattement.length > 1)
    fields.push({id:'dim-debattement', label:'Débattement fourche (mm)', options: fourcheOpt.dims.debattement, key:'debattement'});

  // Selle
  const selleOpt = selOpts.selle ? ALL_OPTIONS.selle.find(o => o.id === selOpts.selle) : null;
  if (selleOpt && selleOpt.dims && selleOpt.dims.largeur_selle && selleOpt.dims.largeur_selle.length >= 1)
    fields.push({id:'dim-largeur-selle', label:'Largeur selle (mm)', options: selleOpt.dims.largeur_selle, key:'largeur_selle'});

  if (fields.length === 0) {
    grid.innerHTML = '<p style="color:var(--text3);font-size:13px;">Sélectionnez d\'abord un modèle et vos composants en étape 2.</p>';
    return;
  }

  // Pré-sélection des valeurs par défaut selon taille de cadre
  const defs = selSize.taille && DEFAULTS_BY_TAILLE[selModel] ? DEFAULTS_BY_TAILLE[selModel][selSize.taille] : {};
  if (defs) {
    fields.forEach(f => {
      if (!selSize[f.key] && defs[f.key] !== undefined) {
        const defVal = defs[f.key];
        // Trouver la valeur disponible la plus proche (inférieure pour manivelle)
        if (f.options && f.options.length > 0) {
          const nums = f.options.map(Number).filter(n => !isNaN(n));
          if (nums.length > 0) {
            let best;
            if (f.key === 'manivelle' || f.key === 'potence') {
              // Plus petit ou égal, sinon le plus petit dispo
              const lte = nums.filter(n => n <= defVal);
              best = lte.length > 0 ? Math.max(...lte) : Math.min(...nums);
            } else {
              // Plus proche, égalité → le plus grand
              best = nums.reduce((a,b) => {
                const da = Math.abs(a - defVal);
                const db = Math.abs(b - defVal);
                if (da === db) return Math.max(a, b);
                return da < db ? a : b;
              });
            }
            selSize[f.key] = String(best);
          } else {
            // Options non numériques : cherche la correspondance exacte ou skip
            if (f.options.includes(String(defVal))) selSize[f.key] = String(defVal);
          }
        }
      }
    });
  }

  const SECONDARY_KEYS = ['plateaux', 'cassette', 'section', 'debattement', 'largeur_selle'];
  const primaryFields   = fields.filter(f => !SECONDARY_KEYS.includes(f.key));
  const secondaryFields = fields.filter(f =>  SECONDARY_KEYS.includes(f.key));

  function renderField(f) {
    selSize[f.key] = selSize[f.key] || null;
    const optHTML = f.options.map(o =>
      `<option value="${o}" ${selSize[f.key]==o?'selected':''}>${o}${f.key==='manivelle'||f.key==='potence'?' mm':''}</option>`
    ).join('');
    const onchangeFn = f.key === 'taille'
      ? `selSize['${f.key}']=this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; selSize.debattement=null; buildDimsGrid();`
      : `selSize['${f.key}']=this.value`;
    const jnspOption = f.options.length >= 2
      ? `<option value="">Je ne sais pas encore</option>`
      : '';
    // Valeur unique : pré-sélectionner silencieusement
    if (f.options.length === 1) selSize[f.key] = String(f.options[0]);
    return `<div class="dim-field">
      <label>${f.label}</label>
      <select class="size-select" id="${f.id}" onchange="${onchangeFn}" ${f.options.length === 1 ? 'disabled style="opacity:0.6;"' : ''}>
        <option value="">— choisir —</option>
        ${optHTML}
        ${jnspOption}
      </select>
      ${f.note ? `<span class="dim-note">${f.note}</span>` : ''}
    </div>`;
  }

  let html = '<div class="dims-grid-primary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;">' +
    primaryFields.map(renderField).join('') + '</div>';
  if (secondaryFields.length > 0) {
    html += '<hr style="border:none;border-top:0.5px solid #444;margin:1.5rem 0 1.25rem;">' +
      '<div class="dims-grid-secondary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;">' +
      secondaryFields.map(renderField).join('') + '</div>';
  }
  // Envelopper dans un flex column pour garantir l'empilement vertical
  grid.innerHTML = html;

  // Même rendu pour le grid mobile (p11-dims-grid)
  const mobileGrid = document.getElementById('p11-dims-grid');
  if (mobileGrid && mobileGrid !== grid) {
    // Adapter les IDs pour éviter les doublons
    mobileGrid.innerHTML = html.replace(/id="dim-/g, 'id="p11-dim-')
      .replace(/id="guide-dim-/g, 'id="p11-guide-dim-');
    // Synchroniser les selects mobile avec selSize
    mobileGrid.querySelectorAll('select[id^="p11-dim-"]').forEach(sel => {
      const origId = sel.id.replace('p11-dim-', 'dim-');
      const key = origId.replace('dim-', '').replace(/-[a-z]+$/, '');
      sel.addEventListener('change', function() {
        // Trouver la clé via le onchange de l'original
        const orig = document.getElementById(origId);
        if (orig) { orig.value = this.value; orig.dispatchEvent(new Event('change')); }
        else {
          // Fallback : trouver la clé depuis les fields
          if (this.id === 'p11-dim-taille') { selSize.taille = this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; selSize.debattement=null; buildDimsGrid(); }
        }
      });
    });
  }

  // Si on est en mode "guidé" (panel-guide visible), copier les champs secondaires là-dedans
  const guideSec = document.getElementById('guide-secondary');
  if (guideSec) {
    if (secondaryFields.length > 0) {
      guideSec.innerHTML = '<hr style="border:none;border-top:0.5px solid #444;margin:1.5rem 0 1.25rem;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;">' +
        secondaryFields.map(f => renderField(f)).join('') + '</div>';
    } else {
      guideSec.innerHTML = '';
    }
  }
  // Miroir pour mobile guide-secondary
  const p11GuideSec = document.getElementById('p11-guide-secondary');
  if (p11GuideSec && guideSec) p11GuideSec.innerHTML = guideSec.innerHTML.replace(/id="guide-dim-/g, 'id="p11-guide-dim-');
}

function saveConfigFromSize() {
  const nameInput = document.getElementById('save-name-input-size');
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name) return;
  const entry = { id: Date.now(), name, selModel, selOpts: {...selOpts}, selSize: {...selSize}, date: new Date().toLocaleDateString('fr-FR') };
  savedConfigs.unshift(entry);
  persistConfigs();
  document.getElementById('save-toast-size').style.display = 'block';
  setTimeout(() => { document.getElementById('save-toast-size').style.display = 'none'; nameInput.value = ''; }, 2500);
}

function showSizeActionBtns() { window.sizeValidated = true; }

function validateDims() {
  // Lire les valeurs actuelles des selects dans la grille
  ['dim-taille','dim-manivelle','dim-plateaux','dim-cassette','dim-cintre','dim-potence','dim-section','dim-debattement','dim-largeur-selle'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) {
      const keyMap = {'dim-taille':'taille','dim-manivelle':'manivelle','dim-plateaux':'plateaux',
        'dim-cassette':'cassette','dim-cintre':'cintre','dim-potence':'potence',
        'dim-section':'section','dim-debattement':'debattement','dim-largeur-selle':'largeur_selle'};
      selSize[keyMap[id]] = el.value;
    }
  });

  const summary = document.getElementById('dims-summary');
  const lines = [];
  if (selSize.taille)        lines.push('<strong>Taille :</strong> ' + selSize.taille);
  if (selSize.manivelle)     lines.push('<strong>Manivelle :</strong> ' + selSize.manivelle + ' mm');
  if (selSize.plateaux)      lines.push('<strong>Plateau(x) :</strong> ' + selSize.plateaux);
  if (selSize.cassette)      lines.push('<strong>Cassette :</strong> ' + selSize.cassette);
  if (selSize.cintre)        lines.push('<strong>Cintre :</strong> ' + selSize.cintre + ' mm');
  if (selSize.potence)       lines.push('<strong>Potence :</strong> ' + selSize.potence + ' mm');
  if (selSize.section)       lines.push('<strong>Section pneu :</strong> ' + selSize.section);
  if (selSize.debattement)   lines.push('<strong>Débattement :</strong> ' + selSize.debattement + ' mm');
  if (selSize.largeur_selle) lines.push('<strong>Largeur selle :</strong> ' + selSize.largeur_selle + ' mm');
  if (lines.length === 0) {
    summary.innerHTML = '<span style="color:#e24b4a">Veuillez sélectionner au moins une dimension.</span>';
  } else {
    summary.innerHTML = '✅ <strong>Dimensions enregistrées :</strong><br>' + lines.join(' · ');
  }
  summary.classList.add('show');
  showSizeActionBtns();
  // Mettre à jour le bouton mobile ET desktop
  const _lbl = document.getElementById('p11-next-label');
  if (_lbl) _lbl.textContent = 'Ma configuration';
  v2SetTailleLabel(true);
}

// ─── DRAWER AIDE-CONTACT (mobile) ─────────────────────────────────────────────
function openContactDrawer() {
  document.getElementById('contact-drawer').classList.add('open');
  document.getElementById('contact-drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeContactDrawer() {
  document.getElementById('contact-drawer').classList.remove('open');
  document.getElementById('contact-drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
async function sendCallbackDrawer() {
  const phone = document.getElementById('cf-phone-d').value.trim();
  const email = document.getElementById('cf-email-d').value.trim();
  const toast = document.getElementById('cf-toast-d');
  const error = document.getElementById('cf-error-d');
  toast.style.display = 'none'; error.style.display = 'none';
  if (!phone && !email) { error.style.display = 'block'; return; }
  const model = MODELS.find(m => m.id === selModel);
  try {
    const res = await fetch('https://formspree.io/f/mqeoqewy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ telephone: phone, email, modele: model ? model.name : '', _subject: 'Demande de rappel — Obvious Configurateur' })
    });
    if (res.ok) { toast.style.display = 'block'; document.getElementById('cf-phone-d').value = ''; document.getElementById('cf-email-d').value = ''; }
    else { error.textContent = 'Erreur, réessayez.'; error.style.display = 'block'; }
  } catch(e) { error.textContent = 'Erreur réseau.'; error.style.display = 'block'; }
}

// ─── CALCUL CINTRE DEPUIS INTER-ACROMIONS ─────────────────────────────────────
function calcCintreFromAcro(acro) {
  // Récupérer les options de cintre disponibles selon le pilotage sélectionné
  const pilOpt = selOpts.pilotage ? ALL_OPTIONS.pilotage.find(o => o.id === selOpts.pilotage) : null;
  if (!pilOpt || !pilOpt.dims || !pilOpt.dims.cintre) return;
  const available = pilOpt.dims.cintre.map(Number);
  if (available.length === 0) return;

  let target;
  if (selModel === 'route') {
    target = acro;
  } else if (selModel === 'gravel_racing' || selModel === 'gravel_bikepacking') {
    target = acro;
  } else if (selModel === 'vtt_enduro') {
    // Valeur du milieu ou immédiatement au dessus
    const sorted = [...available].sort((a,b) => a-b);
    const mid = (sorted.length - 1) / 2;
    target = sorted[Math.ceil(mid)];
    selSize.cintre = String(target);
    return;
  } else {
    target = acro;
  }

  // Trouver la valeur la plus proche selon la règle
  const nums = [...available].sort((a,b) => a-b);
  let best;
  if (selModel === 'route') {
    // Plus proche, égalité → plus petit
    best = nums.reduce((a,b) => {
      const da = Math.abs(a - target);
      const db = Math.abs(b - target);
      if (da === db) return Math.min(a, b);
      return da < db ? a : b;
    });
  } else {
    // gravel : plus proche, égalité → plus grand
    best = nums.reduce((a,b) => {
      const da = Math.abs(a - target);
      const db = Math.abs(b - target);
      if (da === db) return Math.max(a, b);
      return da < db ? a : b;
    });
  }
  selSize.cintre = String(best);
}

// ─── FULLSCREEN ───────────────────────────────────────────────────────────────
function toggleFullscreen() {
  const icon = document.getElementById('fs-icon');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      icon.className = 'ti ti-minimize';
    }).catch(err => console.log('Fullscreen error:', err));
  } else {
    document.exitFullscreen().then(() => {
      icon.className = 'ti ti-maximize';
    });
  }
}
document.addEventListener('fullscreenchange', () => {
  const icon = document.getElementById('fs-icon');
  if (icon) icon.className = document.fullscreenElement ? 'ti ti-minimize' : 'ti ti-maximize';
});


// Tooltips proto11
function toggleTooltip(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('show');
}

// ══ PROTO11 : PARCOURS MOBILE ══════════════════════════════════════════════
let p11CurrentStep = 1;
let p11SizeMode = null;
let p11OverlapTailles = null;

const P11_LABELS = ['Choisir votre modèle', 'Configurer vos composants', 'Votre taille', 'Votre configuration'];
const P11_NEXT_LABELS = ['Configurer vos composants', 'Choisir votre taille', 'Voir votre configuration', null];

function p11Init() {
  if (window.innerWidth >= 768) return;
  // Cacher l'interface desktop, afficher le parcours mobile
  document.getElementById('view-config').style.display = 'none';
  document.getElementById('bottom-row').style.display = 'none';
  const tabs = document.querySelector('.tab-bar');
  if (tabs) tabs.style.display = 'none';
  document.getElementById('p11-container').style.display = 'block';
  // Masquer FAB drawer (le drawer reste accessible si besoin)
  p11RenderModels();
  p11UpdateStep(1);
  p11InitSwipe();
}

function p11UpdateStep(n) {
  p11CurrentStep = n;
  // Dots + flèches nav + labels
  for (let i=1; i<=4; i++) {
    const dot = document.getElementById('p11-dot-' + i);
    if (!dot) continue;
    dot.className = 'p11-step-dot' + (i === n ? ' active' : i < n ? ' done' : '');
    const sl = document.getElementById('p11-sl-' + i);
    if (sl) sl.style.color = i === n ? '#F5C400' : i < n ? '#666' : '#333';
  }
  const backBtn = document.getElementById('p11-back-btn');
  const fwdBtn  = document.getElementById('p11-fwd-btn');
  if (backBtn) backBtn.style.color = n > 1 ? '#F5C400' : '#333';
  if (fwdBtn)  fwdBtn.style.color  = n < 4 ? '#F5C400' : '#333';
  // Steps
  document.querySelectorAll('.p11-step').forEach(s => { s.classList.remove('active'); s.classList.remove('p11-active'); s.style.display = 'none'; });
  const step = document.getElementById('p11-s' + n);
  if (step) { step.classList.add('p11-active'); step.style.display = 'block'; }
  // Bouton next
  const bar = document.getElementById('p11-bottom-bar');
  const btn = document.getElementById('p11-next-btn');
  const nextLbl = document.getElementById('p11-next-label');
  const priceStrip = document.getElementById('p11-price-strip');
  if (n === 4) {
    if (bar) bar.style.display = 'none';
    // Bandeau onglet 4 : affiché via IntersectionObserver
    p11InitStep4Bar();
  } else {
    if (bar) bar.style.display = 'block';
    if (nextLbl) {
      if (n === 3 && !window.sizeValidated) {
        nextLbl.textContent = 'Continuer sans taille';
      } else {
        nextLbl.textContent = P11_NEXT_LABELS[n-1] || '';
      }
    }
  }
  // Afficher le prix uniquement sur étape 2 et 3 (config + taille)
  if (priceStrip) priceStrip.style.display = (selModel) ? 'flex' : 'none';
  const stripSave = document.getElementById('p11-strip-save');
  if (stripSave) stripSave.style.display = (n >= 2 && selModel) ? 'flex' : 'none';
  // Step 1 : désactiver next si pas de modèle
  if (n === 1) btn.style.opacity = selModel ? '1' : '.4';
  // Step 2 : construire les postes
  if (n === 2) { p11RenderPosts(); p11UpdateTotal(); }
  // Step 3 : rebuilder dims si mode connu
  if (n === 3 && p11SizeMode) p11BuildDimsGrid();
  // Step 4 : construire le récap final
  if (n === 4) p11RenderFinalRecap();
  // FAB : 20px si étape 4 (pas de bandeau), 76px sinon (au-dessus du bandeau)
  const fab = document.getElementById('fab-contact');
  // FAB now hidden on mobile (replaced by header button)
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function p11Next() {
  if (p11CurrentStep === 1 && !selModel) return;
  if (p11CurrentStep < 4) p11UpdateStep(p11CurrentStep + 1);
}

function p11GoTo(n) { p11UpdateStep(n); }

// Rendu modèles mobile
function p11RenderModels() {
  const grid = document.getElementById('p11-model-grid');
  if (!grid) return;
  grid.className = 'model-grid';
  grid.innerHTML = MODELS.map(m => {
    const sel = m.id === selModel;
    return '<div class="p11-model-card' + (sel ? ' sel' : '') + '" onclick="p11SelectModel(\'' + m.id + '\')">' +
      '<img class="mc-photo" src="' + (m.photo||'') + '" alt="' + m.name + '" loading="lazy">' +
      '<div class="mc-text">' +
        '<span class="mc-badge">' + m.badge + '</span>' +
        '<span class="mc-name">' + m.name + '</span>' +
        '<span class="mc-desc">' + m.desc + '</span>' +
        '<span class="mc-price">à partir de ' + (m.basePrice + (m.assembly||0)).toLocaleString('fr-FR') + ' €</span>' +
      '</div>' +
    '</div>';
  }).join('');
  // Presets bar
  p11RenderPresets();
}



function p11RenderPresets() {
  const bar = document.getElementById('p11-preset-bar');
  if (!bar || !selModel || !PRESETS[selModel]) { if(bar) bar.style.display='none'; return; }
  bar.style.display = 'block';
  bar.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<span style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.08em;">3 suggestions de départ</span>' +
      '<button onclick="p11TogglePresetInfo()" style="background:none;border:none;color:#888;font-size:15px;cursor:pointer;padding:0 4px;line-height:1;" title="En savoir plus"><i class="ti ti-info-circle"></i></button>' +
    '</div>' +
    '<div id="p11-preset-info" style="display:none;font-size:12px;color:#aaa;background:#1a1a1a;border:0.5px solid #333;padding:10px 12px;margin-bottom:10px;line-height:1.7;">' +
      Object.entries(PRESET_DESCS).reverse().map(([k,v]) =>
        '<div><span style="color:#F5C400;font-weight:600;">' + k + '</span> — ' + v + '</div>'
      ).join('') +
      '<div style="margin-top:6px;color:#666;font-size:11px;">Tout reste modifiable après sélection.</div>' +
    '</div>' +
    '<div class="preset-btns">' +
      ['Signature','Ti1','Ti2'].map(decl =>
        '<button class="preset-btn' + (window._activePreset===decl?' active':'') + '" onclick="p11LoadPreset(\'' + decl + '\')">' + decl + '</button>'
      ).join('') +
    '</div>';
}

function p11TogglePresetInfo() {
  const el = document.getElementById('p11-preset-info');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function p11LoadPreset(decl) {
  const preset = PRESETS[selModel] && PRESETS[selModel][decl];
  if (!preset) return;
  window._activePreset = decl;
  selOpts = {...preset};
  // Appliquer FORCE_SELECT
  Object.keys(selOpts).forEach(postId => {
    const optId = selOpts[postId];
    if (!optId) return;
    FORCE_SELECT.forEach(rule => {
      if (rule.if_selected === optId) {
        Object.entries(rule.force).forEach(([fp, fid]) => {
          if (!selOpts[fp]) selOpts[fp] = fid;
        });
      }
    });
  });
  p11RenderModels();   // met à jour la surbrillance des boutons preset
  // Activer le bouton next (un modèle est sélectionné)
  const btn = document.getElementById('p11-next-btn');
  if (btn) btn.style.opacity = '1';
  // Mettre à jour le prix affiché
  p11UpdateTotal();
  const priceStrip = document.getElementById('p11-price-strip');
  if (priceStrip && selModel) priceStrip.style.display = 'flex';
}

function p11SelectModel(id) {
  selModel = id; selOpts = {}; openPost = null;
  const preset = PRESETS[id] && PRESETS[id]['Ti1'];
  if (preset) { window._activePreset = 'Ti1'; selOpts = {...preset}; }
  p11RenderModels();
  p11RenderPresets();
  // Activer bouton next
  const btn = document.getElementById('p11-next-btn');
  if (btn) btn.style.opacity = '1';
  // Afficher le bottom bar avec le prix dès l'onglet 1
  const bar = document.getElementById('p11-bottom-bar');
  if (bar) bar.style.display = 'block';
  p11UpdateTotal();
}

// Rendu postes mobile
function p11RenderPosts() {
  const container = document.getElementById('p11-posts-list');
  if (!container || !selModel) return;
  const icons = { fourche:'ti-git-fork', roues:'ti-circle', pneus:'ti-circle-dotted', transmission:'ti-settings', power:'ti-activity', frein:'ti-hand-stop', pilotage:'ti-adjustments-horizontal', selle:'ti-armchair', tige:'ti-arrows-vertical', pedales:'ti-rotate-clockwise' };
  container.innerHTML = POST_META.map(p => {
    const opts = optionsFor(p.id, selModel);
    if (!opts.length) return '';
    // Masquer "mesure de puissance" si une seule option (= non disponible)
    if (p.id === 'power' && opts.length <= 1) return '';
    const selOpt = opts.find(o => o.id === selOpts[p.id]);
    const isOpen = openPost === p.id;
    const curPrice = selOpt && !isLocked(selOpt, selModel) ? selOpt.price : 0;
    const hasPhotos = opts.some(o => o.image && o.image.length > 0 && o.image !== 'assets/no_option.png');

    const optHtml = hasPhotos
      ? '<div class="opt-photo-grid">' + opts.map(o => {
          const locked = isLocked(o, selModel);
          const sel = selOpts[p.id] === o.id;
          const isDefault = isPresetDefault(p.id, o.id);
          const rec = isRecommended(o, selModel);
          let diff, pc;
          if (locked) {
            diff = curPrice!==0 ? '−'+Math.abs(curPrice).toLocaleString('fr-FR')+' €' : '';
            pc = curPrice!==0?'neg':'incl';
          } else {
            const d = o.price - curPrice;
            diff = isDefault ? 'inclus' : sel ? '±0 €' : d===0 ? '±0 €' : (d>0?'+':'')+d.toLocaleString('fr-FR')+' €';
            pc = d<0?'neg':d>0?'pos':'zero';
          }
          const imgHTML = o.image && o.image !== 'assets/no_option.png'
            ? '<img src="' + o.image + '" alt="' + o.name + '" loading="lazy" onerror="this.style.display=\'none\'">'
            : '<div class="opc-img-placeholder"><i class="ti ti-photo"></i></div>';
          return '<div class="opt-photo-card' + (sel?' sel':'') + '" onclick="p11SelectOpt(\'' + p.id + '\',\'' + o.id + '\')">' +
            '<div class="opc-check"><i class="ti ti-check"></i></div>' +
            '<div class="opc-img-wrap">' + imgHTML + '</div>' +
            '<div class="opc-body">' +
              (rec ? '<div class="opc-badges"><span class="opc-badge-rec"><i class="ti ti-star" style="font-size:8px"></i> Recommandé</span></div>' : '') +
              '<div class="opc-name">' + o.name + '</div>' +
              (o.desc ? '<div class="opc-desc">' + o.desc + '</div>' : '') +
              (isDefault ? '<span class="incl-preset">inclus</span>' : (diff ? '<div class="opc-price' + (pc==='neg'?' negative':'') + '">' + diff + '</div>' : '')) +
            '</div>' +
          '</div>';
        }).join('') + '</div>'
      : '<div class="opt-list">' + opts.map(o => {
          const locked = isLocked(o, selModel);
          const sel = selOpts[p.id] === o.id;
          const isDefault = isPresetDefault(p.id, o.id);
          let diff, diffNeg;
          if (locked) {
            diff = curPrice!==0 ? '−'+Math.abs(curPrice).toLocaleString('fr-FR')+' €' : '—';
            diffNeg = false;
          } else {
            const d = o.price - curPrice;
            diff = isDefault ? 'inclus' : sel ? '±0 €' : d===0 ? '±0 €' : (d>0?'+':'')+d.toLocaleString('fr-FR')+' €';
            diffNeg = d < 0;
          }
          return '<div class="opt-item' + (sel?' sel':'') + '" onclick="p11SelectOpt(\'' + p.id + '\',\'' + o.id + '\')">' +
            '<div class="opt-radio"><div class="radio-dot"></div></div>' +
            '<div class="oi-info">' +
              '<div class="oi-name">' + o.name + '</div>' +
              (o.desc ? '<div class="oi-desc">' + o.desc + '</div>' : '') +
            '</div>' +
            '<div class="oi-meta">' + (isDefault ? '<span class="incl-preset">inclus</span>' : '<div class="oi-price' + (diffNeg?' negative':'') + '">' + diff + '</div>') + '</div>' +
          '</div>';
        }).join('') + '</div>';

    const isModified = !!(selOpts[p.id] && window._activePreset && PRESETS[selModel] &&
      PRESETS[selModel][window._activePreset] &&
      PRESETS[selModel][window._activePreset][p.id] !== selOpts[p.id]);
    return '<div class="post-block" data-post-id="' + p.id + '">' +
      '<div class="post-hdr" onclick="p11TogglePost(\'' + p.id + '\')">' +
        '<i class="ti ' + (icons[p.id]||'ti-point') + ' ph-icon"></i>' +
        '<span class="ph-name">' + p.name + (isModified ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F5C400;margin-left:6px;vertical-align:middle;"></span>' : '') + '</span>' +
        (selOpt ? '<span class="ph-sel">' + selOpt.name + '</span>' : '<span class="ph-pending">choisir →</span>') +
        '<i class="ti ti-chevron-down ph-chev' + (isOpen?' open':'') + '"></i>' +
      '</div>' +
      '<div class="post-opts' + (isOpen?' open':'') + '">' + optHtml + '</div>' +
    '</div>';
  }).join('');
  p11UpdateTotal();
}

function p11SelectOpt(postId, optId) {
  const opt = optionsFor(postId, selModel).find(o => o.id === optId);
  if (!opt) return;
  selOpts[postId] = optId;

  // Transmission VTT : gestion des freins
  if (postId === 'transmission' && selModel === 'vtt_enduro') {
    const isSramVtt = optId && optId.startsWith('trans_vtt_sr_');
    if (isSramVtt) {
      if (!selOpts['frein'] || selOpts['frein'] === 'frein_all') selOpts['frein'] = 'frein_vtt_sr_db8';
    } else {
      if (!selOpts['frein'] || ['frein_vtt_sr_db8','frein_vtt_sr_mvs','frein_vtt_sr_mvu'].includes(selOpts['frein'])) selOpts['frein'] = 'frein_all';
    }
  }

  // Réinitialiser power si on change de transmission
  if (postId === 'transmission') {
    const currentPwr = selOpts['power'];
    if (currentPwr && currentPwr !== 'pwr_all') {
      const pwrRule = FORCE_SELECT.find(r => r.if_selected === currentPwr && r.force.transmission);
      if (!pwrRule || pwrRule.force.transmission !== optId) selOpts['power'] = 'pwr_all';
    }
  }

  // Sélections forcées (power → transmission, cintre plat ↔ CUES FLAT)
  FORCE_SELECT.forEach(rule => {
    if (rule.if_selected === optId) {
      Object.entries(rule.force).forEach(([forcePost, forceId]) => {
        const available = optionsFor(forcePost, selModel);
        if (available.find(o => o.id === forceId)) selOpts[forcePost] = forceId;
      });
    }
  });

  // Effacer les sélections incompatibles dans les autres postes
  POST_META.forEach(p => {
    if (p.id === postId) return;
    if (!selOpts[p.id]) return;
    const allIncompat = POST_META.reduce((acc, pp) => {
      if (!selOpts[pp.id]) return acc;
      const o = ALL_OPTIONS[pp.id]?.find(x => x.id === selOpts[pp.id]);
      return o ? acc.concat(o.incompat) : acc;
    }, []);
    if (allIncompat.includes(selOpts[p.id])) selOpts[p.id] = null;
  });

  p11RenderPosts();
}

function p11TogglePost(id) {
  openPost = openPost === id ? null : id;
  p11RenderPosts();
}

function p11UpdateTotal() {
  if (!selModel) return;
  const {price} = computeTotals(selModel, selOpts);
  const formatted = price.toLocaleString('fr-FR') + ' €';
  const el = document.getElementById('p11-total-val');
  if (el) el.textContent = formatted;
  const strip = document.getElementById('p11-strip-price');
  if (strip) strip.textContent = formatted;
  const stripBar = document.getElementById('p11-price-strip');
  if (stripBar && selModel) stripBar.style.display = 'flex';
  // Compteur de modifications vs préconfig
  if (window._activePreset && PRESETS[selModel] && PRESETS[selModel][window._activePreset]) {
    const preset = PRESETS[selModel][window._activePreset];
    let count = 0;
    Object.keys(selOpts).forEach(postId => {
      if (selOpts[postId] && preset[postId] !== selOpts[postId]) count++;
    });
    const modifText = count === 0 ? '' : '<span style="color:#F5C400;">●</span> ' + count + ' personnalisation' + (count > 1 ? 's' : '') + ' ↳ ' + window._activePreset;
    const modifEl = document.getElementById('p11-modif-count');
    if (modifEl) { modifEl.textContent = modifText; modifEl.style.display = count > 0 ? 'block' : 'none'; }
    const stripModif = document.getElementById('p11-strip-modif');
    if (stripModif) { stripModif.innerHTML = modifText; stripModif.style.display = count > 0 ? 'block' : 'none'; }
  }
}

function p11ToggleSave() {
  document.getElementById('p11-save-form').classList.toggle('open');
}
function p11ToggleSaveFinal() {
  document.getElementById('p11-save-form-final').classList.toggle('open');
}

// Fitting mobile
function p11ToggleSizeMode(mode) {
  p11SizeMode = mode;
  document.getElementById('p11-choice-guide').classList.toggle('active', mode==='guide');
  document.getElementById('p11-choice-manual').classList.toggle('active', mode==='manual');
  document.getElementById('p11-panel-guide').classList.toggle('open', mode==='guide');
  document.getElementById('p11-panel-manual').classList.toggle('open', mode==='manual');
  p11BuildDimsGrid(); // remplit dims-grid (manual) ET p11-guide-secondary (guide)
}

function p11CalcSize() {
  const stature = parseInt(document.getElementById('p11-guide-stature').value);
  const ejRaw   = parseFloat(document.getElementById('p11-guide-ej').value) || null;
  const acroRaw = parseFloat(document.getElementById('p11-guide-acro').value) || null;
  const acro    = acroRaw ? Math.round(acroRaw * 10) : null;
  const result  = document.getElementById('p11-guide-result');
  const main    = document.getElementById('p11-result-main');
  const sub     = document.getElementById('p11-result-sub');
  const overlap = document.getElementById('p11-overlap');

  if (!selModel || !stature) { main.textContent = 'Veuillez saisir votre taille.'; result.classList.add('show'); return; }
  const tailles = TAILLES_CADRE[selModel] || [];
  let matches = ejRaw ? tailles.filter(t => ejRaw >= t.ej_min && ejRaw <= t.ej_max) : tailles.filter(t => stature >= t.stature_min && stature <= t.stature_max);
  if (ejRaw && !matches.length) {
    const cl = tailles.reduce((a,b) => Math.min(Math.abs(ejRaw-a.ej_min),Math.abs(ejRaw-a.ej_max)) < Math.min(Math.abs(ejRaw-b.ej_min),Math.abs(ejRaw-b.ej_max)) ? a : b);
    matches = [cl];
  }
  result.classList.add('show'); overlap.style.display='none';
  document.getElementById('p11-btn-sport').classList.remove('sel');
  document.getElementById('p11-btn-confort').classList.remove('sel');
  p11OverlapTailles = null;
  if (!matches.length) { main.textContent = 'Aucune taille trouvée.'; return; }
  if (matches.length === 1) {
    const t = matches[0];
    window.sizeValidated = true;
    selSize.taille = t.taille;
    const defs = DEFAULTS_BY_TAILLE[selModel]?.[t.taille] || {};
    Object.assign(selSize, Object.fromEntries(Object.entries(defs).map(([k,v])=>[k,String(v)])));
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let info = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (acro && selSize.cintre) info += ' · Cintre : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    sub.innerHTML = info;
    // Mettre à jour le bouton
    const _nextLbl = document.getElementById('p11-next-label');
    if (_nextLbl) _nextLbl.textContent = 'Ma configuration';
    return;
  }
  p11OverlapTailles = matches;
  main.innerHTML = 'Deux tailles : <span style="color:#F5C400">' + matches.map(t=>t.taille).join(' ou ') + '</span>';
  sub.innerHTML = '<span style="color:#e8e8e8">Précisez votre usage ↓</span>';
  overlap.style.display = 'block';
}

function p11ChooseUsage(usage) {
  if (!p11OverlapTailles) return;
  document.getElementById('p11-btn-sport').classList.toggle('sel', usage==='sport');
  document.getElementById('p11-btn-confort').classList.toggle('sel', usage==='confort');
  const sorted = [...p11OverlapTailles].sort((a,b)=>a.stature_min-b.stature_min);
  const chosen = usage==='sport' ? sorted[0] : sorted[sorted.length-1];
  window.sizeValidated = true;
  selSize.taille = chosen.taille;
  const _cLbl = document.getElementById('p11-next-label');
  if (_cLbl) _cLbl.textContent = 'Ma configuration';
  const defs = DEFAULTS_BY_TAILLE[selModel]?.[chosen.taille] || {};
  Object.assign(selSize, Object.fromEntries(Object.entries(defs).map(([k,v])=>[k,String(v)])));
  const acroRaw = parseFloat(document.getElementById('p11-guide-acro').value) || null;
  if (acroRaw) calcCintreFromAcro(Math.round(acroRaw*10));
  document.getElementById('p11-result-main').innerHTML =
    'Taille recommandée : <span style="color:#F5C400">' + chosen.taille + '</span> <span style="font-size:12px;color:#888">(' + (usage==='sport'?'sportif':'confort') + ')</span>';
  // Mettre à jour le bouton "Continuer sans taille" → "Voir votre configuration"
  const _nextLbl = document.getElementById('p11-next-label');
  if (_nextLbl && p11CurrentStep === 3) _nextLbl.textContent = 'Voir votre configuration';
}

function p11BuildDimsGrid() {
  const grid = document.getElementById('p11-dims-grid');
  if (!grid || !selModel) return;
  const fields = [];

  // Taille de cadre
  const tailles = TAILLES_CADRE[selModel] || [];
  if (tailles.length > 0) fields.push({ id:'p11-dim-taille', label:'Taille de cadre', options: tailles.map(t=>t.taille), key:'taille' });

  // Transmission
  const transOpt = selOpts.transmission ? ALL_OPTIONS.transmission.find(o=>o.id===selOpts.transmission) : null;
  if (transOpt && transOpt.dims) {
    if (transOpt.dims.manivelle && transOpt.dims.manivelle.length > 1)
      fields.push({id:'p11-dim-manivelle', label:'Longueur manivelle (mm)', options:transOpt.dims.manivelle, key:'manivelle'});
    if (transOpt.dims.plateaux && transOpt.dims.plateaux.length >= 1)
      fields.push({id:'p11-dim-plateaux', label:'Plateau(x)', options:transOpt.dims.plateaux, key:'plateaux'});
    if (transOpt.dims.cassette && transOpt.dims.cassette.length >= 1)
      fields.push({id:'p11-dim-cassette', label:'Cassette', options:transOpt.dims.cassette, key:'cassette'});
  }

  // Pilotage
  const pilOpt = selOpts.pilotage ? ALL_OPTIONS.pilotage.find(o=>o.id===selOpts.pilotage) : null;
  if (pilOpt && pilOpt.dims) {
    if (selOpts.pilotage === 'pilotage_rd_ala') {
      if (pilOpt.dims.cintre && pilOpt.dims.cintre.length > 1)
        fields.push({id:'p11-dim-cintre', label:'Largeur ensemble ext-ext (mm)', options:pilOpt.dims.cintre, key:'cintre', note:'Ensemble monobloc'});
    } else {
      if (pilOpt.dims.cintre && pilOpt.dims.cintre.length > 1)
        fields.push({id:'p11-dim-cintre', label:'Largeur cintre ext-ext (mm)', options:pilOpt.dims.cintre, key:'cintre'});
      if (pilOpt.dims.potence && pilOpt.dims.potence.length > 1)
        fields.push({id:'p11-dim-potence', label:'Longueur potence (mm)', options:pilOpt.dims.potence, key:'potence'});
    }
  }

  // Pneus
  const pneuOpt = selOpts.pneus ? ALL_OPTIONS.pneus.find(o=>o.id===selOpts.pneus) : null;
  if (pneuOpt && pneuOpt.dims && pneuOpt.dims.section && pneuOpt.dims.section.length >= 1) {
    let sectionOpts = pneuOpt.dims.section;
    if (selModel === 'gravel_bikepacking') {
      sectionOpts = sectionOpts.filter(s => { const num = parseFloat(String(s).replace(',','.')); return isNaN(num) || num <= 42; });
    }
    if (sectionOpts.length >= 1)
      fields.push({id:'p11-dim-section', label:'Section pneu', options:sectionOpts, key:'section',
        });
  }

  // Fourche VTT
  const fourcheOpt = selOpts.fourche ? ALL_OPTIONS.fourche.find(o=>o.id===selOpts.fourche) : null;
  if (fourcheOpt && fourcheOpt.dims && fourcheOpt.dims.debattement && fourcheOpt.dims.debattement.length > 1)
    fields.push({id:'p11-dim-debattement', label:'Débattement fourche (mm)', options:fourcheOpt.dims.debattement, key:'debattement'});

  // Selle
  const selleOpt = selOpts.selle ? ALL_OPTIONS.selle.find(o=>o.id===selOpts.selle) : null;
  if (selleOpt && selleOpt.dims && selleOpt.dims.largeur_selle && selleOpt.dims.largeur_selle.length >= 1)
    fields.push({id:'p11-dim-largeur-selle', label:'Largeur selle (mm)', options:selleOpt.dims.largeur_selle, key:'largeur_selle'});

  if (fields.length === 0) {
    grid.innerHTML = '<p style="color:#666;font-size:13px;">Sélectionnez d\'abord vos composants à l\'étape 2.</p>';
    return;
  }

  // Pré-sélection des valeurs par défaut selon taille
  const defs = selSize.taille && DEFAULTS_BY_TAILLE[selModel] ? DEFAULTS_BY_TAILLE[selModel][selSize.taille] : {};
  if (defs) {
    fields.forEach(f => {
      if (!selSize[f.key] && defs[f.key] !== undefined) {
        const defVal = defs[f.key];
        if (f.options && f.options.length > 0) {
          const nums = f.options.map(Number).filter(n=>!isNaN(n));
          if (nums.length > 0) {
            let best;
            if (f.key === 'manivelle' || f.key === 'potence') {
              const lte = nums.filter(n=>n<=defVal);
              best = lte.length > 0 ? Math.max(...lte) : Math.min(...nums);
            } else {
              best = nums.reduce((a,b) => Math.abs(a-defVal)<=Math.abs(b-defVal)?a:b);
            }
            selSize[f.key] = String(best);
          } else {
            if (f.options.includes(String(defVal))) selSize[f.key] = String(defVal);
          }
        }
      }
    });
  }

  const P11_SEC = ['plateaux','cassette','section','debattement','largeur_selle'];
  const p11Primary   = fields.filter(f => !P11_SEC.includes(f.key));
  const p11Secondary = fields.filter(f =>  P11_SEC.includes(f.key));

  function p11RenderField(f) {
    if (f.options.length === 1) selSize[f.key] = String(f.options[0]);
    const optHTML = f.options.map(o =>
      '<option value="' + o + '"' + (selSize[f.key]==o?' selected':'') + '>' + o +
      (['manivelle','potence'].includes(f.key) ? ' mm' : '') + '</option>'
    ).join('');
    const onchangeFn = f.key === 'taille'
      ? "selSize['" + f.key + "']=this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; selSize.debattement=null; p11BuildDimsGrid();"
      : "selSize['" + f.key + "']=this.value";
    return '<div class="dim-field"><label>' + f.label + '</label>' +
      '<select class="size-select" id="' + f.id + '" onchange="' + onchangeFn + '"' +
      (f.options.length === 1 ? ' disabled style="opacity:0.6;"' : '') + '>' +
      '<option value="">— choisir —</option>' + optHTML +
      (f.options.length >= 2 ? '<option value="">Je ne sais pas encore</option>' : '') +
      '</select>' +
      (f.note ? '<span class="dim-note">' + f.note + '</span>' : '') + '</div>';
  }

  const gridStyle = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;';
  let p11Html = '<div style="' + gridStyle + '">' + p11Primary.map(p11RenderField).join('') + '</div>';
  if (p11Secondary.length > 0) {
    p11Html += '<hr style="border:none;border-top:0.5px solid #444;margin:1.25rem 0;">' +
      '<div style="' + gridStyle + '">' + p11Secondary.map(p11RenderField).join('') + '</div>';
  }
  grid.innerHTML = '<div style="display:flex;flex-direction:column;width:100%;">' + p11Html + '</div>';

  // Remplir p11-guide-secondary (panel guide mobile) avec les champs secondaires
  const p11Sec = document.getElementById('p11-guide-secondary');
  if (p11Sec) {
    if (p11Secondary.length > 0) {
      const gs = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;';
      p11Sec.innerHTML = '<hr style="border:none;border-top:0.5px solid #444;margin:1.25rem 0;">' +
        '<div style="' + gs + '">' +
        p11Secondary.map(f => {
          const optHTML = f.options.map(o =>
            '<option value="' + o + '"' + (selSize[f.key]==o?' selected':'') + '>' + o + '</option>'
          ).join('');
          const onchangeFn = "selSize['" + f.key + "']=this.value";
          return '<div class="dim-field"><label>' + f.label + '</label>' +
            '<select class="size-select" onchange="' + onchangeFn + '">' +
            '<option value="">— choisir —</option>' + optHTML + '</select>' +
            (f.note ? '<span class="dim-note">' + f.note + '</span>' : '') + '</div>';
        }).join('') + '</div>';
    } else {
      p11Sec.innerHTML = '';
    }
  }
}

function p11ValidateDims() {
  // Lire les selects p11-
  const keyMap = {
    'p11-dim-taille':'taille','p11-dim-manivelle':'manivelle','p11-dim-plateaux':'plateaux',
    'p11-dim-cassette':'cassette','p11-dim-cintre':'cintre','p11-dim-potence':'potence',
    'p11-dim-section':'section','p11-dim-debattement':'debattement','p11-dim-largeur-selle':'largeur_selle'
  };
  Object.entries(keyMap).forEach(([id,key]) => {
    const el = document.getElementById(id);
    if (el && el.value) selSize[key] = el.value;
  });
  window.sizeValidated = true;
  const lines = [];
  if (selSize.taille)        lines.push('<strong>Taille :</strong> ' + selSize.taille);
  if (selSize.manivelle)     lines.push('<strong>Manivelle :</strong> ' + selSize.manivelle + ' mm');
  if (selSize.plateaux)      lines.push('<strong>Plateau(x) :</strong> ' + selSize.plateaux);
  if (selSize.cassette)      lines.push('<strong>Cassette :</strong> ' + selSize.cassette);
  if (selSize.cintre)        lines.push('<strong>Cintre :</strong> ' + selSize.cintre + ' mm');
  if (selSize.potence)       lines.push('<strong>Potence :</strong> ' + selSize.potence + ' mm');
  if (selSize.section)       lines.push('<strong>Section pneu :</strong> ' + selSize.section);
  if (selSize.debattement)   lines.push('<strong>Débattement :</strong> ' + selSize.debattement + ' mm');
  if (selSize.largeur_selle) lines.push('<strong>Largeur selle :</strong> ' + selSize.largeur_selle + ' mm');
  const p11Summary = document.getElementById('p11-dims-summary');
  if (p11Summary) {
    if (lines.length === 0) {
      p11Summary.innerHTML = '<span style="color:#e24b4a">Veuillez sélectionner au moins une dimension.</span>';
    } else {
      p11Summary.innerHTML = '✅ <strong>Dimensions enregistrées :</strong><br>' + lines.join(' · ');
      // Mettre à jour le bouton next
      const nextLbl = document.getElementById('p11-next-label');
      if (nextLbl && p11CurrentStep === 3) nextLbl.textContent = 'Voir votre configuration';
    }
    p11Summary.classList.add('show');
  }
}

// Récap final étape 4
function p11RenderFinalRecap() {
  const el = document.getElementById('p11-final-recap');
  if (!el || !selModel) return;
  const model = MODELS.find(m=>m.id===selModel);
  if (!model) return;
  const {price, weight} = computeTotals(selModel, selOpts);
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise'};
  let html = '<div style="margin-bottom:1rem;padding:1rem;background:#111;border:0.5px solid #222;display:flex;align-items:center;gap:12px;">' +
    (model.photo ? '<img src="' + model.photo + '" alt="' + model.name + '" style="width:80px;height:54px;object-fit:cover;flex-shrink:0;border:0.5px solid #333;">' : '') +
    '<div style="flex:1;min-width:0;">' +
      '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">' + model.badge + '</div>' +
      '<div style="font-size:15px;font-weight:600;color:#f2f2f2;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + model.name + '</div>' +
      '<div style="font-size:20px;font-weight:700;color:#F5C400;">' + price.toLocaleString('fr-FR') + ' €</div>' +
    '</div>' +
    '</div>';
  POST_META.forEach(p => {
    const opt = optionsFor(p.id, selModel).find(o=>o.id===selOpts[p.id]);
    if (!opt) return;
    const locked = isLocked(opt, selModel);
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:0.5px solid #1a1a1a;">' +
      '<i class="ti ' + (icons[p.id]||'ti-point') + '" style="color:#F5C400;font-size:14px;width:18px;"></i>' +
      '<div style="flex:1;">' +
        '<div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.06em;">' + p.name + '</div>' +
        '<div style="font-size:13px;color:#f2f2f2;">' + opt.name + '</div>' +
      '</div>' +
    '</div>';
  });
  // Taille si définie
  const sizeText = buildSizeText();
  if (sizeText) {
    html += '<div style="margin-top:1rem;padding:.75rem 1rem;background:#0a1520;border:0.5px solid #333;">' +
      '<div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Dimensions</div>' +
      '<div style="font-size:12px;color:#aaa;line-height:1.8;">' + sizeText.replace(/\n/g,'<br>') + '</div>' +
    '</div>';
  }
  el.innerHTML = html;
  // Pré-remplir le modal devis
  syncSelSize();
}


// Sauvegarde rapide depuis le bandeau


// ─── BANDEAU FIXE ONGLET 4 ────────────────────────────────────────
let _step4Observer = null;
function p11InitStep4Bar() {
  const barS4 = document.getElementById('p11-bar-s4');
  if (!barS4) return;
  // Mettre à jour le prix dans le bandeau
  if (selModel) {
    const {price} = computeTotals(selModel, selOpts);
    const s4price = document.getElementById('p11-s4-price');
    if (s4price) s4price.textContent = price.toLocaleString('fr-FR') + ' €';
    if (window._activePreset && PRESETS[selModel] && PRESETS[selModel][window._activePreset]) {
      const preset = PRESETS[selModel][window._activePreset];
      let count = 0;
      Object.keys(selOpts).forEach(pid => { if (selOpts[pid] && preset[pid] !== selOpts[pid]) count++; });
      const s4modif = document.getElementById('p11-s4-modif');
      if (s4modif) {
        s4modif.textContent = count > 0 ? count + ' personnalisation' + (count>1?'s':'') + ' vs ' + window._activePreset : '';
        s4modif.style.display = count > 0 ? 'block' : 'none';
      }
    }
  }
  // Observer le titre de l'étape 4
  if (_step4Observer) _step4Observer.disconnect();
  const sentinel = document.getElementById('p11-s4-sentinel');
  if (!sentinel) return;
  _step4Observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      barS4.style.display = e.isIntersecting ? 'none' : 'block';
    });
  }, { threshold: 0, rootMargin: '-56px 0px 0px 0px' });
  _step4Observer.observe(sentinel);
}

function p11GoToPost(postId) {
  openPost = postId;
  p11UpdateStep(2);
  // Laisser le temps au rendu puis scroller
  setTimeout(() => {
    const el = document.querySelector('.post-block[data-post-id="' + postId + '"]');
    if (!el) return;
    const headerH = 56 + 68;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 100);
}

function p11QuickSave() {
  const name = prompt('Nom de cette configuration :', 'Ma config');
  if (!name || !name.trim()) return;
  doSaveConfig(name.trim());
  // Mini toast dans le bandeau
  const btn = document.getElementById('p11-strip-save');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check" style="color:#F5C400;"></i>';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  }
}

function p11Reset() {
  // Tout remettre à zéro — y compris le modèle
  selModel = null; selOpts = {}; selSize = {}; window.sizeValidated = false;
  openPost = null; p11SizeMode = null; p11OverlapTailles = null;
  window._activePreset = null;
  // Vider les champs taille
  ['p11-guide-stature','p11-guide-ej','p11-guide-acro'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('p11-guide-result')?.classList.remove('show');
  const ovEl = document.getElementById('p11-overlap');
  if (ovEl) ovEl.style.display = 'none';
  document.getElementById('p11-dims-summary')?.classList.remove('show');
  // Masquer le bandeau prix (plus de modèle)
  const bar = document.getElementById('p11-bottom-bar');
  if (bar) bar.style.display = 'none';
  const strip = document.getElementById('p11-price-strip');
  if (strip) strip.style.display = 'none';
  // Re-rendre la grille modèles (tout décoché)
  p11RenderModels();
  p11RenderPresets();
  p11UpdateStep(1);
}


// ─── SWIPE HORIZONTAL ENTRE ÉTAPES ─────────────────────────────────
function p11InitSwipe() {
  const cont = document.getElementById('p11-container');
  if (!cont) return;
  let startX = 0, startY = 0, blocked = false;

  cont.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    blocked = !!(e.target.closest('input, textarea, select, button, a, [contenteditable]'));
  }, { passive: true });

  cont.addEventListener('touchend', e => {
    if (blocked) return;
    const af = document.activeElement;
    if (af && af.closest && af.closest('input, textarea, select')) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (Math.abs(dx) < 70 || dy > Math.abs(dx) / 2) return;
    if (dx < 0 && p11CurrentStep < 4) p11UpdateStep(p11CurrentStep + 1);
    else if (dx > 0 && p11CurrentStep > 1) p11UpdateStep(p11CurrentStep - 1);
  }, { passive: true });
}

// Init au chargement — une seule fois
let p11Initialized = false;

function p11TryInit() {
  if (window.innerWidth < 768) {
    if (!p11Initialized) {
      p11Initialized = true;
      document.getElementById('p11-container').style.display = 'block';
      p11Init();
    }
  } else {
    // Repassé en desktop : reset le flag pour permettre un re-init si on revient mobile
    if (p11Initialized) {
      p11Initialized = false;
      document.getElementById('p11-container').style.display = 'none';
    }
  }
}

// Appel immédiat ET sur DOMContentLoaded pour être sûr
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', p11TryInit);
} else {
  p11TryInit();
}

// Resize : utiliser un debounce et vérifier que la largeur a vraiment changé
// (le clavier iOS change la HAUTEUR, pas la largeur — on ignore les changements de hauteur)
let p11LastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  if (newWidth !== p11LastWidth) {
    p11LastWidth = newWidth;
    p11TryInit();
  }
});