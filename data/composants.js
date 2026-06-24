// data/composants.js
// Postes, options de composants, règles de forçage

const POST_META = [
  { id: 'fourche',      name: 'Fourche',             icon: 'ti-git-fork' },
  { id: 'roues',        name: 'Roues',               icon: 'ti-circle' },
  { id: 'pneus',        name: 'Pneus',               icon: 'ti-circle-dotted' },
  { id: 'transmission', name: 'Transmission',        icon: 'ti-settings' },
  { id: 'power',        name: 'Mesure de puissance', icon: 'ti-activity' },
  { id: 'frein',        name: 'Freins',              icon: 'ti-hand-stop' },
  { id: 'pilotage',     name: 'Poste de pilotage',   icon: 'ti-adjustments-horizontal' },
  { id: 'selle',        name: 'Selle',               icon: 'ti-armchair' },
  { id: 'tige',         name: 'Tige de selle',       icon: 'ti-arrows-vertical' },
  { id: 'pedales',      name: 'Pédales',             icon: 'ti-rotate-clockwise' },
];

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
  document.getElementById('saved-count').textContent = savedConfigs.length;
  const tabSaved = document.getElementById('tab-saved');
  if (tabSaved) tabSaved.style.display = savedConfigs.length === 0 ? 'none' : 'flex';
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

const ALL_OPTIONS = {
  fourche: [
    { id: 'fourche_rd_car_00', name: 'Fourche ON/', desc: 'Fourche carbone pivot conique', price: 0, weight: 0, lockedFor: ['route'], compat: [{mid:'route',rec:false}], incompat: [], image: 'assets/fourche/fourche_rd_car_00.png' },
    { id: 'fourche_gr_car_00', name: 'Fourche gravel, sans inserts', desc: 'Fourche gravel carbone sans inserts, pivot conique, pneu max 50 mm', price: 0, weight: 0, lockedFor: ['gravel_racing'], compat: [{mid:'gravel_racing',rec:true},{mid:'gravel_bikepacking',rec:false}], incompat: [], image: 'assets/fourche/fourche_gr_car_00.png' },
    { id: 'fourche_gr_car_ins', name: 'Fourche gravel, avec inserts', desc: 'Fourche gravel carbone avec inserts, pivot conique, pneu max 50 mm', price: 0, weight: 0, lockedFor: ['gravel_bikepacking'], compat: [{mid:'gravel_bikepacking',rec:true},{mid:'gravel_racing',rec:false}], incompat: [], image: 'assets/fourche/fourche_gr_car_ins.png' },
    { id: 'fourche_vtt_fox_fac_36_150', name: 'Fox Factory 36 150 mm', desc: 'Suspendue Fox Factory Kashima Grip2', price: 600, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], dims: {"debattement": [140, 150]}, image: 'assets/fourche/fourche_vtt_fox_fac_36_150.png' },
    { id: 'fourche_vtt_rs_lyr_ult_150', name: 'Rockshox Lytrik Ultimate 150 mm', desc: 'Suspendue Rockshox Lyrik Ultimate', price: 350, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], dims: {"debattement": [140, 150]}, image: 'assets/fourche/fourche_vtt_rs_lyr_ult_150.png' },
    { id: 'fourche_vtt_rs_lyr_sel_150', name: 'Rockshox Lytrik Select 150 mm', desc: 'Suspendue Rockshox Lyrik Select', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], dims: {"debattement": [140, 150]}, image: 'assets/fourche/fourche_vtt_rs_lyr_sel_150.png' },
  ],
  roues: [
    { id: 'roue_gr_ob_35', name: 'Obvious GR35-S', desc: 'Carbone hyper polyvalente, moyeu DT350, rayons profilés', price: 765, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], image: 'assets/roues/roue_gr_ob_35.png' },
    { id: 'roue_gr_fu_soa', name: 'Fulcrum Soniq ALX', desc: 'Aluminium, la meilleure solution all-road et gravel aluminium', price: 0, weight: 0, lockedFor: ['gravel_bikepacking','gravel_racing'], compat: [{mid:'gravel_bikepacking',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], image: 'assets/roues/roue_gr_fu_soa.png' },
    { id: 'roue_gr_dt_g16', name: 'DT Swiss GR1600 Spline', desc: 'Roue aluminium, largeur interne 24 mm pour pneus jusqu\'à 52 mm', price: 75, weight: 0, lockedFor: [], compat: [{mid:'gravel_bikepacking',rec:true},{mid:'gravel_racing',rec:false}], incompat: [], image: 'assets/roues/roue_gr_dt_g16.png' },
    { id: 'roue_gr_fu_sgr', name: 'Fulcrum Sharq GR', desc: 'Roue compétition gravel, largeur interne 30 mm', price: 1400, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], image: 'assets/roues/roue_gr_fu_sgr.png' },
    { id: 'roue_rd_dt_p16', name: 'DT Swiss PR1600 Spline', desc: 'Roues aluminium, équilibre entre légèreté et confort', price: 0, weight: 0, lockedFor: ['route'], compat: [{mid:'route',rec:false}], incompat: [], image: 'assets/roues/roue_rd_dt_p16.png' },
    { id: 'roue_rd_ob_35', name: 'Obvious RD-35-R', desc: 'Carbone compétition hyper polyvalente, moyeu DT350, rayons profilés, marquage laser', price: 750, weight: 0, lockedFor: [], compat: [{mid:'route',rec:true}], incompat: [], image: 'assets/roues/roue_rd_ob_35.png' },
    { id: 'roue_rd_fu_w57', name: 'Fulcrum Wind 57', desc: 'Carbone profil haut', price: 810, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: 'assets/roues/roue_rd_fu_w57.png' },
    { id: 'roue_vtt_fu_rm5', name: 'Fulcrum Red Metal 5', desc: 'Roue Enduro aluminium, à toute épreuve', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/roues/roue_vtt_fu_rm5.png' },
    { id: 'roue_vtt_dt_e17', name: 'DT Swiss EX1700 Classic', desc: 'Aluminium et savoir-faire : durabilité et agilité', price: 330, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/roues/roue_vtt_dt_e17.png' },
    { id: 'roue_vtt_ob_30', name: 'Obvious MT30-S', desc: 'Roue Enduro Carbone, ultralégère et indestructible', price: 920, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/roues/roue_vtt_ob_30.png' },
    { id: 'roue_vtt_hp_f30', name: 'Hope Fortus 30W', desc: 'La roue aluminium de référence en enduro', price: 255, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/roues/roue_vtt_hp_f30.png' },
  ],
  pneus: [
    { id: 'pneu_gr_sc_r', name: 'Schwalbe G-One R Pro transparent', desc: 'Pneu gravel polyvalent', price: 0, weight: 0, lockedFor: ['gravel_bikepacking','gravel_racing'], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"section": [40, 45, 50]}, image: 'assets/pneus/pneu_gr_sc_r.png' },
    { id: 'pneu_gr_sc_rx', name: 'Schwalbe G-One RX Pro noir', desc: 'Le meilleur grip pour le gravel', price: 0, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"section": [40, 45, 50]}, image: 'assets/pneus/pneu_gr_sc_rx.png' },
    { id: 'pneu_gr_sc_sp', name: 'Schwalbe G-One Speed noir', desc: 'Pneu gravel pour les terrains les plus roulants', price: -5, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"section": [35]}, image: 'assets/pneus/pneu_gr_sc_sp.png' },
    { id: 'pneu_rd_co_gp', name: 'Continental GP5000 S TR transparent', desc: 'Le meilleur pneu route du moment', price: 0, weight: 0, lockedFor: ['route'], compat: [{mid:'route',rec:false}], incompat: [], dims: {"section": [28, 30, 32]}, image: 'assets/pneus/pneu_rd_co_gp.png' },
    { id: 'pneu_vtt_sc_gra', name: 'Schwalbe Magic Mary Gravity', desc: 'Le pneu le plus agressif pour les enduristes', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/pneus/pneu_vtt_sc_gra.png' },
  ],
  transmission: [
    { id: 'trans_gr_sh_821', name: 'SHIMANO GRX 820 1x12V', desc: '1x12v, à câble, haut de gamme Shimano', price: 275, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:true}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["40", "42"], "cassette": ["10x45", "10x51"]}, image: 'assets/transmission/trans_gr_sh_821.png' },
    { id: 'trans_gr_sh_822', name: 'SHIMANO GRX 820 2x12V', desc: '2x12v, à câble, haut de gamme Shimano', price: 335, weight: 0, lockedFor: [], compat: [{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["48x31"], "cassette": ["11x34", "11x36"]}, image: 'assets/transmission/trans_gr_sh_822.png' },
    { id: 'trans_gr_sh_611', name: 'SHIMANO GRX 820/610 1x12V', desc: '1x12v, à câble, le 12 vitesses accessible', price: 0, weight: 0, lockedFor: ['gravel_bikepacking','gravel_racing'], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5, 175], "plateaux": ["38", "40"], "cassette": ["10x45", "10x51"]}, image: 'assets/transmission/trans_gr_sh_611.png' },
    { id: 'trans_gr_sh_cud', name: 'SHIMANO CUES U6040 DROP 1x11v', desc: 'Hyper polyvalent 11 vitesses', price: -155, weight: 0, lockedFor: [], compat: [{mid:'gravel_bikepacking',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], dims: {"manivelle": [170, 172.5, 175], "plateaux": ["40", "42"], "cassette": ["11x50"]}, image: 'assets/transmission/trans_gr_sh_cud.png' },
    { id: 'trans_gr_sh_cuf', name: 'SHIMANO CUES U6040 FLAT 1x11v', desc: 'Hyper polyvalent 11 vitesses pour cintre plat', price: -155, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['pilotage_rd_ala','pilotage_rd_suz_car','pilotage_rd_suz_alu','pilotage_gr_suz_car','pilotage_gr_suz_alu','pilotage_gr_ger_alu','pilotage_gr_drp_alu','pilotage_gr_gerz_alu'], dims: {"manivelle": [170, 172.5, 175], "plateaux": ["40", "42"], "cassette": ["11x50"]}, image: 'assets/transmission/trans_gr_sh_cuf.png' },
    { id: 'trans_gr_sr_ri', name: 'SRAM RIVAL AXS XPLR 1x13v', desc: '1x13v sans fil, la solution robuste de SRAM', price: 420, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["38", "40", "42", "44", "46"], "cassette": ["10x46"]}, image: 'assets/transmission/trans_gr_sr_ri.png' },
    { id: 'trans_gr_sr_fo', name: 'SRAM FORCE AXS XPLR 1x13v', desc: '1x13v sans fil, le bon compromis SRAM', price: 820, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:true},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["42", "44", "46", "48", "50"], "cassette": ["10x46"]}, image: 'assets/transmission/trans_gr_sr_fo.png' },
    { id: 'trans_gr_sr_re', name: 'SRAM RED AXS XPLR 1x13v', desc: '1x13v sans fil, hyper performant', price: 2300, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 167.5, 170, 172.5, 175], "plateaux": ["40", "42", "44", "46", "50"], "cassette": ["10x46"]}, image: 'assets/transmission/trans_gr_sr_re.png' },
    { id: 'trans_gr_ca_ek', name: 'CAMPAGNOLO EKAR 1x13v', desc: '1x13v à câble du constructeur italien', price: 770, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5, 175], "plateaux": ["36", "38", "40", "42"], "cassette": ["10x48"]}, image: 'assets/transmission/trans_gr_ca_ek.png' },
    { id: 'trans_gr_ca_re', name: 'CAMPAGNOLO RECORD X 1x13v', desc: '1x13v sans fil du constructeur italien', price: 1300, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5], "plateaux": ["38", "40", "42", "44", "46", "48", "50", "52"], "cassette": ["10x48"]}, image: 'assets/transmission/trans_gr_ca_re.png' },
    { id: 'trans_rd_sh_105', name: 'SHIMANO 105 Di2 2x12v', desc: '2x12v, accessibilité et performance', price: 0, weight: 0, lockedFor: ['route'], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["50x34", "52x36"], "cassette": ["11x34", "11x36"]}, image: 'assets/transmission/trans_rd_sh_105.png' },
    { id: 'trans_rd_sh_ul', name: 'SHIMANO ULTEGRA R8100 Di2 2x12v', desc: '2x12v, le meilleur du Di2 Shimano', price: 550, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["50x34", "52x36"], "cassette": ["11x30", "11x34"]}, image: 'assets/transmission/trans_rd_sh_ul.png' },
    { id: 'trans_rd_sh_da', name: 'SHIMANO DURA ACE R9200 Di2 2x12v', desc: '2x12v, le choix des pros', price: 2065, weight: 0, lockedFor: [], compat: [{mid:'route',rec:true}], incompat: [], dims: {"manivelle": [165, 167.5, 170, 172.5, 175, 177.5], "plateaux": ["50x34", "52x36", "54x40"], "cassette": ["11x30", "11x34"]}, image: 'assets/transmission/trans_rd_sh_da.png' },
    { id: 'trans_rd_sr_ri', name: 'SRAM RIVAL AXS 2x12v', desc: '2x12v, accessibilité et performance', price: -200, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["46x33", "48x35"], "cassette": ["10x30", "10x36"]}, image: 'assets/transmission/trans_rd_sr_ri.png' },
    { id: 'trans_rd_sr_fo', name: 'SRAM FORCE AXS 2x12v', desc: '2x12v, le meilleur AXS', price: 230, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [160, 165, 170, 172.5, 175], "plateaux": ["46x33", "48x35", "50x37"], "cassette": ["10x30", "10x33"]}, image: 'assets/transmission/trans_rd_sr_fo.png' },
    { id: 'trans_rd_sr_re', name: 'SRAM RED AXS 2x12v', desc: '2x12v, le choix des pros', price: 1700, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [150, 155, 160, 165, 167.5, 170, 172.5, 175], "plateaux": ["46x33", "48x35", "50x37"], "cassette": ["10x30", "10x33"]}, image: 'assets/transmission/trans_rd_sr_re.png' },
    { id: 'trans_rd_ca_re', name: 'CAMPAGNOLO RECORD ALL-ROAD 2x13v', desc: '2x13v, sans fil', price: 990, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5], "plateaux": ["45x29", "48x32", "50x34", "52x36", "53x39", "54x39", "55x39"], "cassette": ["10x33", "11x36"]}, image: 'assets/transmission/trans_rd_ca_re.png' },
    { id: 'trans_rd_ca_sre', name: 'CAMPAGNOLO SUPER RECORD 2x13v', desc: '2x13v, boîtier céramique. Orfèvrerie italienne', price: 2590, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5, 175], "plateaux": ["45x29", "48x32", "50x34", "52x36", "53x39", "54x39", "55x39"], "cassette": ["10x29", "10x33", "11x32", "11x36"]}, image: 'assets/transmission/trans_rd_ca_sre.png' },
    { id: 'trans_vtt_sh_m6', name: 'SHIMANO DEORE M6100', desc: 'Le choix accessible', price: 105, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 175], "plateaux": ["30", "32"], "cassette": ["10x51"]}, image: 'assets/transmission/trans_vtt_sh_m6.png' },
    { id: 'trans_vtt_sh_slx', name: 'SHIMANO SLX', desc: 'Performance et accessibilité', price: 225, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 175], "plateaux": ["30", "32"], "cassette": ["10x51"]}, image: 'assets/transmission/trans_vtt_sh_slx.png' },
    { id: 'trans_vtt_sh_xt', name: 'SHIMANO XT M8100', desc: 'Performance et polyvalence', price: 300, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5, 175], "plateaux": ["30", "32"], "cassette": ["10x51"]}, image: 'assets/transmission/trans_vtt_sh_xt.png' },
    { id: 'trans_vtt_sh_xte', name: 'SHIMANO XT 8200 Di2', desc: 'Shimano XT, sans fil', price: 1210, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5, 175], "plateaux": ["30", "32"], "cassette": ["10x51"]}, image: 'assets/transmission/trans_vtt_sh_xte.png' },
    { id: 'trans_vtt_sh_xtr', name: 'SHIMANO XTR M9100', desc: 'La solution compétition de Shimano', price: 1020, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 175], "plateaux": ["32", "34"], "cassette": ["10x51"]}, image: 'assets/transmission/trans_vtt_sh_xtr.png' },
    { id: 'trans_vtt_sh_xtre', name: 'SHIMANO XTR M9200 Di2', desc: 'Shimano XTR, sans fil', price: 1950, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 172.5, 175], "plateaux": ["30", "32", "34"], "cassette": ["10x51"]}, image: 'assets/transmission/trans_vtt_sh_xtre.png' },
    { id: 'trans_vtt_sr_e70', name: 'SRAM EAGLE 70', desc: 'Le choix accessible', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [155, 160, 165, 170, 175], "plateaux": ["30", "32"], "cassette": ["10x52"]}, image: 'assets/transmission/trans_vtt_sr_e70.png' },
    { id: 'trans_vtt_sr_gx', name: 'SRAM GX EAGLE', desc: 'Le VTT accessible en montage T-Type', price: 640, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [155, 160, 165, 170, 175], "plateaux": ["28", "30", "32", "34"], "cassette": ["10x52"]}, image: 'assets/transmission/trans_vtt_sr_gx.png' },
    { id: 'trans_vtt_sr_x0', name: 'SRAM XO EAGLE', desc: 'Performance et polyvalence en T-Type', price: 1110, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:true},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 175], "plateaux": ["28", "30", "32", "34"], "cassette": ["10x52"]}, image: 'assets/transmission/trans_vtt_sr_x0.png' },
    { id: 'trans_vtt_sr_xxs', name: 'SRAM XX SL EAGLE', desc: 'La solution compétition de SRAM', price: 1720, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"manivelle": [165, 170, 175], "plateaux": ["34"], "cassette": ["10x52"]}, image: 'assets/transmission/trans_vtt_sr_xxs.png' },
  ],
  power: [
    { id: 'pwr_all', name: 'Sans mesure de puissance', desc: '', price: 0, weight: 0, lockedFor: ['gravel_racing','gravel_bikepacking','vtt_enduro','route'], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_enduro',rec:false},{mid:'route',rec:false}], incompat: [], image: 'assets/no_option.png' },
    { id: 'pwr_gr_sr_ri', name: 'SRAM Rival XPLR AXS', desc: 'Capteur dans l\'axe de pédalier (mono-jambe)', price: 180, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_gr_sr_ri.png' },
    { id: 'pwr_gr_sr_fo', name: 'SRAM Force XPLR AXS', desc: 'Capteur dans l\'axe de pédalier (mono-jambe)', price: 205, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_gr_sr_fo.png' },
    { id: 'pwr_gr_sr_re', name: 'SRAM Red XPLR AXS', desc: 'Capteur Quarq dans l\'étoile du pédalier', price: 500, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_gr_sr_re.png' },
    { id: 'pwr_gr_ca_re', name: 'Campagnolo Record 1x13', desc: 'Capteur sur chaque manivelle', price: 550, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_gr_ca_re.png' },
    { id: 'pwr_rd_sr_ri', name: 'SRAM Rival AXS 2x12', desc: 'Capteur dans l\'axe de pédalier (mono-jambe)', price: 200, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_sr_ri.png' },
    { id: 'pwr_rd_sr_fo', name: 'SRAM Force AXS 2x12', desc: 'Capteur Quarq dans l\'étoile du pédalier', price: 360, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_sr_fo.png' },
    { id: 'pwr_rd_sr_re', name: 'SRAM Red AXS 2x12', desc: 'Capteur Quarq dans l\'étoile du pédalier', price: 540, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_sr_re.png' },
    { id: 'pwr_rd_sh_ul', name: 'Shimano Ultegra R8100-P', desc: 'Capteur intégré dans les manivelles du pédalier', price: 540, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_sh_ul.png' },
    { id: 'pwr_rd_sh_da', name: 'Shimano Dura-Ace R9200-P', desc: 'Capteur intégré dans les manivelles du pédalier', price: 580, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_sh_da.png' },
    { id: 'pwr_rd_ca_re', name: 'Campagnolo Record 2x13', desc: 'Capteur sur chaque manivelle', price: 1050, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_ca_re.png' },
    { id: 'pwr_rd_ca_sre', name: 'Campagnolo Super Record 2x13', desc: 'Capteur sur chaque manivelle', price: 1050, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0','trans_vtt_sr_xxs'], image: 'assets/power/pwr_rd_ca_sre.png' },
    { id: 'pwr_vtt_sr_x0', name: 'SRAM X0 Eagle AXS', desc: 'Capteur Quarq dans l\'étoile du pédalier', price: 190, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_xxs'], image: 'assets/power/pwr_vtt_sr_x0.png' },
    { id: 'pwr_vtt_sr_xxs', name: 'SRAM XX SL Eagle AXS', desc: 'Capteur Quarq dans l\'étoile du pédalier', price: 420, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre','trans_vtt_sh_m6','trans_vtt_sh_slx','trans_vtt_sh_xt','trans_vtt_sh_xte','trans_vtt_sh_xtr','trans_vtt_sh_xtre','trans_vtt_sr_e70','trans_vtt_sr_gx','trans_vtt_sr_x0'], image: 'assets/power/pwr_vtt_sr_xxs.png' },
  ],
  frein: [
    { id: 'frein_all', name: 'Freins inclus avec la transmission', desc: '', price: 0, weight: 0, lockedFor: ['gravel_bikepacking','gravel_racing','route','vtt_enduro','vtt_xc'], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: 'assets/no_option.png' },
    { id: 'frein_vtt_hp_tr4', name: 'Freins Hope EVO TR4', desc: '4 pistons. Référence du frein trail', price: 410, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: ['trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_611','trans_gr_sh_cud','trans_gr_sh_cuf','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re','trans_rd_sh_105','trans_rd_sh_ul','trans_rd_sh_da','trans_rd_sr_ri','trans_rd_sr_fo','trans_rd_sr_re','trans_rd_ca_re','trans_rd_ca_sre'], image: 'assets/frein/frein_vtt_hp_tr4.png' },
    { id: 'frein_vtt_sr_db8', name: 'Freins SRAM DB8', desc: '4 pistons, simple et robuste', price: 0, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: 'assets/frein/frein_vtt_sr_db8.png' },
    { id: 'frein_vtt_sr_mvs', name: 'Freins SRAM Maven Silver', desc: 'Le frein des disciplines Gravity', price: 230, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/frein/frein_vtt_sr_mvs.png' },
    { id: 'frein_vtt_sr_mvu', name: 'Freins SRAM Maven Ultimate', desc: 'Le frein de descente haut de gamme', price: 280, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: 'assets/frein/frein_vtt_sr_mvu.png' },
  ],
  pilotage: [
    { id: 'pilotage_rd_ala', name: 'Combo Deda Alanera DCR', desc: 'Ensemble combiné carbone', price: 395, weight: 0, lockedFor: [], compat: [{mid:'route',rec:true}], incompat: [], dims: {"cintre": [380, 400, 420, 440], "potence": [80, 90, 100, 110, 120, 130]}, image: 'assets/pilotage/pilotage_rd_ala.png' },
    { id: 'pilotage_rd_suz_car', name: 'Cintre Deda SuperZero RS Carbon / Potence Deda SuperBox', desc: 'Cintre route carbone profilé', price: 160, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], dims: {"cintre": [400, 420, 440, 460], "potence": [60, 70, 80, 90, 100, 110, 120, 130, 140]}, image: 'assets/pilotage/pilotage_rd_suz_car.png' },
    { id: 'pilotage_rd_suz_alu', name: 'Cintre Deda SuperZero RS Alu / Potence Deda SuperBox', desc: 'Cintre route aluminium profilé', price: 0, weight: 0, lockedFor: ['route'], compat: [{mid:'route',rec:false}], incompat: [], dims: {"cintre": [360, 380, 400, 420, 440], "potence": [60, 70, 80, 90, 100, 110, 120, 130, 140]}, image: 'assets/pilotage/pilotage_rd_suz_alu.png' },
    { id: 'pilotage_gr_suz_car', name: 'Cintre Deda SuperZero Carbon / Potence Deda SuperBox', desc: 'Cintre gravel carbone, profilé, flare 8°', price: 150, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false}], incompat: [], dims: {"cintre": [420, 440, 460], "potence": [60, 70, 80, 90, 100, 110, 120, 130, 140]}, image: 'assets/pilotage/pilotage_gr_suz_car.png' },
    { id: 'pilotage_gr_suz_alu', name: 'Cintre Deda SuperZero Alu / Potence Deda SuperBox', desc: 'Cintre gravel aluminium, profilé, flare 8°', price: 0, weight: 0, lockedFor: ['gravel_racing'], compat: [{mid:'gravel_racing',rec:true}], incompat: [], dims: {"cintre": [400, 420, 440, 460], "potence": [60, 70, 80, 90, 100, 110, 120, 130, 140]}, image: 'assets/pilotage/pilotage_gr_suz_alu.png' },
    { id: 'pilotage_gr_gerz_alu', name: 'Cintre Deda Gera Alu / Potence Deda Superbox', desc: 'Cintre gravel aluminium, multiposition, flare 12°', price: -25, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false}], incompat: [], dims: {"cintre": [420, 440, 460], "potence": [60, 70, 80, 90, 100, 110, 120, 130, 140]}, image: 'assets/pilotage/pilotage_gr_gerz_alu.png' },
    { id: 'pilotage_gr_ger_alu', name: 'Cintre Deda Gera Alu / Potence Deda Zero100', desc: 'Cintre gravel aluminium, multiposition, flare 12°', price: 95, weight: 0, lockedFor: [], compat: [{mid:'gravel_bikepacking',rec:true}], incompat: [], dims: {"cintre": [420, 440, 460], "potence": [80, 90, 100, 110, 120, 130, 140]}, image: 'assets/pilotage/pilotage_gr_ger_alu.png' },
    { id: 'pilotage_gr_drp_alu', name: 'Cintre gravel Randonneur Ergotec', desc: 'Cintre gravel aluminium, flare 12°', price: 0, weight: 0, lockedFor: ['gravel_bikepacking'], compat: [{mid:'gravel_bikepacking',rec:false}], incompat: [], dims: {"cintre": [440, 460], "potence": [50, 60, 70, 80, 90, 100, 110]}, image: 'assets/pilotage/pilotage_gr_drp_alu.png' },
    { id: 'pilotage_gr_flat_ext', name: 'Cintre gravel plat Deda Mud Peak', desc: 'Cintre plat pour plus de confort', price: -20, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['trans_gr_sh_611','trans_gr_sh_821','trans_gr_sh_822','trans_gr_sh_cud','trans_gr_sr_ri','trans_gr_sr_fo','trans_gr_sr_re','trans_gr_ca_ek','trans_gr_ca_re'], dims: {"cintre": [780], "potence": [50, 60, 70, 80, 90, 100, 110]}, image: 'assets/pilotage/pilotage_gr_flat_ext.png' },
    { id: 'pilotage_vtt_end', name: 'Cintre et potence Truvativ Descendant', desc: 'Potence 50 mm, Ø35 mm / Cintre 780 mm, 25 mm rise', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], dims: {"cintre": [760], "potence": [50]}, image: 'assets/pilotage/pilotage_vtt_end.png' },
  ],
  selle: [
    { id: 'selle_rd_ant_r5', name: 'Fizik Antares R5', desc: 'Course route et VTT', price: 0, weight: 0, lockedFor: ['route'], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [140, 150]}, image: 'assets/selle/selle_rd_ant_r5.png' },
    { id: 'selle_rd_ant_r3', name: 'Fizik Antares R3', desc: 'Course route et VTT, rail titane', price: 60, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [140, 150]}, image: 'assets/selle/selle_rd_ant_r3.png' },
    { id: 'selle_rd_ant_r1', name: 'Fizik Antares R1', desc: 'Course route et VTT, rail carbone', price: 90, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [140, 150]}, image: 'assets/selle/selle_rd_ant_r1.png' },
    { id: 'selle_gr_ali_r5', name: 'Fizik Aliante R5', desc: 'Route et gravel', price: 0, weight: 0, lockedFor: ['gravel_racing'], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'route',rec:false}], incompat: [], dims: {"largeur_selle": [145, 155]}, image: 'assets/selle/selle_gr_ali_r5.png' },
    { id: 'selle_gr_ali_r3', name: 'Fizik Aliante R3', desc: 'Route et gravel, rail titane', price: 60, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'route',rec:false}], incompat: [], dims: {"largeur_selle": [145, 155]}, image: 'assets/selle/selle_gr_ali_r3.png' },
    { id: 'selle_rd_arg_r3', name: 'Fizik Vento Argo R3', desc: 'Course route et gravel, selle courte, rail titane', price: 60, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], dims: {"largeur_selle": [140, 150]}, image: 'assets/selle/selle_rd_arg_r3.png' },
    { id: 'selle_rd_arg_r1', name: 'Fizik Vento Argo R1 Light', desc: 'Course route et gravel, selle courte, rail carbone', price: 90, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], dims: {"largeur_selle": [140, 150]}, image: 'assets/selle/selle_rd_arg_r1.png' },
    { id: 'selle_rd_arg_r00', name: 'Fizik Vento Argo R00', desc: 'Course route et gravel, selle courte, rail et coque carbone', price: 175, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], dims: {"largeur_selle": [140, 150]}, image: 'assets/selle/selle_rd_arg_r00.png' },
    { id: 'selle_gr_arg_x5', name: 'Fizik Terra Argo X5', desc: 'Gravel, selle courte', price: 0, weight: 0, lockedFor: ['gravel_bikepacking'], compat: [{mid:'gravel_bikepacking',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], dims: {"largeur_selle": [150, 160]}, image: 'assets/selle/selle_gr_arg_x5.png' },
    { id: 'selle_gr_arg_x3', name: 'Fizik Terra Argo X3', desc: 'Gravel, selle courte, rail titane', price: 50, weight: 0, lockedFor: [], compat: [{mid:'gravel_bikepacking',rec:false},{mid:'gravel_racing',rec:false}], incompat: [], dims: {"largeur_selle": [150, 160]}, image: 'assets/selle/selle_gr_arg_x3.png' },
    { id: 'selle_rd_ari_r3', name: 'Fizik Arione R3', desc: 'Course route, rail titane', price: 60, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [135, 145]}, image: 'assets/selle/selle_rd_ari_r3.png' },
    { id: 'selle_rd_ari_r00', name: 'Fizik Arione R1 Adaptive', desc: 'Course route, impression 3D et rail carbone', price: 175, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [135, 145]}, image: 'assets/selle/selle_rd_ari_r00.png' },
    { id: 'selle_vtt_alpt_x5', name: 'Fizik Alpaca Terra X5', desc: 'VTT, rail alliage léger, coupe anatomique', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [145]}, image: 'assets/selle/selle_vtt_alpt_x5.png' },
    { id: 'selle_br_b17_ho', name: 'Brooks B17 honey', desc: 'Cuir, touring', price: 55, weight: 0, lockedFor: [], compat: [{mid:'gravel_bikepacking',rec:false}], incompat: [], image: 'assets/selle/selle_br_b17_ho.png' },
    { id: 'selle_ber_asp_bk', name: 'Berthoud Aravis ouverte noir', desc: 'Cuir, fabrication française, longue distance + couvre selle', price: 250, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], image: 'assets/selle/selle_ber_asp_bk.png' },
    { id: 'selle_bek_lup', name: 'Selle Berk Lupina Short noir', desc: '99 gr, full carbone, revêtement cuir synthétique', price: 240, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], dims: {"largeur_selle": [132, 144, 150]}, image: 'assets/selle/selle_bek_lup.png' },
  ],
  tige: [
    { id: 'tige_rd_ob_car', name: 'Tige de selle Obvious carbone CS25', desc: 'Diamètre 27,2 mm, recul 25 mm. Compatible rail rond ou oval', price: 0, weight: 0, lockedFor: ['gravel_bikepacking','gravel_racing','route'], compat: [{mid:'route',rec:true},{mid:'gravel_racing',rec:true},{mid:'gravel_bikepacking',rec:false}], incompat: [], image: 'assets/tige/tige_rd_ob_car.png' },
    { id: 'tige_rd_de_z1',  name: 'Tige de selle Deda Zero1 aluminium', desc: 'Diamètre 27,2 mm, recul 20 mm. Compatible rail rond', price: -40, weight: 75, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: ['pilotage_rd_ala','pilotage_rd_suz_car','pilotage_gr_suz_car','pilotage_vtt_end'], image: 'assets/tige/tige_rd_de_z1.png' },
    { id: 'tige_rd_ob_ti', name: 'Tige de selle Obvious titane TS25', desc: 'Diamètre 27,2 mm, recul 25 mm. Compatible rail rond ou oval', price: 90, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false},{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:true}], incompat: [], image: 'assets/tige/tige_rd_ob_ti.png' },
    { id: 'tige_vtt_ob_ti', name: 'Tige de selle Obvious titane TS00', desc: 'Diamètre 27,2 mm, sans recul. Compatible rail rond ou oval', price: -120, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: 'assets/tige/tige_vtt_ob_ti.png' },
    { id: 'tige_vtt_ou_tel', name: 'Tige de selle One-Up Dropper V3', desc: 'Tige de selle téléscopique', price: 0, weight: 0, lockedFor: ['vtt_enduro'], compat: [{mid:'vtt_enduro',rec:true},{mid:'vtt_xc',rec:true}], incompat: [], image: 'assets/tige/tige_vtt_ou_tel.png' },
  ],
  pedales: [
    { id: 'ped_no', name: 'Sans pédales', desc: '', price: 0, weight: 0, lockedFor: ['gravel_racing','gravel_bikepacking','vtt_enduro','route'], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_enduro',rec:false},{mid:'route',rec:false}], incompat: [], image: 'assets/no_option.png' },
    { id: 'ped_rd_sh_da', name: 'Pédales Shimano Dura-Ace 9100 Carbone', desc: 'Technologie SPD-SL. Carbone et inox.', price: 190, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_rd_sh_ul', name: 'Pédales Shimano Ultegra R8000 Carbone', desc: 'Technologie SPD-SL. Carbone.', price: 120, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_rd_sh_105', name: 'Pédales Shimano 105 R7000', desc: 'Technologie SPD-SL', price: 95, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_rd_sh_r55', name: 'Pédales Shimano PD-R550', desc: 'Pédales automatiques Shimano', price: 75, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_rd_lk_kbti', name: 'Pédales Look Keo Blade Carbone Ti', desc: 'Ressort à lame carbone, axe titane et roulements céramique', price: 300, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_rd_lk_kbc', name: 'Pédales Look Keo Blade Carbone', desc: 'Ressort à lame carbone', price: 130, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_rd_lk_k2m', name: 'Pédales Look Keo 2 Max', desc: 'Pédales automatiques Look', price: 75, weight: 0, lockedFor: [], compat: [{mid:'route',rec:false}], incompat: [], image: '' },
    { id: 'ped_vtt_sh_xtrp', name: 'Pédales Shimano XTR M9220', desc: 'Pédales XTR Enduro à plateforme. Technologie SPD', price: 130, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: '' },
    { id: 'ped_vtt_sh_xtp', name: 'Pédales Shimano XT M8120', desc: 'Pédales XT Enduro à plateforme. Technologie SPD', price: 90, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_vtt_lk_xer', name: 'Pédales Look X-Track En Rage', desc: 'Compatible SPD', price: 70, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_vtt_on_com', name: 'Pédales plates One-Up Composite noir', desc: 'Pédales plates Enduro. Corps composite', price: 55, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: '' },
    { id: 'ped_vtt_on_alu', name: 'Pédales plates One-Up Aluminium noir', desc: 'Pédales plates Enduro. Corps aluminium', price: 165, weight: 0, lockedFor: [], compat: [{mid:'vtt_enduro',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_sh_1sd', name: 'Pédales Shimano PD-ES600', desc: 'Pédales SPD à 1 seul côté', price: 65, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_sh_xtr', name: 'Pédales Shimano XTR M9200', desc: 'Pédales XTR XC. Technologie SPD', price: 130, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_sh_xt', name: 'Pédales Shimano XT M8100', desc: 'Pédales XT XC. Technologie SPD', price: 90, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_sh_M54', name: 'Pédales Shimano PD-M540', desc: 'Pédales XC. Compatible SPD', price: 59, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_lk_xrct', name: 'Pédales Look X-Track Race Carbon Ti', desc: 'Compatible SPD, corps carbone, axe titane et roulements céramique', price: 210, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_lk_xrc', name: 'Pédales Look X-Track Race Carbon', desc: 'Compatible SPD, corps carbone', price: 110, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
    { id: 'ped_gr_lk_xtk', name: 'Pédales Look X-Track', desc: 'Compatible SPD', price: 50, weight: 0, lockedFor: [], compat: [{mid:'gravel_racing',rec:false},{mid:'gravel_bikepacking',rec:false},{mid:'vtt_xc',rec:false}], incompat: [], image: '' },
  ],
};


const FORCE_SELECT = [
  // Cintre plat ↔ CUES FLAT
  { if_selected: 'trans_gr_sh_cuf',      force: { pilotage: 'pilotage_gr_flat_ext' } },
  { if_selected: 'pilotage_gr_flat_ext', force: { transmission: 'trans_gr_sh_cuf' } },
  // Powermeters → transmission
  { if_selected: 'pwr_gr_sr_ri', force: { transmission: 'trans_gr_sr_ri' } },
  { if_selected: 'pwr_gr_sr_fo', force: { transmission: 'trans_gr_sr_fo' } },
  { if_selected: 'pwr_gr_sr_re', force: { transmission: 'trans_gr_sr_re' } },
  { if_selected: 'pwr_gr_ca_re', force: { transmission: 'trans_gr_ca_re' } },
  { if_selected: 'pwr_rd_sr_ri', force: { transmission: 'trans_rd_sr_ri' } },
  { if_selected: 'pwr_rd_sr_fo', force: { transmission: 'trans_rd_sr_fo' } },
  { if_selected: 'pwr_rd_sr_re', force: { transmission: 'trans_rd_sr_re' } },
  { if_selected: 'pwr_rd_sh_ul', force: { transmission: 'trans_rd_sh_ul' } },
  { if_selected: 'pwr_rd_sh_da', force: { transmission: 'trans_rd_sh_da' } },
  { if_selected: 'pwr_rd_ca_re', force: { transmission: 'trans_rd_ca_re' } },
  { if_selected: 'pwr_rd_ca_sre', force: { transmission: 'trans_rd_ca_sre' } },
  { if_selected: 'pwr_vtt_sr_x0', force: { transmission: 'trans_vtt_sr_x0' } },
  { if_selected: 'pwr_vtt_sr_xxs', force: { transmission: 'trans_vtt_sr_xxs' } },
];

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
  const name = document.getElementById('order-name').value.trim();
  const email = document.getElementById('order-email').value.trim();
  const msg = document.getElementById('order-msg').value.trim();
  const config = document.getElementById('order-config-display').value;
  if (!name) { alert('Merci de renseigner votre nom et prénom.'); return; }
  if (!email && !document.getElementById('order-phone').value.trim()) { alert('Merci de renseigner au moins votre email ou votre téléphone pour que nous puissions vous recontacter.'); return; }

  const btnSend = document.querySelector('.btn-send');
  btnSend.textContent = 'Envoi en cours...';
  btnSend.disabled = true;

  const phone = document.getElementById('order-phone').value.trim();

  try {
    const response = await fetch('https://formspree.io/f/mqeoqewy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        nom: name,
        email: email,
        telephone: phone || '—',
        configuration: config,
        dimensions: buildSizeText(),
        message: msg || '—',
        _replyto: email,
        _subject: 'Demande de devis OBVIOUS ON DEMAND — ' + name,
      })
    });

    if (response.ok) {
      closeOrderModal();
      document.getElementById('order-name').value = '';
      document.getElementById('order-email').value = '';
      document.getElementById('order-phone').value = '';
      document.getElementById('order-msg').value = '';
      alert('✅ Votre demande de devis a bien été envoyée !\n\nNous vous recontacterons par email ou téléphone sous 48h pour finaliser votre projet.');
    } else {
      alert("Une erreur s'est produite. Merci de réessayer ou de nous contacter directement à info@obviouscycles.com");
    }
  } catch(e) {
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
