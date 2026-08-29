
function exitSharedMode() {
  document.body.classList.remove('config-shared-mode');
  window.history.pushState({}, '', window.location.pathname);
  ['dtr-btn-devis','dtr-btn-save'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = ''; el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
  });
  const bloc = document.getElementById('shared-mode-bloc');
  if (bloc) bloc.remove();

  // Mobile
  ['p11-btn-devis-final','p11-btn-save-final','p11-bar-save-btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  const p11Bloc = document.getElementById('p11-shared-mode-bloc');
  if (p11Bloc) p11Bloc.remove();
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
    window._kitCadre = !!json.kitCadre;
    // Personnalisations (gravure, inserts, demande particulière) — bien enregistrées
    // dans configJson par sendOrder(), mais jamais relues ici jusqu'à présent : la
    // config s'ouvrait donc incomplète (récap ET prix final sans les personnalisations),
    // alors que ton email, lui, était généré à partir de la session live du visiteur.
    v2Parcours = json.parcours || 'standard';
    evoChecked = { ...(json.personnalisations || {}) };
    evoInsertsChecked = { ...(json.inserts || {}) };
    evoGravureText = json.texte_gravure || '';
    evoCustomText = json.demande_particuliere || '';

    // Afficher l'info dans le header principal (badge proto)
    const protoBadge = document.getElementById('proto-badge');
    if (protoBadge) {
      protoBadge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:none;color:#ffffff;font-size:13px;font-weight:700;padding:2px 0;letter-spacing:.02em;';
      protoBadge.textContent = (cfg.nom_client || '') + ' — Configuration ' + configId;
    }

    // Charger selon contexte desktop ou mobile
    if (window.innerWidth >= 768) {
      // v2GoRecap() active le bon conteneur (dt-s6devis) ET génère le récapitulatif —
      // l'ancien "dtStep = 4; dtRender()" activait l'écran Taille/Options (vide dans ce
      // contexte), pas l'écran final, laissant la page centrale visuellement vide alors
      // que le récap était bien généré, juste dans un conteneur resté caché.
      v2GoRecap();
    } else {
      renderModels(); v2Parcours = 'standard'; p11UpdateStep(6);
    }

    // ── Mode "config partagée" : adapter l'interface ──────────────────
    // Marquer le body pour le CSS
    document.body.classList.add('config-shared-mode');
    // v2GoRecap() (desktop, ci-dessus) a déjà généré le récapitulatif — plus besoin
    // de rappeler dtRenderS4() ici (l'ancien code le faisait, en double, avant même
    // que le bon écran soit activé, ce qui ne réglait de toute façon pas le problème).

    // Masquer les boutons inutiles — desktop (récap droit) et mobile (étape 4)
    setTimeout(() => {
      // Desktop
      const btnDevis = document.getElementById('dtr-btn-devis');
      const btnSave  = document.getElementById('dtr-btn-save');
      const btnReset = document.getElementById('dtr-btn-reset');
      if (btnDevis) btnDevis.style.display = 'none';
      if (btnSave)  btnSave.style.display  = 'none';

      const actions = document.querySelector('.dtr-actions');
      if (actions && btnReset && !document.getElementById('shared-mode-bloc')) {
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

      // Mobile — étape 4 (boutons finaux)
      const p11BtnDevis = document.getElementById('p11-btn-devis-final');
      const p11BtnSave  = document.getElementById('p11-btn-save-final');
      const p11BarSave  = document.getElementById('p11-bar-save-btn');
      if (p11BtnDevis) p11BtnDevis.style.display = 'none';
      if (p11BtnSave)  p11BtnSave.style.display  = 'none';
      if (p11BarSave)  p11BarSave.style.display  = 'none';

      const p11FinalBtns = document.querySelector('.p11-final-btns');
      if (p11FinalBtns && !document.getElementById('p11-shared-mode-bloc')) {
        const p11Bloc = document.createElement('div');
        p11Bloc.id = 'p11-shared-mode-bloc';
        p11Bloc.style.cssText = 'background:#1a1a1a;border:0.5px solid #333;padding:1rem;margin-bottom:.75rem;';
        p11Bloc.innerHTML =
          '<div style="font-size:11px;color:#F5C400;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">Votre demande est en cours</div>' +
          '<p style="font-size:12px;color:#aaa;line-height:1.5;margin-bottom:.75rem;">Nous vous contacterons sous 48h pour finaliser votre projet.</p>' +
          '<button onclick="openContactDrawer()" style="width:100%;background:none;border:0.5px solid #F5C400;color:#F5C400;padding:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);margin-bottom:.5rem;"><i class="ti ti-message"></i> Poser une question</button>' +
          '<button onclick="exitSharedMode()" style="width:100%;background:none;border:0.5px solid #555;color:#888;padding:9px;font-size:12px;cursor:pointer;font-family:var(--font);"><i class="ti ti-edit"></i> Modifier ma configuration</button>';
        p11FinalBtns.insertBefore(p11Bloc, p11FinalBtns.firstChild);
      }
    }, 300);

  } catch(e) {
    console.error('Erreur chargement config:', e);
  }
}



// ─── MAIL VISITEUR — via Supabase Edge Function (clé Brevo sécurisée côté serveur)
async function sendBrevoEmail({ toEmail, toName, configId, shareUrl, modeleNom, prix, configuration }) {
  const res = await fetch(SUPABASE_URL + '/functions/v1/send-config-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    },
    body: JSON.stringify({ toEmail, toName, configId, shareUrl, modeleNom, prix, configuration })
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
  // Filtre générique "requiresPost/requiresOptionNot" — remplace l'ancienne règle
  // codée en dur spécifique au cintre/potence kit cadre. Généré depuis les colonnes
  // requires_post / requires_option_not de l'onglet 4 (composants_v5.js), s'applique
  // désormais à N'IMPORTE QUELLE option, sur n'importe quel poste.
  opts = opts.filter(o => passesRequiresGate(o, selOpts));
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
  activePostMeta().forEach(p => {
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
  activePostMeta().forEach(p => {
    if (selOpts[p.id]) return;
    const opts = optionsFor(p.id, modelId);
    const toSelect = opts.find(o => isLocked(o, modelId));
    if (toSelect) selOpts[p.id] = toSelect.id;
  });
}

// Fourche/Potence/Cintre/Tige "kit" n'existent QUE pour le Kit cadre — jamais
// ajoutés à POST_META (fichier partagé avec proto14/V2/V3, qui l'itèrent pour
// TOUS les vélos). Cette liste locale à V4 remplace entièrement POST_META
// quand window._kitCadre est actif — plus besoin de filtre d'exclusion, ces
// 4 postes sont autonomes, jamais mélangés avec fourche/pilotage/tige (vélo complet).
const KIT_CADRE_POST_META = [
  { id: 'fourche_kit', name: 'Fourche',       icon: 'ti-git-fork' },
  { id: 'potence_kit', name: 'Potence',       icon: 'ti-adjustments-horizontal' },
  { id: 'cintre_kit',  name: 'Cintre',        icon: 'ti-arrows-horizontal' },
  { id: 'tige_kit',    name: 'Tige de selle', icon: 'ti-arrows-vertical' },
];
function activePostMeta() {
  return window._kitCadre ? KIT_CADRE_POST_META : POST_META;
}

// Combo (ex: Deda Alanera = potence + cintre en une seule pièce) — si une option
// actuellement sélectionnée "absorbe" le poste demandé (via comboWithPost dans
// composants.js), ce poste doit s'afficher verrouillé avec le message dédié au
// lieu d'un vrai choix.
function findComboLock(postId) {
  for (const pid in selOpts) {
    const opt = (ALL_OPTIONS[pid] || []).find(o => o.id === selOpts[pid]);
    if (opt && opt.comboWithPost === postId) return opt;
  }
  return null;
}

function computeTotals(modelId, opts) {
  const model = MODELS.find(m => m.id === modelId);
  // V5 — plus de basePrice fixe. Le prix total = poste "cadre" (caché, jamais affiché
  // en page 2, mais toujours sélectionné automatiquement dès le choix du modèle —
  // voir autoSelectCadre()) + assemblage (0€ en kit cadre) + somme des prix ABSOLUS
  // de chaque poste sélectionné. Plus aucune exemption "locked = déjà compris" —
  // chaque pièce compte pour elle-même, tout le temps, que ce soit vélo complet ou
  // kit cadre. isLocked() reste utilisée, mais uniquement pour le badge "Recommandé",
  // plus jamais pour influencer un prix.
  const cadreOpt = (ALL_OPTIONS.cadre || []).find(o => o.id === opts.cadre);
  let price = (cadreOpt ? cadreOpt.price : 0) + (window._kitCadre ? 0 : (model.assembly || 0));
  let weight = 0;
  activePostMeta().forEach(p => {
    const allOpts = ALL_OPTIONS[p.id] || [];
    const opt = allOpts.find(o => o.id === opts[p.id]);
    if (opt) { price += opt.price; weight += opt.weight; }
  });
  return { price, weight };
}

// Sélectionne automatiquement le poste "cadre" (caché, jamais affiché en page 2)
// dès qu'un modèle est choisi — une seule option de cadre existe par modèle, pas de
// choix visiteur à faire, mais son prix doit toujours entrer dans le calcul total.
function autoSelectCadre(modelId) {
  const cadreOpt = (ALL_OPTIONS.cadre || []).find(o => o.compat.some(c => c.mid === modelId));
  if (cadreOpt) selOpts.cadre = cadreOpt.id;
}

// Prix "à partir de" (page 1, vélo complet uniquement) = prix réel de la préconfig
// Ti2, calculé dynamiquement — jamais le basePrice brut. Calcul autonome, volontai-
// rement indépendant de computeTotals()/activePostMeta() : ces deux-là dépendent de
// window._kitCadre (l'état GLOBAL actuellement actif ailleurs sur la page), alors que
// "à partir de" doit toujours représenter le vélo complet, peu importe ce qui est
// sélectionné par ailleurs au moment de l'appel.
function tiMinPrice(modelId) {
  // V5 — prix réel de Ti2 : poste "cadre" + assemblage + somme absolue de chaque
  // poste (plus d'exemption "locked", chaque pièce compte pour elle-même).
  const preset = PRESETS[modelId] && PRESETS[modelId]['Ti2'];
  if (!preset) return 0;
  const { price } = computeTotalsForOpts(modelId, preset, false);
  return price;
}

// Prix "Kit cadre X€" (page 1) = prix réel de la préconfig kit cadre de référence,
// calculé dynamiquement — même logique que tiMinPrice() côté vélo complet.
function kitMinPrice(modelId) {
  const preset = KIT_CADRE_PRESETS[modelId];
  if (!preset) return 0;
  const { price } = computeTotalsForOpts(modelId, preset, true);
  return price;
}

// Calcul de prix autonome, sans dépendre de l'état global window._kitCadre —
// nécessaire car "à partir de" (vélo complet) et "Kit cadre X€" doivent toujours
// représenter LEUR mode respectif, peu importe ce qui est actuellement affiché
// ailleurs sur la page au moment de l'appel.
function computeTotalsForOpts(modelId, opts, isKit) {
  const model = MODELS.find(m => m.id === modelId);
  const cadreOpt = (ALL_OPTIONS.cadre || []).find(o => o.compat.some(c => c.mid === modelId));
  let price = (cadreOpt ? cadreOpt.price : 0) + (isKit ? 0 : (model.assembly || 0));
  const postMeta = isKit ? KIT_CADRE_POST_META : POST_META;
  postMeta.forEach(p => {
    const opt = (ALL_OPTIONS[p.id] || []).find(o => o.id === opts[p.id]);
    if (opt) price += opt.price;
  });
  return { price };
}

function buildConfigText(modelId, opts) {
  const model = MODELS.find(m => m.id === modelId);
  const { price: bikePrice, weight } = computeTotals(modelId, opts);
  // Prix total = vélo + surcoût des personnalisations (gravure, inserts...) — même
  // source de vérité que l'écran final (computeOodSurcharge), jamais un calcul à part.
  const { surcharge: oodSurcharge } = computeOodSurcharge();
  const price = bikePrice + oodSurcharge;
  // V5 — chaque ligne affiche le PRIX RÉEL de la pièce (plus de delta vs préconfig
  // de départ, qui n'a plus de sens avec des prix absolus — chaque composant a sa
  // propre valeur, plus de notion de "compris/pas compris"). Le poste "cadre" est
  // volontairement exclu (caché, jamais affiché au visiteur), son coût reste malgré
  // tout bien compris dans le prix total ci-dessus.
  let lines = ['Modèle : ' + model.name];
  activePostMeta().forEach(p => {
    const allOpts = ALL_OPTIONS[p.id] || [];
    const opt = allOpts.find(o => o.id === opts[p.id]);
    if (opt) {
      const priceLabel = ' — ' + opt.price.toLocaleString('fr-FR') + ' €';
      lines.push(p.name + ' : ' + opt.name + priceLabel);
    }
  });
  if (model.assembly) lines.push('Assemblage & mise en route : ' + model.assembly.toLocaleString('fr-FR') + ' €');
  // Personnalisations du cadre (inserts, gravure, demande particulière) — jamais
  // affichées auparavant dans cet email, alors qu'elles étaient bien comptées dans
  // le prix total. Même source de données que l'écran final (v2EvoRecapBlockHtml).
  if (typeof EVO_OPTIONS !== 'undefined') {
    const checkedEvo = EVO_OPTIONS.filter(o => evoChecked[o.id]);
    if (checkedEvo.length || (typeof evoCustomText !== 'undefined' && evoCustomText)) {
      lines.push('');
      lines.push('— Personnalisation du cadre —');
      checkedEvo.forEach(o => {
        if (o.id === 'evo_gravure') {
          lines.push(o.label + (evoGravureText ? ' : « ' + evoGravureText + ' »' : ''));
        } else if (o.id === 'evo_inserts') {
          const selectedInserts = (typeof EVO_INSERTS !== 'undefined')
            ? EVO_INSERTS.filter(i => evoInsertsChecked[i.id]).map(i => i.label)
            : [];
          lines.push(o.label + (selectedInserts.length ? ' : ' + selectedInserts.join(', ') : ''));
        } else {
          lines.push(o.label);
        }
      });
      if (typeof evoCustomText !== 'undefined' && evoCustomText) {
        lines.push('Demande particulière : ' + evoCustomText);
      }
    }
  }
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
    syncAllPostDims();
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
// ─── DIMENSIONS DE COMPOSANTS CHOISIES EN ÉTAPE 2 (plateaux/cassette/section/débattement) ──
const POST_DIM_FIELDS = { transmission: ['plateaux','cassette','manivelle'], pneus: ['section'], fourche: ['debattement'], pilotage: ['cintre','potence'], selle: ['largeur_selle'], fourche_kit: ['debattement'], potence_kit: ['potence'], cintre_kit: ['cintre'] };
const DIM_LABELS = { plateaux: 'Plateau(x)', cassette: 'Cassette', section: 'Section pneu', debattement: 'Débattement', largeur_selle: 'Largeur selle', manivelle: 'Longueur manivelle', cintre: 'Largeur cintre (ext/ext)', potence: 'Longueur potence' };
const DIM_UNITS  = { plateaux: '', cassette: '', section: 'mm', debattement: 'mm', largeur_selle: 'mm', manivelle: 'mm', cintre: 'mm', potence: 'mm' };
// Champs "morphologiques" : sans taille de cadre connue (JNSP ou sur-mesure), ils affichent "choisir" (pas de défaut forcé)
const MORPHO_DIM_KEYS = ['manivelle', 'cintre', 'potence', 'largeur_selle'];

// Calcule la valeur par défaut à proposer pour un champ donné, à partir de DEFAULTS_BY_TAILLE
// (source : configurateur_velos_v2.xlsx, onglet 5_GEOMETRIES) — TOUJOURS validée contre les
// options réellement offertes par le composant choisi avant d'être appliquée.
function computeDimDefault(key, options) {
  const isMorpho = MORPHO_DIM_KEYS.includes(key);

  if (isMorpho && (v2Parcours === 'sur_mesure' || !selSize.taille)) return null; // "choisir"

  const ref = (selModel && selSize.taille) ? DEFAULTS_BY_TAILLE[selModel]?.[selSize.taille]?.[key] : undefined;
  if (ref !== undefined && ref !== null) {
    const refStr = String(ref);
    if (options.map(String).includes(refStr)) return refStr; // correspondance exacte (ex: cassette "10x51")
    const closest = closestNumericMatch(ref, options); // valeur purement numérique -> plus proche dispo
    if (closest !== null) return closest;
  }

  // Pas de recommandation exploitable pour le composant choisi :
  // catégorie C (usage) retombe sur la première option ; morphologique retombe sur "choisir".
  return isMorpho ? null : options[0];
}

// Nettoie / auto-remplit selSize pour les clés dépendantes d'un composant donné, selon l'option choisie
function syncPostDims(postId, opt) {
  const keys = POST_DIM_FIELDS[postId];
  if (!keys) return;
  keys.forEach(key => {
    const options = (opt && opt.dims && opt.dims[key]) ? opt.dims[key].map(String) : [];
    if (options.length === 0) {
      delete selSize[key]; delete selSizeSource[key];
    } else if (options.length === 1) {
      selSize[key] = options[0]; selSizeSource[key] = 'default';
    } else if (!options.includes(selSize[key])) {
      delete selSize[key]; delete selSizeSource[key];
    }
  });
}

function renderPostDims(postId, opt) {
  const keys = POST_DIM_FIELDS[postId];
  if (!keys || !opt || !opt.dims) return '';
  let html = '';
  keys.forEach(key => {
    const options = opt.dims[key];
    if (!options || options.length < 2) return; // 1 seule valeur = auto, rien à afficher
    const fieldId = 'compdim-' + postId + '-' + key;
    const current = selSize[key] || '';
    html += '<div class="dim-field" onclick="event.stopPropagation()" style="margin:10px 14px 0;padding:10px 12px;background:var(--bg2);border:0.5px solid var(--border2);border-radius:6px;">' +
      '<label for="' + fieldId + '" style="font-size:12px;color:var(--text2);display:block;margin-bottom:5px;">' + DIM_LABELS[key] + ' <span style="color:#e05555;">*</span></label>' +
      '<select class="size-select" id="' + fieldId + '" onchange="selectPostDim(\'' + postId + '\',\'' + key + '\',this.value)">' +
        '<option value="">— choisir —</option>' +
        options.map(o => '<option value="' + o + '"' + (current === String(o) ? ' selected' : '') + '>' + o + (DIM_UNITS[key] ? ' ' + DIM_UNITS[key] : '') + '</option>').join('') +
        '<option value="__unknown__"' + (current === '__unknown__' ? ' selected' : '') + '>Je ne sais pas encore</option>' +
      '</select>' +
    '</div>';
  });
  return html;
}

function selectPostDim(postId, key, value) {
  if (value) { selSize[key] = value; selSizeSource[key] = 'user'; }
  else { delete selSize[key]; delete selSizeSource[key]; }
}

// Resynchronise les 3 postes concernés (transmission/pneus/fourche) — utile après chargement d'une préconfig
function syncAllPostDims() {
  Object.keys(POST_DIM_FIELDS).forEach(postId => {
    const optId = selOpts[postId];
    const opt = optId ? ALL_OPTIONS[postId]?.find(o => o.id === optId) : null;
    syncPostDims(postId, opt);
  });
}

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
        (selOpt ? renderPostDims(p.id, selOpt) : '') +
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

  // Synchroniser les dimensions dépendantes du composant (plateaux/cassette/section/débattement)
  if (POST_DIM_FIELDS[postId]) {
    const chosenOpt = optId ? ALL_OPTIONS[postId]?.find(o => o.id === optId) : null;
    syncPostDims(postId, chosenOpt);
  }

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
  const cadreOptRecap = (ALL_OPTIONS.cadre || []).find(o => o.id === selOpts.cadre);
  const modelBasePrice = cadreOptRecap ? cadreOptRecap.price : 0;  // V5 : plus de basePrice fixe, on utilise le prix du cadre
  let details = '<div class="recap-price-detail"><span>Cadre — ' + model.name + '</span><span>' + modelBasePrice.toLocaleString('fr-FR') + ' €</span></div>';
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
  const optionsTotal = price - modelBasePrice;
  const baseLabel = 'Base : ' + modelBasePrice.toLocaleString('fr-FR') + ' € <span style="font-size:11px;opacity:.6">(dont 300 € assemblage et mise en route)</span>';

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

function doSave(inputId, toastId) {
  syncSelSize();
  const name = document.getElementById(inputId).value.trim();
  if (!name) return;
  const model = MODELS.find(m => m.id === selModel);
  if (!model) return;
  const { price: bikePrice, weight } = computeTotals(selModel, selOpts);
  // Prix total = vélo + surcoût des personnalisations (gravure, inserts...) — même
  // source de vérité que l'écran final, jamais un calcul dupliqué à part.
  const { surcharge: oodSurcharge } = computeOodSurcharge();
  const price = bikePrice + oodSurcharge;
  const details = activePostMeta().map(p => {
    const opt = optionsFor(p.id, selModel).find(o => o.id === selOpts[p.id]);
    return { post: p.name, option: opt ? opt.name : '—', locked: opt ? !!opt.locked : false, price: opt && !opt.locked ? opt.price : 0 };
  });
  const entry = {
    id: Date.now(), name, modelName: model.name, modelBadge: model.badge,
    date: new Date().toLocaleDateString('fr-FR'), price, weight, details,
    selModel, selOpts: { ...selOpts }, selSize: { ...selSize }, kitCadre: !!window._kitCadre,
    // Personnalisations (étapes Cadre + Personnalisation) — auparavant jamais
    // sauvegardées : recharger une config perdait gravure/inserts/demande
    // particulière, même si le prix affiché les incluait déjà.
    v2Parcours: (typeof v2Parcours !== 'undefined') ? v2Parcours : 'standard',
    evoChecked: (typeof evoChecked !== 'undefined') ? { ...evoChecked } : {},
    evoInsertsChecked: (typeof evoInsertsChecked !== 'undefined') ? { ...evoInsertsChecked } : {},
    evoGravureText: (typeof evoGravureText !== 'undefined') ? evoGravureText : '',
    evoCustomText: (typeof evoCustomText !== 'undefined') ? evoCustomText : '',
  };
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
function closeSizeAlert() {
  document.getElementById('size-alert-modal').classList.remove('open');
}

// ─── PROJET TITANIUM — circuit d'envoi dédié (pas de modèle/prix associé) ──────
function openTitaniumModal() {
  document.getElementById('titanium-modal').classList.add('open');
}
function closeTitaniumModal() {
  document.getElementById('titanium-modal').classList.remove('open');
}

async function sendTitaniumProject() {
  const name    = document.getElementById('titanium-name').value.trim();
  const email   = document.getElementById('titanium-email').value.trim();
  const phone   = document.getElementById('titanium-phone').value.trim();
  const address = document.getElementById('titanium-address').value.trim();
  const message = document.getElementById('v2-horsgamme-message')?.value.trim() || '';
  const fileInput = document.getElementById('v2-horsgamme-file');
  const errorEl = document.getElementById('titanium-send-error');
  errorEl.style.display = 'none';

  if (!name)    { errorEl.textContent = 'Merci de renseigner votre nom et prénom.'; errorEl.style.display = 'block'; return; }
  if (!email)   { errorEl.textContent = 'Merci de renseigner votre adresse email.'; errorEl.style.display = 'block'; return; }
  if (!address) { errorEl.textContent = 'Merci de renseigner votre adresse postale.'; errorEl.style.display = 'block'; return; }

  const btn = document.getElementById('titanium-send-btn');
  const btnLabel = btn.innerHTML;
  btn.innerHTML = 'Envoi en cours...';
  btn.disabled = true;

  try {
    const configId = generateConfigId();

    // Envoi via Formspree en multipart/form-data pour joindre réellement le fichier
    const formData = new FormData();
    formData.append('type_demande', 'Projet Titanium (hors catalogue)');
    formData.append('nom', name);
    formData.append('email', email);
    formData.append('telephone', phone || '—');
    formData.append('adresse_postale', address);
    formData.append('description_projet', message || '—');
    formData.append('reference', configId);
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('document_joint', fileInput.files[0]);
    }

    const response = await fetch('https://formspree.io/f/mqeoqewy', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData,
    });
    if (!response.ok) throw new Error('Erreur envoi Formspree: ' + response.status);

    // Sauvegarde légère dans Supabase — non bloquante si elle échoue
    try {
      await saveConfigToSupabase({
        config_id: configId,
        modele: null,
        preset: null,
        prix: null,
        config_json: {
          type: 'titanium',
          description: message,
          nom_client: name,
          email_client: email,
          adresse_postale: address,
          telephone: phone,
        },
        nom_client: name,
        email_client: email,
        statut: 'projet_titanium',
      });
    } catch (e) { /* non bloquant */ }

    closeTitaniumModal();
    const mainContent = document.getElementById('titanium-main-content');
    const confirm = document.getElementById('titanium-confirm');
    if (mainContent) mainContent.style.display = 'none';
    if (confirm) confirm.style.display = 'block';
  } catch (e) {
    errorEl.textContent = "Une erreur est survenue lors de l'envoi. Réessayez ou contactez-nous directement à info@obviouscycles.com.";
    errorEl.style.display = 'block';
  } finally {
    btn.innerHTML = btnLabel;
    btn.disabled = false;
  }
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
    const { price: bikePrice } = computeTotals(selModel, selOpts);
    // Prix total = vélo + surcoût des personnalisations (gravure, inserts...) —
    // sauvegardé, envoyé au visiteur ET à nous, jamais recalculé séparément.
    const { surcharge: oodSurcharge } = computeOodSurcharge();
    const price = bikePrice + oodSurcharge;
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
      kitCadre: !!window._kitCadre,
      // Personnalisations (gravure, inserts, demande particulière) — auparavant
      // absentes de l'enregistrement Supabase, alors que le prix les incluait déjà.
      parcours: (typeof v2Parcours !== 'undefined') ? v2Parcours : 'standard',
      personnalisations: (typeof evoChecked !== 'undefined') ? { ...evoChecked } : {},
      inserts: (typeof evoInsertsChecked !== 'undefined') ? { ...evoInsertsChecked } : {},
      texte_gravure: (typeof evoGravureText !== 'undefined') ? evoGravureText : '',
      demande_particuliere: (typeof evoCustomText !== 'undefined') ? evoCustomText : '',
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
      // Ajouter automatiquement cette config à "Mes configurations" du visiteur, avec
      // un repère visuel (devisSent) indiquant qu'une demande a bien été envoyée pour
      // celle-ci — même structure complète que doSave() (personnalisations incluses).
      {
        const model = MODELS.find(m => m.id === selModel);
        const details = activePostMeta().map(p => {
          const opt = optionsFor(p.id, selModel).find(o => o.id === selOpts[p.id]);
          return { post: p.name, option: opt ? opt.name : '—', locked: opt ? !!opt.locked : false, price: opt && !opt.locked ? opt.price : 0 };
        });
        const devisEntry = {
          id: Date.now(), name: name, modelName: model ? model.name : '', modelBadge: model ? model.badge : '',
          date: new Date().toLocaleDateString('fr-FR'), price, weight: computeTotals(selModel, selOpts).weight,
          details, selModel, selOpts: { ...selOpts }, selSize: { ...selSize }, kitCadre: !!window._kitCadre,
          v2Parcours: (typeof v2Parcours !== 'undefined') ? v2Parcours : 'standard',
          evoChecked: (typeof evoChecked !== 'undefined') ? { ...evoChecked } : {},
          evoInsertsChecked: (typeof evoInsertsChecked !== 'undefined') ? { ...evoInsertsChecked } : {},
          evoGravureText: (typeof evoGravureText !== 'undefined') ? evoGravureText : '',
          evoCustomText: (typeof evoCustomText !== 'undefined') ? evoCustomText : '',
          devisSent: true, devisConfigId: configId,
        };
        savedConfigs.unshift(devisEntry);
        persistSaved();
        updateSavedCount();
      }
      ['order-name','order-email','order-phone','order-address','order-msg'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      // Afficher l'ID et l'URL au visiteur
      // Envoyer mail visiteur via Brevo
      if (email) {
        try {
          const model = MODELS.find(m => m.id === selModel);
          const { price: bikePriceMail } = computeTotals(selModel, selOpts);
          const { surcharge: oodSurchargeMail } = computeOodSurcharge();
          const price = bikePriceMail + oodSurchargeMail;
          await sendBrevoEmail({
            toEmail: email,
            toName: name,
            configId,
            shareUrl,
            modeleNom: model ? model.name : selModel,
            prix: price,
            // Détail complet (composants + personnalisations gravure/inserts) — transmis
            // au cas où le modèle d'email côté serveur (fonction Supabase) puisse
            // l'exploiter. Je ne peux pas vérifier depuis ici si le modèle d'email
            // affiche réellement ce champ.
            configuration: config,
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
  syncAllPostDims();
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

// Bandeau Titanium en page 1 — nécessite un modèle sélectionné (comme le bouton Composants)
// Bandeau Titanium flottant — apparaît quand le bandeau original sort de l'écran (étape 1 seulement).
// Utilise IntersectionObserver (fonctionne qu'il y ait du scroll ou non) et rattache l'élément
// directement à <body> pour garantir un vrai position:fixed sans dépendance à un conteneur parent.
// ─── BANDEAU TITANIUM COLLANT MOBILE — plus simple que le desktop (pas de morph,
// pas de survol) : apparaît/disparaît en glissant, déclenché par le scroll uniquement. ──
function v3InitTitaniumStickyMobile() {
  const sticky = document.getElementById('p11-titanium-sticky');
  const inline = document.getElementById('p11-titanium-banner-inline');
  if (!sticky || !inline || sticky._titaniumBound) return;
  sticky._titaniumBound = true;

  // Détache du HTML statique (imbriqué dans #p11-container) et rattache à <body> :
  // élimine tout risque qu'un ancêtre ne casse le calcul de position:fixed par rapport
  // à la fenêtre — même correctif que celui appliqué côté desktop.
  document.body.appendChild(sticky);

  let hasScrolled = false;

  function currentlyVisible() {
    const r = inline.getBoundingClientRect();
    return r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }

  function render() {
    // Ce bandeau est réservé au mobile — sur desktop, c'est #titanium-morph qui gère
    // l'équivalent. Sans ce garde-fou, ce bandeau s'affichait aussi sur desktop car
    // p11CurrentStep vaut 1 par défaut, y compris quand le visiteur est sur desktop.
    if (window.innerWidth >= 768) {
      sticky.style.transform = 'translateY(100%)';
      sticky.style.pointerEvents = 'none';
      return;
    }
    if (typeof p11CurrentStep !== 'undefined' && p11CurrentStep !== 1) {
      sticky.style.transform = 'translateY(100%)';
      sticky.style.pointerEvents = 'none';
      return;
    }
    const visible = currentlyVisible();
    // Si un modèle est déjà choisi, le bandeau bas standard (p11-bottom-bar, "Configurer vos
    // composants") occupe déjà cette zone -> ne pas superposer le bandeau Titanium dessus.
    const bottomBarShowing = !!selModel;
    const shouldShow = hasScrolled && !visible && !bottomBarShowing;
    sticky.style.transform = shouldShow ? 'translateY(0)' : 'translateY(100%)';
    sticky.style.pointerEvents = shouldShow ? 'auto' : 'none';
  }

  function onScroll() {
    hasScrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 40;
    render();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', render);

  // Robuste face à tout changement de step, quelle que soit la fonction qui le déclenche
  const p11S1 = document.getElementById('p11-s1');
  if (p11S1) {
    const stepObserver = new MutationObserver(() => render());
    stepObserver.observe(p11S1, { attributes: true, attributeFilter: ['class', 'style'] });
  }

  render();
}

function v3InitTitaniumSticky() {
  // Réservé au desktop — le bandeau/carré mobile est géré séparément par
  // v3InitTitaniumStickyMobile(). Sans ce garde-fou, sa logique de visibilité (basée sur
  // dtStep, jamais mis à jour pendant une navigation mobile) l'affiche par erreur partout.
  if (window.innerWidth < 768) return;
  const morph = document.getElementById('titanium-morph');
  const text  = document.getElementById('titanium-morph-text');
  const inline = document.getElementById('titanium-banner-inline');
  if (!morph || !inline || morph._titaniumBound) return;
  morph._titaniumBound = true;

  // Détache du HTML statique et rattache à <body> : élimine tout risque qu'un ancêtre
  // (transform, overflow...) ne casse le calcul de position:fixed par rapport à la fenêtre.
  document.body.appendChild(morph);

  let inlineVisible = true;
  // hasScrolled n'est JAMAIS activé à l'initialisation — uniquement par un vrai événement
  // 'scroll' mesurant plus de 40px, jamais par le rendu initial ou l'IntersectionObserver.
  let hasScrolled = false;
  let isHovered = false;

  function scrollDistance() {
    const dtMain = document.getElementById('dt-main');
    return Math.max(window.scrollY || 0, dtMain ? dtMain.scrollTop : 0);
  }

  // Position (icône du bandeau original) et largeur cible du bandeau original, pour le déploiement
  function inlineIconRect() {
    const iconEl = inline.querySelector('i');
    return (iconEl ? iconEl.parentElement : inline).getBoundingClientRect();
  }

  // Un seul élément change de forme : carré replié <-> bandeau complet déplié.
  // Ni les deux affichés en même temps, ni jamais visible quand le bandeau original l'est déjà.
  function render() {
    // Mode embed (iframe Wordpress) : la version flottante ("carré" qui suit le
    // défilement) repose sur position:fixed, qui s'ancre à la hauteur TOTALE de la
    // page une fois que l'iframe grandit pour englober tout le contenu (voir plus
    // bas dans ce fichier) — pas à ce que le visiteur voit réellement à l'écran. Le
    // carré finit invisible en usage normal (il faudrait scroller jusqu'au vrai bas
    // de la page pour l'atteindre). Le bandeau original, lui, est en flux normal et
    // n'a aucun souci — on le laisse simplement toujours visible, sans jamais
    // basculer vers la version flottante, qui n'a de sens que hors iframe.
    if (window.location.search.indexOf('embed=1') !== -1) {
      morph.style.opacity = '0'; morph.style.pointerEvents = 'none';
      if (text) text.style.opacity = '0';
      return;
    }
    // Hauteur RÉELLE du bandeau original — utilisée telle quelle pour les deux états
    // (carré replié ET bandeau déplié), garantissant une hauteur toujours identique.
    const bannerR = inline.getBoundingClientRect();
    const realHeight = Math.round(bannerR.height) || 78;

    if (dtStep !== 1) {
      morph.style.width = realHeight + 'px'; morph.style.height = realHeight + 'px'; morph.style.borderRadius = '12px';
      morph.style.opacity = '0'; morph.style.pointerEvents = 'none';
      if (text) text.style.opacity = '0';
      return;
    }
    // Mesure directe et immédiate (pas la valeur mise en cache par l'IntersectionObserver,
    // qui peut être asynchrone/en retard juste après un changement d'étape) : le bandeau
    // original est considéré visible s'il chevauche la fenêtre actuellement.
    const currentlyVisible = bannerR.height > 0 && bannerR.bottom > 0 && bannerR.top < window.innerHeight;
    inlineVisible = currentlyVisible; // garde la variable synchronisée pour l'observer aussi

    // Le survol de la souris force aussi l'ouverture, en plus du scroll
    const expanded = (hasScrolled || isHovered) && !currentlyVisible;
    const showAtAll = !currentlyVisible; // masqué dès que le bandeau original redevient visible

    morph.style.opacity = showAtAll ? '1' : '0';
    morph.style.pointerEvents = showAtAll ? 'auto' : 'none';
    morph.style.height = realHeight + 'px'; // identique dans les deux états, jamais "auto"
    // Bord gauche identique dans les deux états (aligné sur le bandeau original, comme les vélos)
    // — jamais besoin d'animer "left", donc aucun risque de décalage visuel pendant la transition.
    morph.style.left = bannerR.left + 'px';

    if (expanded) {
      morph.style.width = bannerR.width + 'px';
      morph.style.borderRadius = '10px';
      if (text) text.style.opacity = '1';
    } else {
      morph.style.width = realHeight + 'px'; // carré parfait : largeur = hauteur
      morph.style.borderRadius = '12px';
      if (text) text.style.opacity = '0';
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { inlineVisible = entry.isIntersecting; });
    render();
  }, { threshold: 0 });
  observer.observe(inline);

  // Seul point d'entrée qui peut activer hasScrolled — jamais au chargement de la page
  function onScroll() {
    hasScrolled = scrollDistance() > 40;
    render();
  }

  window.addEventListener('scroll', onScroll);
  window.addEventListener('resize', render);
  const dtMain = document.getElementById('dt-main');
  if (dtMain) dtMain.addEventListener('scroll', onScroll);

  // Survol de la souris : ouvre le carré en bandeau, même sans avoir scrollé
  morph.addEventListener('mouseenter', () => { isHovered = true; render(); });
  morph.addEventListener('mouseleave', () => { isHovered = false; render(); });

  // Observe directement les changements de classe sur #dt-s1 (ajout/retrait de "active") —
  // couvre TOUS les chemins de navigation qui montrent/masquent l'étape 1, quelle que soit
  // la fonction JS qui déclenche le changement (dtGo, retour Titanium, sélection modèle...),
  // sans avoir besoin de patcher chaque fonction individuellement.
  const dtS1 = document.getElementById('dt-s1');
  if (dtS1) {
    const stepObserver = new MutationObserver(() => render());
    stepObserver.observe(dtS1, { attributes: true, attributeFilter: ['class'] });
  }

  render(); // état initial : carré replié, aligné à gauche sur le bandeau original
}

function v3GoTitaniumFromS1() {
  v2Parcours = 'hors_gamme';
  // Titanium n'a pas de distinction vélo complet / kit cadre — le visiteur décrit
  // son projet librement dans le message, qu'il s'agisse d'un vélo ou d'un cadre seul.
  window._kitCadre = false;
  // Réinitialiser l'affichage (au cas où un envoi précédent aurait laissé la confirmation visible)
  const mainContent = document.getElementById('titanium-main-content');
  const confirm = document.getElementById('titanium-confirm');
  if (mainContent) mainContent.style.display = '';
  if (confirm) confirm.style.display = 'none';

  if (window.innerWidth < 768) {
    p11UpdateStep(4);
    return;
  }
  dtStep = 4;
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s4horsgamme')?.classList.add('active');
  v2UpdateStepper();
  dtRenderRecap();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

function dtGo(n) {
  if (window.innerWidth < 768) return;
  if (n > 1 && !selModel) return;
  dtStep = n;
  document.body.classList.toggle('dt-step-4', n === 5 && v2Parcours === 'standard');
  dtRender();
  v2UpdateStepper();
  const morph = document.getElementById('titanium-morph');
  if (morph && n !== 1) {
    morph.style.opacity = '0';
    morph.style.pointerEvents = 'none';
  } else if (n === 1) {
    // Redéclenche le calcul d'affichage du carré/bandeau Titanium au retour sur l'étape 1
    window.dispatchEvent(new Event('resize'));
  }
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
    if (v2Parcours === 'standard') { dtRenderS3(); }
    else { evoRender(); }
  }
  if (n === 5) {
    if (v2Parcours === 'standard') { document.body.classList.add('dt-step-4'); dtRenderS4(); }
  }

  // Récap droit (pas à l'étape devis, qui a son propre affichage détaillé)
  if (n !== 6) dtRenderRecap();

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
    // window._kitCadre est maintenant à 3 états : null (focus sans choix), true (kit
    // cadre), false (vélo complet) — distinct de "juste focus" pour savoir si un des
    // 2 boutons doit apparaître actif.
    const isKitSel = sel && window._kitCadre === true;
    const isCompletSel = sel && window._kitCadre === false;
    const isFocusedOnly = sel && (window._kitCadre === null || window._kitCadre === undefined);
    const completPrice = tiMinPrice(m.id);
    const kitPrice = kitMinPrice(m.id);
    return '<div class="model-card' + (sel ? ' sel' : '') + (isFocusedOnly ? ' highlighted' : '') + '" onclick="dtHighlightCard(event, this, \'' + m.id + '\')">' +
      '<img class="mc-photo" src="' + (m.photo||'') + '" alt="' + m.name + '" loading="lazy">' +
      '<div class="mc-body">' +
        '<span class="mc-badge">' + m.badge + '</span>' +
        '<span class="mc-name">' + m.name + '</span>' +
        '<span class="mc-desc">' + (m.desc||'') + '</span>' +
        '<div class="mc-mode-buttons">' +
          '<button class="mc-mode-btn' + (isCompletSel ? ' active' : '') + '" onclick="dtSelectModelMode(\'' + m.id + '\', false)">' +
            '<span class="mc-mode-btn-label">Vélo complet</span>' +
            '<span class="mc-mode-btn-price">' + completPrice.toLocaleString('fr-FR') + ' €</span>' +
          '</button>' +
          '<button class="mc-mode-btn' + (isKitSel ? ' active' : '') + '" onclick="dtSelectModelMode(\'' + m.id + '\', true)">' +
            '<span class="mc-mode-btn-label">Kit cadre</span>' +
            (kitPrice !== null ? '<span class="mc-mode-btn-price">' + kitPrice.toLocaleString('fr-FR') + ' €</span>' : '') +
          '</button>' +
        '</div>' +
      '</div>' +
      (hasPresets && isCompletSel ? dtPresetBar(m.id) : '') +
    '</div>';
  }).join('');
}

// Choix "Vélo complet" / "Kit cadre seul" — se fait une seule fois en étape 1
// (carte modèle ou bandeau Titanium) et se propage à tout le reste du parcours
// (Cadre, Sur-mesure, Titanium, Personnalisation) via window._kitCadre.
// Clic sur la vignette (hors boutons) : met ce modèle "au focus" (mise en évidence),
// SANS choisir de mode. Un seul modèle peut être au focus à la fois — cliquer sur
// une vignette différente de celle déjà au focus fait perdre à l'ancienne son focus
// ET son bouton actif s'il y en avait un. Cliquer sur la vignette déjà au focus ne
// change rien (qu'un bouton soit actif ou non).
function dtHighlightCard(e, cardEl, modelId) {
  if (e.target.closest('.mc-mode-btn')) return; // laisser les boutons gérer leur propre clic
  if (selModel === modelId) return; // déjà au focus (bouton actif ou non) -> rien ne change

  selModel = modelId;
  window._kitCadre = null; // focus sans choix de mode
  dtRenderS1(); // reconstruction complète : l'ancien modèle perd focus + bouton actif
}

function dtSelectModelMode(id, isKit) {
  window._kitCadre = isKit;
  dtSelectModel(id);
}

function dtPresetBar(modelId) {
  const infoPopupId = 'dt-preset-info-' + modelId;
  return '<div class="preset-bar" onclick="event.stopPropagation()">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<div class="preset-label" style="margin-bottom:0;color:#F5C400;">3 suggestions pour démarrer</div>' +
      '<button onclick="toggleDtPresetInfo(\'' + infoPopupId + '\')" style="background:none;border:none;color:#F5C400;font-size:22px;cursor:pointer;padding:0;line-height:1;" title="En savoir plus"><i class="ti ti-info-circle"></i></button>' +
    '</div>' +
    '<div id="' + infoPopupId + '" style="display:none;font-size:12px;color:#aaa;background:#111;border:0.5px solid #333;padding:10px 12px;margin-bottom:10px;line-height:1.7;">' +
      Object.entries(PRESET_DESCS_DT).map(([k,v]) =>
        '<div><span style="color:#F5C400;font-weight:600;">' + k + '</span> — ' + v + '</div>'
      ).join('') +
      '<div style="font-size:11px;color:#999;margin-top:4px;">Tout reste modifiable.</div>' +
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
  // Poste "cadre" (caché, jamais affiché en page 2) — sélectionné automatiquement dès
  // le choix du modèle, indispensable au calcul de prix (V5 : plus de basePrice fixe).
  autoSelectCadre(id);
  // Vélo complet -> preset Ti2 par défaut (= le prix "à partir de" affiché en page 1).
  // Kit cadre -> préconfig kit cadre dédiée (fourche/pilotage/tige uniquement — vide
  // pour le VTT, le visiteur choisit lui-même).
  if (window._kitCadre) {
    window._activePreset = null;
    const kitPreset = KIT_CADRE_PRESETS[id];
    if (kitPreset && Object.keys(kitPreset).length) { selOpts = {...kitPreset}; syncAllPostDims(); }
  } else {
    const preset = PRESETS[id] && PRESETS[id]['Ti2'];
    if (preset) { window._activePreset = 'Ti2'; selOpts = {...preset}; syncAllPostDims(); }
  }
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
  window._activePreset = decl; selOpts = {...preset}; syncAllPostDims();
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
    inner.innerHTML = '<div style="padding:2rem 0;"><p class="section-title" style="color:#f2f2f2;margin-bottom:1rem;">Mes configurations</p><p style="color:#666;font-size:14px;">Aucune configuration sauvegardée.<br><span style="font-size:12px;color:#999;">Utilisez le bouton \"Sauvegarder\" pour en enregistrer une.</span></p></div>';
  } else {
    inner.innerHTML = '<p class="section-title" style="color:#f2f2f2;margin-bottom:1.5rem;">Mes configurations (' + configs.length + ')</p>' +
      configs.map((c, idx) => {
        // Assigner un id si manquant (anciennes configs)
        if (!c.id) { c.id = 'cfg_' + idx + '_' + Date.now(); savedConfigs[idx] = c; persistSaved(); }
        const model = MODELS.find(m => m.id === (c.selModel || c.model));
        const photo = (c.kitCadre && model && KIT_CADRE_PHOTOS[model.id]) ? KIT_CADRE_PHOTOS[model.id] : (model ? model.photo : '');
        const cid = String(c.id).replace(/'/g, "\\'");
        // Grigri : indique qu'une demande de devis a bien été envoyée pour cette config.
        const devisBadge = c.devisSent
          ? '<span title="Devis envoyé le ' + (c.date || '') + '" style="display:inline-flex;align-items:center;gap:4px;background:#3D3000;color:#F5C400;font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;margin-left:8px;white-space:nowrap;"><i class="ti ti-send" style="font-size:11px;"></i>Devis envoyé</span>'
          : '';
        return '<div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid ' + (c.devisSent ? '#F5C400' : '#333') + ';margin-bottom:8px;">' +
          (photo ? '<img src="' + photo + '" style="width:60px;height:40px;object-fit:cover;flex-shrink:0;border:0.5px solid #222;">' : '') +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:500;color:#f2f2f2;margin-bottom:2px;display:flex;align-items:center;">' + c.name + devisBadge + '</div>' +
            '<div style="font-size:11px;color:#666;">' + (model ? model.name : '') + (c.preset ? ' · ' + c.preset : '') + (c.date ? ' · ' + c.date : '') + '</div>' +
          '</div>' +
          '<button onclick="dtLoadSaved(\'' + cid + '\')" style="background:#F5C400;border:none;color:#1a1a00;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);">Charger</button>' +
          '<button onclick="dtDeleteSaved(\'' + cid + '\')" style="background:none;border:0.5px solid #444;color:#666;padding:7px 10px;font-size:12px;cursor:pointer;margin-left:4px;font-family:var(--font);">✕</button>' +
        '</div>';
      }).join('');
  }
  // Activer dt-s6devis (le vrai conteneur qui contient dt-s6devis-inner, rempli
  // juste au-dessus) — "dt-s4" n'existe pas dans le HTML, cet appel ne faisait
  // donc jamais rien, laissant l'écran précédent affiché (fenêtre vide en pratique).
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  const s4el = document.getElementById('dt-s6devis');
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
  window._kitCadre = !!cfg.kitCadre; // configs sauvegardées avant ce correctif -> false (vélo complet), comportement historique
  window._activePreset = cfg.preset || null;
  window._singleModel = selModel;
  window.sizeValidated = !!(cfg.selSize && Object.keys(cfg.selSize || {}).length > 0);
  // Personnalisations (étapes Cadre + Personnalisation) — repli sur un état vide pour
  // les anciennes configs sauvegardées avant ce correctif (n'avaient pas ces champs).
  v2Parcours = cfg.v2Parcours || 'standard';
  evoChecked = { ...(cfg.evoChecked || {}) };
  evoInsertsChecked = { ...(cfg.evoInsertsChecked || {}) };
  evoGravureText = cfg.evoGravureText || '';
  evoCustomText = cfg.evoCustomText || '';
  // Retirer dt-step-4 AVANT dtRender pour que dt-main soit visible
  document.body.classList.remove('dt-step-4');
  // Activer les boutons du récap
  ['dtr-btn-devis','dtr-btn-save','dtr-btn-reset'].forEach(id2 => {
    const el = document.getElementById(id2);
    if (el) { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
  });
  // Aller directement à l'écran final récapitulatif — pas à l'étape Composants.
  v2GoRecap();
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
    const photo = (window._kitCadre && KIT_CADRE_PHOTOS[model.id]) ? KIT_CADRE_PHOTOS[model.id] : model.photo;
    left.innerHTML =
      '<img class="mc-photo" src="' + (photo||'') + '" alt="' + model.name + '" loading="lazy">' +
      '<div class="mc-text">' +
        '<span class="mc-badge">' + model.badge + '</span>' +
        '<span class="mc-name">' + model.name + '</span>' +
        '<span class="mc-desc">' + (model.desc||'') + '</span>' +
        '<span class="mc-price">à partir de ' + ((window._kitCadre ? kitMinPrice(model.id) : tiMinPrice(model.id)).toLocaleString('fr-FR')) + ' €</span>' +
        '<div class="mc-switch-mode">Vous configurez : <strong>' + (window._kitCadre ? 'Kit cadre' : 'Vélo complet') + '</strong> — <a onclick="dtSwitchMode()">passer en ' + (window._kitCadre ? 'vélo complet' : 'kit cadre') + '</a></div>' +
      '</div>' +
      (window._kitCadre ? '' : dtPresetBar(model.id));
  }
  // Right : composants — réutiliser renderPosts vers dt-posts-list
  dtRenderPosts();
}

// Bascule Vélo complet <-> Kit cadre SANS repartir de l'étape 1 (filet de rattrapage —
// le clic large sur la carte modèle ne mène plus qu'au vélo complet par défaut, ce lien
// permet de corriger le tir directement depuis l'étape Composants).
function dtSwitchMode() {
  dtSelectModelMode(selModel, !window._kitCadre);
}

// Équivalent mobile
function p11SwitchMode() {
  p11SelectModelMode(selModel, !window._kitCadre);
  p11UpdateStep(2); // reste sur Composants (p11SelectModel seul ne raffraîchit pas cette page)
}

// Rendu des postes dans dt-posts-list — délégation d'événements pour éviter l'escaping
// Rendu d'un sous-champ de dimension DANS l'accordéon composants (pneus/transmission/fourche)
// Trouve, parmi une liste d'options, la valeur numérique la plus proche d'une cible donnée
function closestNumericMatch(target, options) {
  const nums = options.map(Number).filter(n => !isNaN(n));
  if (nums.length === 0 || target === undefined || target === null) return null;
  let best = nums[0], bestDiff = Math.abs(nums[0] - target);
  nums.forEach(n => { const d = Math.abs(n - target); if (d < bestDiff) { best = n; bestDiff = d; } });
  return String(best);
}

// defaultValue : valeur à pré-sélectionner si rien n'est encore choisi.
//   - une valeur concrète (ex: options[0], ou calculée depuis DEFAULTS_BY_TAILLE) -> auto-sélectionnée, badge "défaut"
//   - null/undefined -> aucun défaut, le menu affiche "— choisir —" et "Je ne sais pas encore" reste disponible
function renderComponentDimField(key, label, options, refreshFn, defaultValue) {
  if (!options || options.length === 0) return '';
  if (options.length === 1) {
    if (!selSize[key]) { selSize[key] = String(options[0]); selSizeSource[key] = 'default'; }
    return `<div class="comp-dim-field" onclick="event.stopPropagation()" style="margin-top:.6rem;padding-top:.6rem;border-top:0.5px solid #222;">
      <label style="font-size:13px;color:#ccc;display:block;margin-bottom:5px;">${label}</label>
      <select class="size-select" style="width:100%;" onclick="event.stopPropagation()" onchange="event.stopPropagation();selSize['${key}']=this.value;selSizeSource['${key}']='user';${refreshFn}();">
        <option value="${options[0]}" selected>${options[0]}</option>
      </select>
    </div>`;
  }
  if (!selSize[key] && defaultValue !== null && defaultValue !== undefined && options.map(String).includes(String(defaultValue))) {
    selSize[key] = String(defaultValue);
    selSizeSource[key] = 'default';
  }
  const hasDefault = defaultValue !== null && defaultValue !== undefined;
  const optHTML = options.map(o => `<option value="${o}" ${selSize[key]==String(o)?'selected':''}>${o}</option>`).join('');
  const placeholder = hasDefault ? '' : `<option value="" ${!selSize[key] ? 'selected' : ''}>— choisir —</option>`;
  return `<div class="comp-dim-field" onclick="event.stopPropagation()" style="margin-top:.6rem;padding-top:.6rem;border-top:0.5px solid #222;">
    <label style="font-size:13px;color:#ccc;display:block;margin-bottom:5px;">${label}</label>
    <select class="size-select" style="width:100%;" onclick="event.stopPropagation()" onchange="event.stopPropagation();selSize['${key}']=this.value=='__unknown__'?null:this.value;selSizeSource['${key}']='user';${refreshFn}();">
      ${placeholder}
      ${optHTML}
      <option value="__unknown__" ${selSize[key]===null?'selected':''}>Je ne sais pas encore</option>
    </select>
  </div>`;
}

// ─── DESTINATION DEPUIS L'ÉTAPE 2 SELON LE CHOIX CADRE ─────────────────────────
function dtUpdateStep2Footer() {
  const zone = document.getElementById('dt-s2-footer-actions');
  if (!zone) return;
  if (v2Parcours === 'sur_mesure') {
    zone.innerHTML = '<button class="dt-btn-next" onclick="v3GoSurMesureFromS2()">Continuer <i class="ti ti-arrow-right"></i></button>';
  } else if (!selSize.taille) {
    zone.innerHTML = '<button class="dt-btn-next" onclick="v3EnterGuideOnly()">Déterminer ma taille <i class="ti ti-arrow-right"></i></button>';
  } else {
    zone.innerHTML =
      '<button onclick="v3EnterGuideOnly()" style="background:none;border:none;color:#888;font-size:12px;cursor:pointer;text-decoration:underline;padding:0;">Besoin d\'aide pour ajuster les tailles ?</button>' +
      '<button class="dt-btn-next" id="dt-s2-btn-main" onclick="v3GoPersoFromS2()">Personnalisation <i class="ti ti-arrow-right"></i></button>';
  }
}

function v3GoSurMesureFromS2() {
  dtStep = 4;
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s4mesure')?.classList.add('active');
  evoActiveContainer = 'v2-mesure-evo-options'; evoRender();
  v2UpdateStepper(); dtRenderRecap();
  const main = document.getElementById('dt-main'); if (main) main.scrollTop = 0;
}

// ─── CARTE "CADRE" — nouvelle en tête de l'étape Composants ──────────────────
function renderCadreCard(selectId) {
  selectId = selectId || 'cadre-taille-select';
  if (!selModel || !TAILLES_CADRE[selModel]) return '';
  const tailles = TAILLES_CADRE[selModel].map(t => t.taille);
  const current = v2Parcours === 'sur_mesure' ? '__sur_mesure__' : (selSize.taille || '');
  const summary = v2Parcours === 'sur_mesure' ? 'Sur-mesure (+300 €)'
    : selSize.taille ? 'Taille ' + selSize.taille
    : 'À déterminer';
  return '<div class="post-block" data-post-id="cadre">' +
    '<div class="post-hdr" style="cursor:default;">' +
      '<i class="ti ti-frame ph-icon"></i>' +
      '<span class="ph-name">Cadre</span>' +
      '<span class="ph-sel">' + summary + '</span>' +
    '</div>' +
    '<div class="post-opts open">' +
      '<div class="dim-field" style="max-width:320px;">' +
        '<label for="' + selectId + '" style="font-size:12px;color:var(--text2);display:block;margin-bottom:6px;">Taille du cadre</label>' +
        '<select class="size-select" id="' + selectId + '" onchange="selectCadreTaille(this.value)">' +
          '<option value="">Je ne sais pas encore</option>' +
          tailles.map(t => '<option value="' + t + '"' + (current === t ? ' selected' : '') + '>' + t + '</option>').join('') +
          '<option value="__sur_mesure__"' + (current === '__sur_mesure__' ? ' selected' : '') + '>Sur-mesure (+300 €)</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function selectCadreTaille(value) {
  if (value === '__sur_mesure__') {
    v2Parcours = 'sur_mesure';
    delete selSize.taille; delete selSizeSource.taille;
  } else if (value) {
    v2Parcours = 'standard';
    selSize.taille = value; selSizeSource.taille = 'user';
  } else {
    v2Parcours = 'standard';
    delete selSize.taille; delete selSizeSource.taille;
  }
  // La taille de cadre change : les dimensions morphologiques auto-remplies (source 'default')
  // ne sont plus forcément pertinentes -> on les efface pour qu'elles se recalculent au rendu suivant.
  // On préserve en revanche les choix explicites du visiteur (source 'user').
  MORPHO_DIM_KEYS.forEach(key => {
    if (selSizeSource[key] === 'default') { delete selSize[key]; delete selSizeSource[key]; }
  });
  if (typeof dtRenderPosts === 'function') dtRenderPosts();
  if (typeof dtRenderRecap === 'function') dtRenderRecap();
  if (typeof dtUpdateStep2Footer === 'function') dtUpdateStep2Footer();
  if (typeof p11RenderPosts === 'function') p11RenderPosts();
  if (typeof p11UpdateStep2Footer === 'function') p11UpdateStep2Footer();
}

function dtRenderPosts() {
  const container = document.getElementById('dt-posts-list');
  if (!container || !selModel) return;
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',potence:'ti-adjustments-horizontal',cintre:'ti-arrows-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise',fourche_kit:'ti-git-fork',potence_kit:'ti-adjustments-horizontal',cintre_kit:'ti-arrows-horizontal',tige_kit:'ti-arrows-vertical'};

  container.innerHTML = renderCadreCard() + activePostMeta().map(p => {
    // Poste absorbé par un combo (ex: Cintre inclus avec la potence Alanera)
    const comboLock = findComboLock(p.id);
    if (comboLock) {
      return '<div class="post-block post-block-combo-locked" data-post-id="' + p.id + '">' +
        '<div class="post-hdr" style="cursor:default;">' +
          '<i class="ti ' + (icons[p.id]||'ti-point') + ' ph-icon"></i>' +
          '<span class="ph-name">' + p.name + '</span>' +
          '<span class="ph-sel" style="color:#888;font-style:italic;">' + comboLock.comboWithLabel + '</span>' +
        '</div>' +
      '</div>';
    }

    const opts = optionsFor(p.id, selModel);
    if (!opts.length) return '';
    // Masquer "mesure de puissance" si une seule option (= non disponible)
    if (p.id === 'power' && opts.length <= 1) return '';
    const selOpt = opts.find(o => o.id === selOpts[p.id]);
    const isOpen = openPost === p.id;
    // En kit cadre, aucun composant n'est "déjà compris" dans le prix de base — le statut
    // locked (recommandé par défaut) ne doit donc jamais annuler son prix dans le calcul
    // du delta affiché sur les autres options, contrairement au vélo complet.
    const curPrice = selOpt ? selOpt.price : 0;  // V5 — prix absolu, plus d'exemption "locked"
    const hasPhotos = opts.some(o => o.image && o.image.length > 0 && o.image !== 'assets/no_option.png');

    function buildOpt(o) {
      const sel2 = selOpts[p.id] === o.id;
      const isDef = isPresetDefault(p.id, o.id);
      const rec2 = isRecommended(o, selModel);
      const d = o.price - curPrice;
      const diff = sel2 ? '±0 €' : d===0 ? '±0 €' : (d>0?'+':'')+d.toLocaleString('fr-FR')+' €';
      // Grille de couleurs — un simple aperçu visuel (bascule la photo affichée), sans
      // jamais changer l'option réellement sélectionnée ni son prix (les variantes de
      // couleur d'un même produit partagent toujours le même id, le même prix).
      const imgId = 'opc-img-' + p.id + '-' + o.id;
      const colorSwatchesHtml = (o.couleurs && o.couleurs.length) ?
        '<div class="opc-colors" onclick="event.stopPropagation()">' +
          o.couleurs.map((c, ci) =>
            '<button type="button" class="opc-color-dot' + (ci===0?' active':'') + '" ' +
            'style="background:' + c.hex + ';" title="' + c.nom + '" ' +
            "onclick=\"dtPreviewColor('" + imgId + "', '" + c.photo.replace(/'/g, "\\'") + "', this)\"></button>"
          ).join('') +
        '</div>' : '';
      if (hasPhotos) {
        const defaultImg = (o.couleurs && o.couleurs.length) ? o.couleurs[0].photo : o.image;
        const imgHtml = (defaultImg && defaultImg !== 'assets/no_option.png')
          ? '<img id="' + imgId + '" src="' + defaultImg + '" alt="" loading="lazy" style="width:100%;height:80px;object-fit:cover;display:block;">'
          : '<div class="opc-img-placeholder"><i class="ti ti-photo"></i></div>';
        return '<div class="opt-photo-card' + (sel2?' sel':'') + '" data-pid="' + p.id + '" data-oid="' + o.id + '">' +
          '<div class="opc-check"><i class="ti ti-check"></i></div>' +
          '<div class="opc-img-wrap">' + imgHtml + '</div>' +
          '<div class="opc-body">' +
          (rec2?'<div class="opc-badges"><span class="opc-badge-rec"><i class="ti ti-star" style="font-size:8px;"></i> Recommandé</span></div>':'') +
          '<div class="opc-name">' + o.name + '</div>' +
          (o.desc?'<div class="opc-desc">'+o.desc+'</div>':'') +
          colorSwatchesHtml +
          '<div class="opc-price' + (d<0?' negative':'') + '">' + diff + '</div>' +
          '</div></div>';
      } else {
        return '<div class="opt-item' + (sel2?' sel':'') + '" data-pid="' + p.id + '" data-oid="' + o.id + '">' +
          '<div class="opt-radio"><div class="radio-dot"></div></div>' +
          '<div class="oi-info"><div class="oi-name">' + o.name + '</div>' + (o.desc?'<div class="oi-desc">'+o.desc+'</div>':'') + colorSwatchesHtml + '</div>' +
          '<div class="oi-meta"><div class="oi-price' + (d<0?' negative':'') + '">' + diff + '</div></div>' +
          '</div>';
      }
    }

    const optHtml = (hasPhotos ? '<div class="opt-photo-grid">' : '<div class="opt-list">') +
      opts.map(buildOpt).join('') + '</div>';

    // Dimensions dépendantes du composant choisi (plateaux/cassette/section/débattement)
    let dimsHtml = '';
    if (selOpt && selOpt.dims && POST_DIM_FIELDS[p.id]) {
      POST_DIM_FIELDS[p.id].forEach(key => {
        const dimOptions = selOpt.dims[key];
        if (dimOptions && dimOptions.length >= 1) {
          dimsHtml += renderComponentDimField(key, DIM_LABELS[key], dimOptions, 'dtRenderPosts', computeDimDefault(key, dimOptions));
        }
      });
    }

    const _isModDt = !!(window._activePreset && PRESETS[selModel] && PRESETS[selModel][window._activePreset] && PRESETS[selModel][window._activePreset][p.id] !== selOpts[p.id]);
    return '<div class="post-block" data-post-id="' + p.id + '">' +
      '<div class="post-hdr" data-toggle="' + p.id + '">' +
        '<i class="ti ' + (icons[p.id]||'ti-point') + ' ph-icon"></i>' +
        '<span class="ph-name">' + p.name + (_isModDt ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F5C400;margin-left:6px;vertical-align:middle;"></span>' : '') + '</span>' +
        (selOpt?'<span class="ph-sel">'+selOpt.name+'</span>':'<span class="ph-pending">choisir →</span>') +
        '<i class="ti ti-chevron-down ph-chev' + (isOpen?' open':'') + '"></i>' +
      '</div>' +
      '<div class="post-opts' + (isOpen?' open':'') + '">' + optHtml + dimsHtml + '</div>' +
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
  dtUpdateStep2Footer();
}

// Bascule la photo affichée sur une carte d'option vers la variante de couleur
// cliquée — un simple aperçu visuel, ne change jamais l'option réellement
// sélectionnée (même id, même prix quelle que soit la couleur).
function dtPreviewColor(imgId, photoUrl, btnEl) {
  const img = document.getElementById(imgId);
  if (img) img.src = photoUrl;
  if (btnEl && btnEl.parentElement) {
    btnEl.parentElement.querySelectorAll('.opc-color-dot').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

function dtSelectOpt(postId, optId) {
  const opt = optionsFor(postId, selModel).find(o => o.id === optId);
  if (!opt) return;
  // Ne pas bloquer les options locked — elles sont sélectionnables
  selOpts[postId] = optId;
  // Combo (ex: Alanera) : le poste absorbé n'a plus de sélection propre — il
  // s'affichera verrouillé au prochain rendu, pas de valeur fantôme à conserver.
  if (opt.comboWithPost) delete selOpts[opt.comboWithPost];
  // Synchroniser les dimensions dépendantes (plateaux/cassette/section/débattement)
  if (POST_DIM_FIELDS[postId]) syncPostDims(postId, opt);
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

  evoActiveContainer = 'v2-evo-options';
  evoRender();

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

  dtHookCalcFunctions();
}

// Enveloppe calcSize/chooseUsage/validateDims une seule fois pour déclencher dtCheckSizeResult()
// après chaque calcul — indispensable notamment pour afficher "Choisir ces résultats" / "Sortir"
function dtHookCalcFunctions() {
  if (window._dtCalcHooked) return;
  window._dtCalcHooked = true;
  const _calcSize = window.calcSize;
  window.calcSize = function() { if (_calcSize) _calcSize(); setTimeout(dtCheckSizeResult, 400); };
  const _chooseUsage = window.chooseUsage;
  window.chooseUsage = function(u) { if (_chooseUsage) _chooseUsage(u); setTimeout(dtCheckSizeResult, 200); };
  const _validateDims = window.validateDims;
  window.validateDims = function() { if (_validateDims) _validateDims(); window.sizeValidated=true; setTimeout(dtCheckSizeResult, 100); };
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

  if (validated) v2SetTailleLabel(true);

  // Signal fiable pour la page guidée seule : une VRAIE taille a-t-elle été déterminée ?
  // (le texte affiché par le calculateur peut être non-vide même sans résultat exploitable)
  if (dtGuideOnlyActive) {
    if (selSize.taille) dtShowGuideResultButtons();
    else dtShowGuideDefaultFooter();
  }
  if (typeof p11GuideOnlyActive !== 'undefined' && p11GuideOnlyActive) {
    if (selSize.taille) p11ShowGuideResultButtons();
    else p11ShowGuideDefaultFooter();
  }
}

function dtShowGuideDefaultFooter() {
  const footer = document.getElementById('dt-s3-footer');
  if (!footer) return;
  footer.innerHTML = '<button class="btn-cancel" onclick="v3SortirSansReport()">Retour</button>';
}

// ─── "LAISSEZ-VOUS GUIDER" EN POPUP — la page Composants reste visible/préservée en dessous.
// Revenir en arrière (Retour/Sortir) ne fait jamais perdre ce qui a déjà été rempli en page 2. ──
let dtGuideOnlyActive = false;
let dtPreGuideSnapshot = null;

function dtRenderS3GuideOnly() {
  const guideZone = document.getElementById('dt-s3-panel-guide');
  const panelGuide = document.getElementById('panel-guide');
  if (guideZone && panelGuide && !guideZone._init) {
    guideZone.appendChild(panelGuide);
    panelGuide.classList.add('open');
    guideZone._init = true;
  }
  if (guideZone) guideZone.style.display = 'block';
  if (typeof buildDimsGrid === 'function') buildDimsGrid();
  dtHookCalcFunctions();
}

// ─── "LAISSEZ-VOUS GUIDER" EN BOTTOM SHEET MOBILE — même principe que la popup
// desktop : la page Composants reste visible/préservée en dessous. ────────────
let p11GuideOnlyActive = false;
let p11GuideSnapshot = null;

function p11RenderGuideSheet() {
  const zone = document.getElementById('p11-guide-sheet-content');
  const panelGuide = document.getElementById('panel-guide');
  if (zone && panelGuide && !zone._init) {
    zone.appendChild(panelGuide);
    panelGuide.classList.add('open');
    zone._init = true;
  }
  if (typeof buildDimsGrid === 'function') buildDimsGrid();
  dtHookCalcFunctions();
}

function p11OpenGuideSheet() {
  p11GuideOnlyActive = true;
  p11GuideSnapshot = { selSize: {...selSize}, selSizeSource: {...selSizeSource}, v2Parcours };
  p11RenderGuideSheet();
  if (selSize.taille) { window.sizeValidated = true; p11ShowGuideResultButtons(); }
  else { window.sizeValidated = false; p11ShowGuideDefaultFooter(); }
  const overlay = document.getElementById('p11-guide-sheet-overlay');
  const sheet = document.getElementById('p11-guide-sheet');
  if (overlay) overlay.style.display = 'block';
  requestAnimationFrame(() => { if (sheet) sheet.style.transform = 'translateY(0)'; });
}

function p11CloseGuideSheetVisual() {
  const overlay = document.getElementById('p11-guide-sheet-overlay');
  const sheet = document.getElementById('p11-guide-sheet');
  if (sheet) sheet.style.transform = 'translateY(100%)';
  setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 300);
}

function p11ShowGuideResultButtons() {
  const footer = document.getElementById('p11-guide-sheet-footer');
  if (!footer) return;
  footer.innerHTML =
    '<button onclick="p11SortirGuideSheet()" style="flex:1;background:none;border:0.5px solid #333;color:#888;padding:12px;font-size:13px;cursor:pointer;font-family:inherit;border-radius:8px;">Sortir</button>' +
    '<button onclick="p11ChoisirResultatsSheet()" style="flex:2;background:#F5C400;border:none;color:#1a1a00;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border-radius:8px;">Choisir ces résultats →</button>';
}

function p11ShowGuideDefaultFooter() {
  const footer = document.getElementById('p11-guide-sheet-footer');
  if (!footer) return;
  footer.innerHTML = '<button onclick="p11SortirGuideSheet()" style="flex:1;background:none;border:0.5px solid #333;color:#888;padding:12px;font-size:13px;cursor:pointer;font-family:inherit;border-radius:8px;">← Retour</button>';
}

// Les résultats sont déjà écrits en direct dans selSize par le calculateur — on referme
// le sheet et on rafraîchit la page Composants (restée active en dessous) pour les refléter.
function p11ChoisirResultatsSheet() {
  p11GuideOnlyActive = false;
  p11GuideSnapshot = null;
  p11CloseGuideSheetVisual();
  p11UpdateStep(2); // re-rend tout, y compris le libellé du bouton ("Personnalisation" désormais)
}

// Annule tout changement effectué depuis l'ouverture du sheet, puis le referme.
function p11SortirGuideSheet() {
  if (p11GuideSnapshot) {
    selSize = p11GuideSnapshot.selSize;
    selSizeSource = p11GuideSnapshot.selSizeSource;
    v2Parcours = p11GuideSnapshot.v2Parcours;
  }
  p11GuideOnlyActive = false;
  p11GuideSnapshot = null;
  p11CloseGuideSheetVisual();
  p11UpdateStep(2); // re-rend tout, y compris le libellé du bouton
}

function v3EnterGuideOnly() {
  dtGuideOnlyActive = true;
  dtPreGuideSnapshot = { selSize: {...selSize}, selSizeSource: {...selSizeSource}, v2Parcours };
  dtRenderS3GuideOnly();
  // Si une taille est déjà connue (résultat d'un calcul précédent), le refléter immédiatement
  if (selSize.taille) {
    window.sizeValidated = true;
    dtShowGuideResultButtons();
  } else {
    window.sizeValidated = false;
    dtShowGuideDefaultFooter();
  }
  document.getElementById('taille-guide-modal')?.classList.add('open');
}

function dtShowGuideResultButtons() {
  const footer = document.getElementById('dt-s3-footer');
  if (!footer) return;
  footer.innerHTML =
    '<button class="btn-cancel" onclick="v3SortirSansReport()">Sortir</button>' +
    '<button class="btn-send" onclick="v3ChoisirResultats()">Choisir ces résultats <i class="ti ti-arrow-right"></i></button>';
}

// Les résultats sont déjà écrits en direct dans selSize par le calculateur — on ferme la
// popup et on rafraîchit la page Composants (restée active en dessous) pour les refléter.
function v3ChoisirResultats() {
  dtGuideOnlyActive = false;
  dtPreGuideSnapshot = null;
  document.getElementById('taille-guide-modal')?.classList.remove('open');
  dtRenderPosts();
  dtRenderRecap();
}

// Annule tout changement effectué depuis l'ouverture de la popup, puis la referme —
// la page Composants n'a jamais quitté l'écran, rien n'y est perdu.
function v3SortirSansReport() {
  if (dtPreGuideSnapshot) {
    selSize = dtPreGuideSnapshot.selSize;
    selSizeSource = dtPreGuideSnapshot.selSizeSource;
    v2Parcours = dtPreGuideSnapshot.v2Parcours;
  }
  dtGuideOnlyActive = false;
  dtPreGuideSnapshot = null;
  document.getElementById('taille-guide-modal')?.classList.remove('open');
  dtRenderPosts();
  dtRenderRecap();
}

// ─── PAGE "PERSONNALISATION" SEULE (dt-s5perso) — cadre standard déjà connu ──────
function v3GoPersoFromS2() {
  dtStep = 5;
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s5perso')?.classList.add('active');
  evoActiveContainer = 'v2-evo-options';
  evoRender();
  v2UpdateStepper(); dtRenderRecap();
  const main = document.getElementById('dt-main'); if (main) main.scrollTop = 0;
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
  const { price: bikePrice } = computeTotals(selModel, selOpts);
  const photoS4 = (window._kitCadre && KIT_CADRE_PHOTOS[selModel]) ? KIT_CADRE_PHOTOS[selModel] : model.photo;

  // Réutilise computeOodSurcharge() (déjà correcte, utilisée par le récap latéral) au lieu
  // de dupliquer cette logique — la version précédente ne testait que 'standard_evo', une
  // valeur de v2Parcours jamais utilisée en pratique, ce qui ignorait silencieusement les
  // options Évolution sur CET écran (vélo complet et kit cadre étaient tous deux affectés).
  const { surcharge: oodSurcharge, isMin: priceIsMin } = computeOodSurcharge();
  const price = bikePrice + oodSurcharge;
  const preset = (window._activePreset && PRESETS[selModel]) ? PRESETS[selModel][window._activePreset] : {};
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',potence:'ti-adjustments-horizontal',cintre:'ti-arrows-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise',fourche_kit:'ti-git-fork',potence_kit:'ti-adjustments-horizontal',cintre_kit:'ti-arrows-horizontal',tige_kit:'ti-arrows-vertical'};
  const mc = dtModifCount();

  inner.innerHTML =
    '<div style="display:grid;grid-template-columns:'+(document.body.classList.contains('config-shared-mode')?'340px':'280px')+' 1fr;gap:2rem;align-items:start;">' +
      // Colonne gauche : photo + infos
      '<div>' +
        (photoS4 ? '<img src="'+photoS4+'" style="width:100%;height:'+(document.body.classList.contains('config-shared-mode')?'280px':'180px')+';object-fit:cover;display:block;border:0.5px solid #222;margin-bottom:1rem;">' : '') +
        '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">'+model.badge+'</div>' +
        '<div style="font-size:20px;font-weight:500;color:#f2f2f2;margin-bottom:4px;">'+model.name+'</div>' +
        (window._activePreset ? '<div style="font-size:11px;color:#666;margin-bottom:.75rem;">'+window._activePreset+'</div>' : '<div style="min-height:1.4em;"></div>') +
        '<div style="font-size:28px;font-weight:700;color:#F5C400;margin-bottom:.25rem;">'+(priceIsMin?'À partir de ':'')+price.toLocaleString('fr-FR')+' €</div>' +
        (oodSurcharge > 0 ? '<div style="font-size:11px;color:#666;margin-bottom:.5rem;">Vélo '+bikePrice.toLocaleString('fr-FR')+' € + '+(v2Parcours==='sur_mesure'?'Niveau Performance':v2Parcours==='hors_gamme'?'Niveau Titanium':'Options Évolution')+' '+(priceIsMin?'à partir de ':'')+oodSurcharge.toLocaleString('fr-FR')+' €</div>' : '') +
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
        activePostMeta().map(p => {
          const comboLock = findComboLock(p.id);
          if (comboLock) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:0.5px solid #1e1e1e;">' +
              '<div style="font-size:13px;color:#666;display:flex;align-items:center;gap:8px;"><i class="ti '+(icons[p.id]||'ti-point')+'" style="font-size:11px;color:#F5C400;"></i>' + p.name + '</div>' +
              '<div style="font-size:13px;font-style:italic;color:#777;">' + comboLock.comboWithLabel + '</div>' +
            '</div>';
          }
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
      ((!Object.keys(selSize).some(k => selSize[k])) ?
        '<div style="font-size:13px;color:#555;font-style:italic;">Non renseignées — nous vous contacterons pour affiner et valider vos cotes.</div>' :
        (() => {
          const parts = [];
          if (selSize.taille)        parts.push('<span><strong>Taille :</strong> ' + selSize.taille + '</span>');
          if (selSize.manivelle)     parts.push('<span><strong>Manivelle :</strong> ' + selSize.manivelle + ' mm</span>');
          if (selSize.potence)       parts.push('<span><strong>Potence :</strong> ' + selSize.potence + ' mm</span>');
          if (selSize.cintre)        parts.push('<span><strong>Cintre :</strong> ' + selSize.cintre + ' mm</span>');
          if (selSize.plateaux)      parts.push('<span><strong>Plateau(x) :</strong> ' + selSize.plateaux + '</span>');
          if (selSize.cassette)      parts.push('<span><strong>Cassette :</strong> ' + selSize.cassette + '</span>');
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
function v2EvoRecapBlockHtml(title, showTotal) {
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
    '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">' + title + '</div>' +
    lines +
    customBlock +
    (showTotal && total !== null ? '<div style="font-size:13px;color:#F5C400;font-weight:500;margin-top:8px;padding-top:8px;border-top:0.5px solid #333;">Total options : ' + total + ' €</div>' : '') +
  '</div>';
}

function v2RecapBlock() {
  if (typeof v2Parcours === 'undefined') return '';

  if (v2Parcours === 'standard') {
    // La condition "standard_evo" n'est en pratique jamais vraie (parcours réellement
    // emprunté par les visiteurs = toujours "standard", même quand ils ont ajouté des
    // inserts/gravure en étape Cadre) — se fier à ça masquait ces personnalisations
    // sur l'écran final pour la quasi-totalité des visiteurs. On se base désormais sur
    // la présence réelle de données (case cochée ou texte de gravure saisi).
    const hasEvo = (typeof evoChecked !== 'undefined' && Object.values(evoChecked).some(v => v)) || (typeof evoCustomText !== 'undefined' && evoCustomText);
    return hasEvo ? v2EvoRecapBlockHtml('Personnalisation du cadre', true) : '';
  }

  if (v2Parcours === 'standard_evo') {
    return v2EvoRecapBlockHtml('Options Évolution', true);
  }

  if (v2Parcours === 'sur_mesure') {
    const msg = window._v2Message || '';
    const fileInput = document.getElementById('v2-mesure-file');
    const fileName = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Cadre sur mesure — Niveau Performance</div>' +
      (msg ? '<div style="font-size:13px;color:#f2f2f2;line-height:1.6;white-space:pre-wrap;">' + msg.replace(/</g,'&lt;') + '</div>' : '<div style="font-size:13px;color:#555;font-style:italic;">Aucune description fournie.</div>') +
      (fileName ? '<div style="font-size:12px;color:#F5C400;margin-top:8px;"><i class="ti ti-paperclip"></i> ' + fileName.replace(/</g,'&lt;') + '</div>' : '') +
    '</div>' + v2EvoRecapBlockHtml('Options Évolution incluses', false);
  }

  if (v2Parcours === 'hors_gamme') {
    const msg = window._v2Message || '';
    const fileInputH = document.getElementById('v2-horsgamme-file');
    const fileNameH = (fileInputH && fileInputH.files && fileInputH.files[0]) ? fileInputH.files[0].name : '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Projet spécifique — Niveau Titanium</div>' +
      (msg ? '<div style="font-size:13px;color:#f2f2f2;line-height:1.6;white-space:pre-wrap;">' + msg.replace(/</g,'&lt;') + '</div>' : '<div style="font-size:13px;color:#555;font-style:italic;">Aucune description fournie.</div>') +
      (fileNameH ? '<div style="font-size:12px;color:#F5C400;margin-top:8px;"><i class="ti ti-paperclip"></i> ' + fileNameH.replace(/</g,'&lt;') + '</div>' : '') +
    '</div>';
  }

  return '';
}

// ── Récap droit ──
// Calcule le surcoût lié au niveau Obvious On Demand choisi (partagé desktop/mobile)
function computeOodSurcharge() {
  let surcharge = 0, isMin = false;
  if (v2Parcours === 'sur_mesure') surcharge = 300;
  else if (v2Parcours === 'hors_gamme') { surcharge = 720; isMin = true; }
  else surcharge = evoTotalPrice() || 0; // standard : les options Évolution (page Taille) s'ajoutent si cochées
  return { surcharge, isMin };
}

function dtRenderRecap() {
  if (window.innerWidth < 768) return;
  const model = MODELS.find(m => m.id === selModel);
  const get = id => document.getElementById(id);
  if (!model) {
    [get('dtr-thumb'),get('dtr-model'),get('dtr-price'),get('dtr-sep')].forEach(el => { if(el) el.style.display='none'; });
    const mod = get('dtr-modif'); if (mod) mod.classList.remove('show');
    return;
  }
  if (get('dtr-thumb')) {
    const photoRecap = (window._kitCadre && KIT_CADRE_PHOTOS[model.id]) ? KIT_CADRE_PHOTOS[model.id] : model.photo;
    get('dtr-thumb').src = photoRecap||''; get('dtr-thumb').style.display = photoRecap?'block':'none';
  }
  if (get('dtr-model')) { get('dtr-model').textContent = model.name; get('dtr-model').style.display = 'block'; }
  if (get('dtr-preset')) get('dtr-preset').textContent = window._activePreset || '';
  const {price: bikePriceR} = computeTotals(selModel, selOpts);
  const { surcharge: oodR, isMin: oodRMin } = computeOodSurcharge();
  const priceR = bikePriceR + oodR;
  if (get('dtr-price')) { get('dtr-price').textContent = (oodRMin?'Dès ':'') + priceR.toLocaleString('fr-FR')+' €'; get('dtr-price').style.display = 'block'; }
  if (get('dtr-sep')) get('dtr-sep').style.display = 'block';

  const mc = dtModifCount();
  const modifEl = get('dtr-modif');
  if (modifEl) {
    if (mc > 0) { get('dtr-modif-txt').textContent = mc+' personnalisation'+(mc>1?'s':'')+' · '+window._activePreset; modifEl.classList.add('show'); }
    else modifEl.classList.remove('show');
  }

  const preset = (window._activePreset && PRESETS[selModel]) ? PRESETS[selModel][window._activePreset] : {};
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',potence:'ti-adjustments-horizontal',cintre:'ti-arrows-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise',fourche_kit:'ti-git-fork',potence_kit:'ti-adjustments-horizontal',cintre_kit:'ti-arrows-horizontal',tige_kit:'ti-arrows-vertical'};
  const rows = get('dtr-rows');
  if (!rows) return;
  const cadreSurMesure = v2Parcours === 'sur_mesure';
  const cadreVal = cadreSurMesure ? 'Sur-mesure (+300 €)' : (selSize.taille ? 'Taille ' + selSize.taille : 'À déterminer');
  const cadreRowHtml = '<div class="dtr-row"' + (cadreSurMesure ? ' style="color:#F5C400;"' : '') + '>' +
    '<span class="dtr-lbl"' + (cadreSurMesure ? ' style="color:#F5C400;"' : '') + '><i class="ti ti-frame" style="font-size:8px;margin-right:3px;"></i>Cadre</span>' +
    '<span class="dtr-val"' + (cadreSurMesure ? ' style="color:#F5C400;font-weight:600;"' : '') + '>' + cadreVal + '</span>' +
  '</div>';
  rows.innerHTML = cadreRowHtml + activePostMeta().map(p => {
    const comboLock = findComboLock(p.id);
    if (comboLock) {
      return '<div class="dtr-row">' +
        '<span class="dtr-lbl"><i class="ti '+(icons[p.id]||'ti-point')+'" style="font-size:8px;margin-right:3px;"></i>'+p.name+'</span>' +
        '<span class="dtr-val" style="color:#888;font-style:italic;">'+comboLock.comboWithLabel+'</span>' +
      '</div>';
    }
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
  selOpts = {}; selSize = {}; selSizeSource = {}; window.sizeValidated = false; openPost = null;
  window._activePreset = null;
  selModel = keptModel; // on garde le modèle
  window._singleModel = keptModel; // bouton "choisir un autre vélo" visible
  // Recharger Ti2 par défaut (vélo complet) — inclut déjà le poste "cadre" (présent
  // dans PRESETS). En kit cadre, recharger la préconfig kit cadre dédiée, qui inclut
  // aussi son propre "cadre" — sinon le poste caché resterait vide après un reset.
  if (!window._kitCadre && selModel && PRESETS[selModel] && PRESETS[selModel]['Ti2']) {
    window._activePreset = 'Ti2'; selOpts = {...PRESETS[selModel]['Ti2']};
  } else if (window._kitCadre && selModel && KIT_CADRE_PRESETS[selModel]) {
    selOpts = {...KIT_CADRE_PRESETS[selModel]};
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
let evoActiveContainer = 'v2-evo-options';

const EVO_ICONS = {
  evo_inserts: 'ti-bottle', evo_iscg: 'ti-settings', evo_integ: 'ti-cable',
  evo_gravure: 'ti-typography',
  ins_pb1: 'ti-bottle', ins_pb2: 'ti-bottle', ins_pb3: 'ti-bottle',
  ins_sacoche: 'ti-briefcase', ins_pbag4: 'ti-package', ins_pbag2: 'ti-package',
  ins_gardeboue: 'ti-umbrella'
};

// Popup photo gravure (desktop) — fermeture par X ou clic à côté (voir onclick
// sur l'overlay lui-même, qui vérifie que le clic vient bien du fond, pas de l'image).
function openGravurePhotoModal() {
  document.getElementById('gravure-photo-modal')?.classList.add('open');
}
function closeGravurePhotoModal() {
  document.getElementById('gravure-photo-modal')?.classList.remove('open');
}

function evoRender() {
  const container = document.getElementById(evoActiveContainer);
  if (!container) return;
  const showPrices = evoActiveContainer !== 'v2-mesure-evo-options';
  const opts = EVO_OPTIONS.filter(o => o.modeles.includes(selModel));
  const firstId = evoOrder[0];

  container.innerHTML = opts.map(opt => {
    const checked = evoChecked[opt.id] || false;
    const priceLabel = evoOptionPrice(opt.id) + ' €';
    const isGravure = opt.id === 'evo_gravure';
    const isInserts = opt.id === 'evo_inserts';
    const gravureText = evoGravureText || '';
    const gravureError = gravureText.length > 20;

    const iconName = EVO_ICONS[opt.id] || 'ti-adjustments';
    return `<div style="background:#111;border:0.5px solid ${checked ? '#F5C400' : '#222'};padding:.9rem 1rem;border-radius:8px;transition:border-color .15s;">
      <div style="display:flex;align-items:flex-start;gap:.65rem;${isInserts ? '' : 'cursor:pointer;'}" ${isInserts ? '' : `onclick="evoToggle('${opt.id}')"`}>
        <i class="ti ${iconName}" style="font-size:16px;color:${checked ? '#F5C400' : '#666'};flex-shrink:0;margin-top:1px;"></i>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;">
            <span style="font-size:13px;font-weight:500;color:#f2f2f2;">${opt.label}</span>
            ${(isInserts || isGravure || !showPrices) ? '' : `<span style="font-size:12px;font-weight:500;color:${checked ? '#F5C400' : firstId ? '#aaa' : '#666'};white-space:nowrap;">${priceLabel}</span>`}
          </div>
          ${opt.note && !isInserts ? `<div style="font-size:12px;color:#999;line-height:1.5;margin-top:4px;">${opt.note}</div>` : ''}
        </div>
        ${isGravure ? `<img src="/configurateur/assets/evolution/votre_nom_mob.webp" alt="Exemple de gravure sur tube supérieur" onclick="event.stopPropagation();openGravurePhotoModal()" style="height:112px;width:auto;aspect-ratio:3/1;object-fit:cover;border-radius:4px;flex-shrink:0;border:0.5px solid #333;cursor:pointer;">` : ''}
        ${isInserts ? '' : `<div style="width:16px;height:16px;border-radius:4px;border:0.5px solid ${checked ? '#F5C400' : '#444'};background:${checked ? '#F5C400' : 'transparent'};flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;">
          ${checked ? '<i class="ti ti-check" style="font-size:10px;color:#1a1a00;"></i>' : ''}
        </div>`}
      </div>
      ${(isGravure && showPrices) ? `<div style="margin-top:.75rem;padding-top:.75rem;border-top:0.5px solid #222;display:flex;justify-content:flex-end;">
        <span style="font-size:12px;font-weight:500;color:${checked ? '#F5C400' : '#666'};">${priceLabel}</span>
      </div>` : ''}
      ${isInserts ? evoRenderInsertsSubList(checked, priceLabel, showPrices) : ''}
      ${isGravure && checked ? `
      <div style="margin-top:.75rem;" onclick="event.stopPropagation()">
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
function evoRenderInsertsSubList(evoInsertsChecked_unused, priceLabel, showPrices) {
  const items = EVO_INSERTS.filter(i => i.avail[selModel] !== 'x');
  if (items.length === 0) return '';

  const anyInsertChecked = items.some(i => i.avail[selModel] === 0 && evoInsertsChecked[i.id]);

  return `<div style="margin-top:.75rem;padding-top:.75rem;border-top:0.5px solid #222;display:flex;flex-direction:column;gap:6px;">` +
    items.map(item => {
      const isIncluded = item.avail[selModel] === 1;
      const isChecked = evoInsertsChecked[item.id] || false;
      const iName = EVO_ICONS[item.id] || 'ti-plug';
      if (isIncluded) {
        return `<div style="display:flex;align-items:center;gap:8px;opacity:.7;">
          <i class="ti ${iName}" style="font-size:13px;color:#666;flex-shrink:0;"></i>
          <span style="font-size:12px;color:#888;">${item.label}${item.note ? ' — ' + item.note : ''}</span>
          <span style="font-size:11px;color:#999;margin-left:auto;">sur cadre standard</span>
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="event.stopPropagation();evoToggleInsert('${item.id}')">
        <i class="ti ${iName}" style="font-size:13px;color:${isChecked ? '#F5C400' : '#666'};flex-shrink:0;"></i>
        <span style="font-size:12px;color:#f2f2f2;flex:1;">${item.label}${item.note ? ' — ' + item.note : ''}</span>
        <div style="width:14px;height:14px;border-radius:4px;border:0.5px solid ${isChecked ? '#F5C400' : '#444'};background:${isChecked ? '#F5C400' : 'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          ${isChecked ? '<i class="ti ti-check" style="font-size:9px;color:#1a1a00;"></i>' : ''}
        </div>
      </div>`;
    }).join('') +
    (showPrices ? `<div style="display:flex;justify-content:flex-end;margin-top:4px;padding-top:6px;border-top:0.5px solid #1a1a1a;">
      <span style="font-size:12px;font-weight:500;color:${anyInsertChecked ? '#F5C400' : '#666'};">${priceLabel}</span>
    </div>` : '') +
  '</div>';
}

// Champ texte libre pour demande spécifique
function evoRenderCustomText() {
  return `<div style="margin-top:.5rem;padding:1rem;background:#0d0d0d;border:0.5px dashed #333;">
    <div style="font-size:12px;color:#888;margin-bottom:6px;">Une demande particulière non listée ci-dessus ?</div>
    <textarea id="evo-custom-text" rows="2" placeholder="Décrivez votre besoin..." oninput="evoCustomText=this.value" style="width:100%;box-sizing:border-box;background:#111;border:0.5px solid #333;color:#f2f2f2;padding:8px 10px;font-size:13px;font-family:var(--font);resize:vertical;line-height:1.5;">${evoCustomText}</textarea>
    <div style="font-size:11px;color:#999;margin-top:6px;">Cette demande sera soumise à validation de faisabilité par notre équipe.</div>
  </div>`;
}

// Paires d'inserts mutuellement exclusifs (impossible physiquement d'avoir les deux
// à la fois — ex: porte-bagages 4 points et 2 points occupent le même emplacement)
const EVO_INSERT_EXCLUSIVE_PAIRS = [['ins_pbag4', 'ins_pbag2']];

function applyInsertExclusivity(id) {
  if (!evoInsertsChecked[id]) return; // seulement si on vient de COCHER (pas décocher)
  EVO_INSERT_EXCLUSIVE_PAIRS.forEach(pair => {
    if (pair.includes(id)) {
      const other = pair.find(x => x !== id);
      if (evoInsertsChecked[other]) evoInsertsChecked[other] = false;
    }
  });
}

function evoToggleInsert(id) {
  evoInsertsChecked[id] = !evoInsertsChecked[id];
  applyInsertExclusivity(id);
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
  dtRenderRecap();
}

// ─── DROPZONE FICHIER (drag & drop) ────────────────────────────────────────────
function v2DropzoneDragOver(e, el) {
  e.preventDefault();
  el.style.borderColor = '#F5C400';
  el.style.background = 'rgba(245,196,0,0.04)';
}
function v2DropzoneDragLeave(e, el) {
  e.preventDefault();
  el.style.borderColor = '#3a3a3a';
  el.style.background = 'transparent';
}
function v2DropzoneDrop(e, el, inputId) {
  e.preventDefault();
  el.style.borderColor = '#3a3a3a';
  el.style.background = 'transparent';
  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    const input = document.getElementById(inputId);
    input.files = files;
    v2DropzoneFileChange(inputId, el.id);
  }
}
function v2DropzoneFileChange(inputId, dropzoneId) {
  const input = document.getElementById(inputId);
  const dz = document.getElementById(dropzoneId);
  if (!input || !dz || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const icon = dz.querySelector('i');
  const text = dz.querySelector('.v2-dz-text');
  const hint = dz.querySelector('.v2-dz-hint');
  dz.style.borderStyle = 'solid';
  dz.style.borderColor = '#F5C400';
  if (icon) { icon.className = 'ti ti-file-check'; icon.style.color = '#F5C400'; }
  if (text) text.innerHTML = file.name;
  if (text) text.style.color = '#f2f2f2';
  if (hint) hint.textContent = (file.size / 1024).toFixed(0) + ' Ko — cliquez pour changer';
}

function evoToggle(id) {
  evoChecked[id] = !evoChecked[id];
  if (evoChecked[id]) {
    if (!evoOrder.includes(id)) evoOrder.push(id);
  } else {
    evoOrder = evoOrder.filter(x => x !== id);
  }
  evoRender();
  dtRenderRecap();
}

function evoUpdateTotal() {
  const isMesure = evoActiveContainer === 'v2-mesure-evo-options';
  const totalId = isMesure ? 'v2-mesure-evo-total' : 'v2-evo-total';
  const totalEl = document.getElementById(totalId);
  if (!totalEl) return;
  if (isMesure) {
    totalEl.innerHTML = '<span style="color:#666;font-size:13px;">Ces options sont incluses dans le forfait Performance — 300 €</span>';
    return;
  }
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
      evoActiveContainer = 'v2-mesure-evo-options';
      evoRender();
    } else if (parcours === 'hors_gamme') {
      dtStep = 4;
      document.getElementById('dt-s4horsgamme')?.classList.add('active');
    }
    v2UpdateStepper();
    dtRenderRecap();
    if (main) main.scrollTop = 0;
  }, 150);
}

function v2RenderTaille() {
  dtRenderS3 && dtRenderS3();
  v2UpdateStepper();
}
// Bouton "Suivant" depuis la taille — selon le parcours
function v2NextFromTaille() {
  v2GoRecap();
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


function v2GoDevis() {
  // Blocage si gravure trop longue
  if (evoChecked['evo_gravure'] && evoGravureText.length > 20) {
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

function v2BackFromTaille() {
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  document.getElementById('dt-s3bif')?.classList.add('active');
  dtStep = 3;
  v2UpdateStepper();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

function v2BackFromMesureOrHorsGamme() {
  // Titanium (hors_gamme) est démarré directement depuis l'étape 1 -> y retourner.
  // Performance (sur_mesure) est démarré depuis la carte Cadre en étape 2 -> y retourner.
  // Navigation directe (pas dtGo()), qui exige un modèle sélectionné — Titanium peut ne pas en avoir.
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  if (v2Parcours === 'hors_gamme') {
    dtStep = 1;
    document.getElementById('dt-s1')?.classList.add('active');
    dtRenderS1 && dtRenderS1();
  } else {
    dtStep = 2;
    document.getElementById('dt-s2')?.classList.add('active');
    dtRenderS2 && dtRenderS2();
  }
  v2UpdateStepper();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
}

function v2BackFromDevis() {
  document.body.classList.remove('dt-step-4');
  document.querySelectorAll('.dt-step-content').forEach(s => s.classList.remove('active'));
  if (v2Parcours === 'standard') {
    // Taille connue -> Personnalisation (dt-s5perso), l'écran réellement utilisé dans le
    // flux actuel (vélo complet comme kit cadre). L'ancien dt-s3 / v2RenderTaille()
    // n'existent plus depuis la restructuration de la carte Cadre — ce cas renvoyait
    // vers un écran fantôme, vide.
    dtStep = 5;
    document.getElementById('dt-s5perso')?.classList.add('active');
    evoActiveContainer = 'v2-evo-options';
    evoRender();
  } else if (v2Parcours === 'standard_evo') {
    dtStep = 5;
    document.getElementById('dt-s5evo')?.classList.add('active');
    evoActiveContainer = 'v2-evo-options';
    evoRender();
  } else if (v2Parcours === 'sur_mesure') {
    dtStep = 4;
    document.getElementById('dt-s4mesure')?.classList.add('active');
    evoActiveContainer = 'v2-mesure-evo-options';
    evoRender();
  } else if (v2Parcours === 'hors_gamme') {
    dtStep = 4;
    document.getElementById('dt-s4horsgamme')?.classList.add('active');
  }
  v2UpdateStepper();
  dtRenderRecap();
  const main = document.getElementById('dt-main');
  if (main) main.scrollTop = 0;
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
// ── Lien "Retour au site" — priorité 1) paramètre ?backref= transmis par le
// script d'intégration WordPress (seul moyen fiable de connaître la page réellement
// visitée par le visiteur AVANT d'arriver sur le site — document.referrer, lu depuis
// l'intérieur d'une iframe, ne renvoie jamais que la page qui contient l'iframe
// elle-même, jamais ce qu'il y a avant) ; 2) document.referrer (utile en accès
// direct, mobile notamment, qui contourne l'iframe) ; 3) repli sur la page d'accueil.
// Appliqué aux deux liens (desktop #dt-header-back et mobile #p11-header-back).
(function setBackToSiteLink() {
  const FALLBACK_URL = 'https://www.obviouscycles.com/';
  let backUrl = FALLBACK_URL;
  try {
    // Lecture indépendante des paramètres d'URL — ne pas dépendre de la variable
    // globale `urlParams`, définie plus bas dans le script (ordre d'exécution).
    const localParams = new URLSearchParams(window.location.search);
    const backref = localParams.get('backref');
    if (backref) {
      const refHost = new URL(backref).hostname;
      if (refHost === 'www.obviouscycles.com' || refHost === 'obviouscycles.com') {
        backUrl = backref;
      }
    } else {
      const ref = document.referrer;
      if (ref) {
        const refHost = new URL(ref).hostname;
        if (refHost === 'www.obviouscycles.com' || refHost === 'obviouscycles.com') {
          backUrl = ref;
        }
      }
    }
  } catch (e) { /* referrer invalide ou absent -> on garde le repli */ }
  ['dt-header-back', 'p11-header-back'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = backUrl;
  });
})();

dtInit();
v2UpdateStepper(); // initialise entre autres la visibilité du bouton "Retour au site" (page 1 uniquement)
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
    /* Embed mode — l'en-tête du configurateur (logo, "Retour au site", plein écran)
       reste VISIBLE, volontairement — le thème WordPress réserve un espace fixe pour
       un bandeau en haut de page (indépendamment de ce qui s'y trouve). Le masquer
       laissait cet espace vide (bandeau noir vide constaté sur le site). Comme le
       header DU SITE lui-même est déjà caché par le CSS personnalisé WordPress, plus
       aucun risque de doublon — l'en-tête du configurateur remplit maintenant cet
       espace avec quelque chose d'utile, "Retour au site" y compris. */

    /* Embed mode — désactiver le défilement interne, laisser la page grandir
       naturellement afin que la hauteur envoyée au parent Wordpress soit exacte */
    html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; }
    .main { min-height: 0 !important; height: auto !important; }
    #dt-stepper, #dt-main, #dt-recap {
      position: static !important;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .dt-step-body { overflow: visible !important; }
    .dtr-rows { overflow: visible !important; }

    /* Embed mode — dans ce contexte d'iframe (overflow:visible forcé plus haut, sans
       défilement interne propre), la "hauteur de viewport" de l'iframe correspond à
       la hauteur TOTALE du document (pas à ce que le visiteur voit réellement sur la
       page WordPress). Une popup en position:fixed;inset:0 se centre donc au milieu
       de TOUT le document, potentiellement loin en dessous de ce qui est visible à
       l'écran. On bascule en position:absolute, positionnée en JS près du bouton
       cliqué (voir plus bas). */
    .modal-overlay { position: absolute !important; align-items: flex-start !important; }
  `;
  document.head.appendChild(style);

  // Positionne la popup près du bouton réellement cliqué — capturé dès le clic lui-
  // même (phase de capture, avant tout autre code), pas après coup : certaines popups
  // déplacent des blocs DOM entiers avant de s'ouvrir, ce qui peut faire perdre la
  // référence au bouton si on la cherche trop tard (document.activeElement).
  let lastClickY = null;
  let lastDocHeight = null;
  document.addEventListener('click', function(e) {
    const clickedEl = e.target.closest('button, a, [onclick]');
    if (clickedEl) {
      lastClickY = clickedEl.getBoundingClientRect().top;
      // Capturée AVANT toute ouverture de popup — une fois ouverte, sa propre présence
      // dans le DOM (position:absolute, 700px de haut) fausserait cette mesure.
      lastDocHeight = document.body.scrollHeight;
    }
  }, true);

  function repositionOpenModal(overlay) {
    const MODAL_HEIGHT = 700;
    let topPx = (lastClickY !== null) ? Math.max(20, lastClickY - 40) : 80;
    // Point critique : le CONTENU de la popup ne doit jamais être poussé plus bas que
    // ce que la page peut réellement contenir — sinon son bas devient inatteignable,
    // même en scrollant (calculer, saisir, fermer = impossibles).
    const docHeight = lastDocHeight !== null ? lastDocHeight : document.body.scrollHeight;
    const maxTop = Math.max(20, docHeight - MODAL_HEIGHT - 20);
    topPx = Math.min(topPx, maxTop);
    // Le FOND ASSOMBRI (l'overlay lui-même) commence toujours à top:0 et couvre toute
    // la page — sinon la partie au-dessus du contenu poussé vers le bas laisse voir la
    // page d'origine non assombrie (moche, popup qui semble mal découpée). Seul le
    // CONTENU (via padding-top) est poussé vers le bas, près du bouton cliqué.
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.height = Math.max(docHeight, topPx + MODAL_HEIGHT) + 'px';
    overlay.style.paddingTop = topPx + 'px';
  }
  new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.attributeName === 'class' && m.target.classList.contains('modal-overlay') && m.target.classList.contains('open')) {
        repositionOpenModal(m.target);
      }
    });
  }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });

  // Envoyer la hauteur au parent Wordpress pour ajustement dynamique — SAUF si une
  // popup (.modal-overlay.open) est actuellement affichée : la mesurer à ce moment
  // gonflerait la hauteur envoyée (le fond assombri de la popup couvre tout l'écran),
  // et cette hauteur excessive resterait figée sur l'iframe même après la fermeture
  // de la popup.
  //
  // Second point important : on utilise UNIQUEMENT document.body.scrollHeight, jamais
  // document.documentElement.scrollHeight — ce dernier ne peut techniquement jamais
  // être inférieur à la fenêtre/iframe ACTUELLE (comportement standard des navigateurs
  // pour l'élément racine), donc une fois l'iframe agrandie une première fois, il reste
  // bloqué à cette taille pour toujours, même en revenant sur une étape plus courte —
  // c'est la cause principale du grand vide observé sous le configurateur.
  function sendHeight() {
    if (document.querySelector('.modal-overlay.open')) return;
    const h = document.body.scrollHeight;
    // N'envoyer que si la hauteur a réellement changé (marge de 3px, arrondis) — sinon
    // chaque petite mise à jour de l'interface (case cochée, liste rafraîchie...) fait
    // redimensionner l'iframe pour rien, ce qui secoue la mise en page de la page
    // WordPress et oblige à re-scroller sans arrêt pour se replacer.
    if (lastSentHeight !== null && Math.abs(h - lastSentHeight) < 3) return;
    lastSentHeight = h;
    window.parent.postMessage({ type: 'obv-height', height: h }, '*');
  }
  let lastSentHeight = null;

  // Envoyer au chargement
  window.addEventListener('load', function() {
    setTimeout(sendHeight, 300);
    setTimeout(sendHeight, 1000);
  });

  // Envoyer à chaque mutation du DOM (changement de step, ouverture accordéon...) —
  // vrai anti-rebond : chaque nouvelle mutation ANNULE l'envoi précédent encore en
  // attente, au lieu de s'empiler par-dessus (l'ancien code pouvait déclencher
  // plusieurs redimensionnements d'affilée pour une seule interaction du visiteur).
  let sendHeightTimer = null;
  new MutationObserver(function() {
    clearTimeout(sendHeightTimer);
    sendHeightTimer = setTimeout(sendHeight, 200);
  }).observe(document.body, { childList: true, subtree: true });

  // Répondre aux demandes explicites du parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'obv-request-height') sendHeight();
  });
}
if (modeleParam) {
  // Ce bloc doit s'exécuter APRÈS que tout le script soit chargé (selSize et les
  // autres variables sont déclarées plus bas avec `let`, donc y accéder trop tôt ici
  // provoquait un crash JS qui interrompait toute l'initialisation — bug corrigé en
  // déférant l'exécution). On appelle aussi dtInit()/p11TryInit() nous-mêmes en
  // premier (idempotent, sans risque si déjà fait) pour garantir que l'interface de
  // base est prête avant d'appliquer la présélection par-dessus.
  document.addEventListener('DOMContentLoaded', function() {
    const decoded = decodeURIComponent(modeleParam);
    const resolvedId = ALIASES[decoded] || ALIASES[modeleParam] || decoded || modeleParam;
    const modeleAuto = MODELS.find(m => m.id === resolvedId);
    if (!modeleAuto) return;

    if (typeof dtInit === 'function') dtInit();
    if (typeof p11TryInit === 'function') p11TryInit();

    window._singleModel = modeleAuto.id;
    selModel = modeleAuto.id;

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
      v2Parcours = 'standard';
      window._activePreset = presetParam;
      selOpts = { ...PRESETS[modeleAuto.id][presetParam] };
      hasPreset = true;
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

      // Identifier quel preset correspond à la config chargée (si pas déjà fixé ci-dessus)
      if (!window._activePreset) {
        const modelPresets = PRESETS[modeleAuto.id];
        if (modelPresets) {
          for (const [decl, preset] of Object.entries(modelPresets)) {
            if (postes.every(p => selOpts[p] === preset[p])) {
              window._activePreset = decl;
              break;
            }
          }
        }
      }
    }

    // Appliquer sur la plateforme active — fonctions modernes uniquement
    if (window.innerWidth >= 768) {
      dtStep = 2;
      dtRender();
    } else {
      p11CurrentStep = 2;
      p11UpdateStep(2);
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 10);
  });
}

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
let selSizeSource = {}; // 'user' ou 'default' pour chaque clé de selSize
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
// Vérifie la cohérence entre l'entrejambe et la taille déterminée par la stature.
// Si l'entrejambe sort de la plage de cette taille, propose la taille adjacente
// (plus grande si l'entrejambe dépasse par le haut, plus petite si par le bas)
// et renvoie un avertissement invitant à contacter Obvious pour valider le choix.
function checkEntrejambeConsistency(chosenTaille, tailles, entrejambe) {
  if (!entrejambe) return { taille: chosenTaille, warning: null };
  const sorted = [...tailles].sort((a, b) => a.stature_min - b.stature_min);
  const idx = sorted.findIndex(t => t.taille === chosenTaille.taille);
  if (idx === -1) return { taille: chosenTaille, warning: null };
  const t = sorted[idx];
  if (entrejambe > t.ej_max) {
    const next = sorted[idx + 1];
    return {
      taille: next || t,
      warning: "Votre entrejambe (" + entrejambe + " cm) dépasse la plage habituelle pour cette taille — nous vous recommandons de nous contacter pour valider votre configuration."
    };
  }
  if (entrejambe < t.ej_min) {
    const prev = sorted[idx - 1];
    return {
      taille: prev || t,
      warning: "Votre entrejambe (" + entrejambe + " cm) est en dessous de la plage habituelle pour cette taille — nous vous recommandons de nous contacter pour valider votre configuration."
    };
  }
  return { taille: chosenTaille, warning: null };
}

// Cas du CHEVAUCHEMENT (plusieurs tailles conviennent selon la stature) : vérifie si
// l'entrejambe sort de la plage COMBINÉE de ces tailles candidates. Si oui, résout
// directement vers une taille adjacente (sans passer par le choix sport/confort) avec
// un avertissement. Si l'entrejambe reste dans la plage combinée (ou n'est pas
// renseigné), renvoie null — le choix sport/confort normal s'applique.
function checkEntrejambeOutOfCombinedRange(matches, allTailles, entrejambe) {
  if (!entrejambe) return null;
  const combinedMin = Math.min(...matches.map(t => t.ej_min));
  const combinedMax = Math.max(...matches.map(t => t.ej_max));
  if (entrejambe >= combinedMin && entrejambe <= combinedMax) return null;
  const sorted = [...allTailles].sort((a, b) => a.stature_min - b.stature_min);
  const byStature = [...matches].sort((a, b) => a.stature_min - b.stature_min);
  if (entrejambe > combinedMax) {
    const largest = byStature[byStature.length - 1];
    const idx = sorted.findIndex(t => t.taille === largest.taille);
    const next = sorted[idx + 1];
    return {
      taille: next || largest,
      warning: "Votre entrejambe (" + entrejambe + " cm) dépasse la plage habituelle pour les tailles correspondant à votre stature — nous vous recommandons de nous contacter pour valider votre configuration."
    };
  }
  const smallest = byStature[0];
  const idx = sorted.findIndex(t => t.taille === smallest.taille);
  const prev = sorted[idx - 1];
  return {
    taille: prev || smallest,
    warning: "Votre entrejambe (" + entrejambe + " cm) est en dessous de la plage habituelle pour les tailles correspondant à votre stature — nous vous recommandons de nous contacter pour valider votre configuration."
  };
}

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
  // Priorité à la STATURE : elle doit obligatoirement entrer dans la plage préconisée
  // par le cadre. En cas de chevauchement, on vérifie d'abord si l'entrejambe sort de
  // la plage combinée des tailles candidates (résolution directe + avertissement) ;
  // sinon on demande sport/confort normalement.
  let matches = tailles.filter(t => stature >= t.stature_min && stature <= t.stature_max);

  if (matches.length === 0) {
    // Aucune taille ne couvre cette stature — prendre la plus proche par stature
    const closest = tailles.reduce((a,b) => {
      const da = Math.min(Math.abs(stature-a.stature_min), Math.abs(stature-a.stature_max));
      const db = Math.min(Math.abs(stature-b.stature_min), Math.abs(stature-b.stature_max));
      return da < db ? a : b;
    });
    matches = [closest];
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
    const { taille: t, warning } = checkEntrejambeConsistency(matches[0], tailles, selle);
    selSize.taille = t.taille;
    showSizeActionBtns();
    selSize.taille = t.taille;
    // Pré-remplir avec les valeurs par défaut de cette taille
    // Tous les autres champs sont calculés par buildDimsGrid(), qui valide chaque valeur
    // contre les options RÉELLES du composant choisi — jamais d'assignation directe ici.
    if (typeof buildDimsGrid === 'function') buildDimsGrid();
    // Calculer cintre depuis inter-acromions
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let info = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (selle) info += ' · Entrejambe ' + t.ej_min + '–' + t.ej_max + ' cm';
    if (acro && selSize.cintre) info += ' · Cintre recommandé : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    if (warning) info += '<div style="margin-top:8px;padding:8px 10px;background:#2a1500;border-left:2px solid #e08b3a;color:#e0a370;font-size:12px;line-height:1.5;">' + warning + '</div>';
    sub.innerHTML = info;
    return;
  }

  // Chevauchement : l'entrejambe sort-il de la plage combinée des tailles candidates ?
  const outOfRange = checkEntrejambeOutOfCombinedRange(matches, tailles, selle);
  if (outOfRange) {
    const t = outOfRange.taille;
    selSize.taille = t.taille;
    showSizeActionBtns();
    if (typeof buildDimsGrid === 'function') buildDimsGrid();
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let info = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (acro && selSize.cintre) info += ' · Cintre recommandé : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    info += '<div style="margin-top:8px;padding:8px 10px;background:#2a1500;border-left:2px solid #e08b3a;color:#e0a370;font-size:12px;line-height:1.5;">' + outOfRange.warning + '</div>';
    sub.innerHTML = info;
    return;
  }

  overlapTailles = matches;
  const sortedCheck = [...matches].sort((a,b) => a.stature_min - b.stature_min);
  if (sortedCheck[0].taille === sortedCheck[sortedCheck.length - 1].taille) {
    // Sport et confort mèneraient à la même taille : pas la peine de demander.
    const t = sortedCheck[0];
    overlapTailles = null;
    selSize.taille = t.taille;
    showSizeActionBtns();
    if (typeof buildDimsGrid === 'function') buildDimsGrid();
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let infoSame = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (selle) infoSame += ' · Entrejambe ' + t.ej_min + '–' + t.ej_max + ' cm';
    if (acro && selSize.cintre) infoSame += ' · Cintre recommandé : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    sub.innerHTML = infoSame;
    return;
  }
  main.innerHTML = 'Votre stature correspond à deux tailles : <span style="color:#F5C400">' + matches.map(t=>t.taille).join(' ou ') + '</span>';
  sub.textContent = 'Précisez votre usage pour affiner le choix.';
  overlap.style.display = 'block';
}

function chooseUsage(usage) {
  if (!overlapTailles) return;
  document.getElementById('btn-sport').classList.toggle('sel', usage === 'sport');
  document.getElementById('btn-confort').classList.toggle('sel', usage === 'confort');
  // sport → petite taille, confort → grande taille
  // (l'entrejambe a déjà été vérifié en amont, contre la plage combinée des tailles
  // candidates, avant même de proposer ce choix — voir checkEntrejambeOutOfCombinedRange
  // dans calcSize() — donc aucun ajustement supplémentaire ici)
  const sorted = [...overlapTailles].sort((a,b) => a.stature_min - b.stature_min);
  const chosen = usage === 'sport' ? sorted[0] : sorted[sorted.length-1];
  selSize.taille = chosen.taille;
  showSizeActionBtns();
  selSize.taille = chosen.taille;
  // Tous les autres champs sont calculés par buildDimsGrid(), qui valide chaque valeur
  // contre les options RÉELLES du composant choisi — jamais d'assignation directe ici.
  if (typeof buildDimsGrid === 'function') buildDimsGrid();
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
      "manivelle": 165,
      "cintre": 380,
      "potence": 80,
      "largeur_selle": 145,
      "section": "28",
      "plateaux": "52x36",
      "cassette": "11x34"
    },
    "XS": {
      "manivelle": 165,
      "cintre": 400,
      "potence": 90,
      "largeur_selle": 145,
      "section": "28",
      "plateaux": "52x36",
      "cassette": "11x34"
    },
    "S": {
      "manivelle": 170,
      "cintre": 400,
      "potence": 90,
      "largeur_selle": 145,
      "section": "28",
      "plateaux": "52x36",
      "cassette": "11x34"
    },
    "M": {
      "manivelle": 170,
      "cintre": 420,
      "potence": 100,
      "largeur_selle": 145,
      "section": "28",
      "plateaux": "52x36",
      "cassette": "11x34"
    },
    "L": {
      "manivelle": 172.5,
      "cintre": 420,
      "potence": 110,
      "largeur_selle": 145,
      "section": "28",
      "plateaux": "52x36",
      "cassette": "11x34"
    },
    "XL": {
      "manivelle": 175,
      "cintre": 440,
      "potence": 120,
      "largeur_selle": 145,
      "section": "28",
      "plateaux": "52x36",
      "cassette": "11x34"
    }
  },
  "gravel_racing": {
    "XS": {
      "manivelle": 165,
      "cintre": 400,
      "potence": 80,
      "largeur_selle": 145,
      "section": "45",
      "plateaux": "40",
      "cassette": "10x45"
    },
    "S": {
      "manivelle": 170,
      "cintre": 420,
      "potence": 90,
      "largeur_selle": 145,
      "section": "45",
      "plateaux": "40",
      "cassette": "10x45"
    },
    "M": {
      "manivelle": 170,
      "cintre": 420,
      "potence": 100,
      "largeur_selle": 145,
      "section": "45",
      "plateaux": "40",
      "cassette": "10x45"
    },
    "L": {
      "manivelle": 172.5,
      "cintre": 440,
      "potence": 110,
      "largeur_selle": 145,
      "section": "45",
      "plateaux": "40",
      "cassette": "10x45"
    },
    "XL": {
      "manivelle": 175,
      "cintre": 460,
      "potence": 120,
      "largeur_selle": 145,
      "section": "45",
      "plateaux": "40",
      "cassette": "10x45"
    }
  },
  "gravel_bikepacking": {
    "XS": {
      "manivelle": 165,
      "cintre": 400,
      "potence": 80,
      "largeur_selle": 145,
      "section": "40",
      "plateaux": "40",
      "cassette": "10x51"
    },
    "S": {
      "manivelle": 170,
      "cintre": 420,
      "potence": 90,
      "largeur_selle": 145,
      "section": "40",
      "plateaux": "40",
      "cassette": "10x52"
    },
    "M": {
      "manivelle": 170,
      "cintre": 420,
      "potence": 100,
      "largeur_selle": 145,
      "section": "40",
      "plateaux": "40",
      "cassette": "10x53"
    },
    "L": {
      "manivelle": 172.5,
      "cintre": 440,
      "potence": 110,
      "largeur_selle": 145,
      "section": "40",
      "plateaux": "40",
      "cassette": "10x54"
    },
    "XL": {
      "manivelle": 175,
      "cintre": 460,
      "potence": 120,
      "largeur_selle": 145,
      "section": "40",
      "plateaux": "40",
      "cassette": "10x55"
    }
  },
  "vtt_enduro": {
    "S": {
      "manivelle": 165,
      "largeur_selle": 145,
      "section": "2.4\"",
      "plateaux": "32",
      "cassette": "10x52",
      "debattement": 150
    },
    "M": {
      "manivelle": 170,
      "largeur_selle": 145,
      "section": "2.4\"",
      "plateaux": "32",
      "cassette": "10x52",
      "debattement": 150
    },
    "L": {
      "manivelle": 170,
      "largeur_selle": 145,
      "section": "2.4\"",
      "plateaux": "32",
      "cassette": "10x52",
      "debattement": 150
    },
    "XL": {
      "manivelle": 172.5,
      "largeur_selle": 145,
      "section": "2.4\"",
      "plateaux": "32",
      "cassette": "10x52",
      "debattement": 150
    }
  }
};
// Source : configurateur_velos_v2.xlsx, onglet 5_GEOMETRIES — utilisée comme RECOMMANDATION.
// Toujours validée contre les options réelles du composant choisi avant application (voir computeDimDefault).

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
    // plateaux/cassette : choisis désormais directement sur la page Composants (étape 2)
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

  // Section pneu, débattement fourche, plateaux/cassette et largeur selle :
  // choisis désormais directement sur la page Composants (étape 2)

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

  const SECONDARY_KEYS = [];
  const primaryFields   = fields.filter(f => !SECONDARY_KEYS.includes(f.key));
  const secondaryFields = fields.filter(f =>  SECONDARY_KEYS.includes(f.key));

  function renderField(f) {
    selSize[f.key] = selSize[f.key] || null;
    const optHTML = f.options.map(o =>
      `<option value="${o}" ${selSize[f.key]==o?'selected':''}>${o}${f.key==='manivelle'||f.key==='potence'?' mm':''}</option>`
    ).join('');
    const onchangeFn = f.key === 'taille'
      ? `selSize['${f.key}']=this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; buildDimsGrid();`
      : `selSize['${f.key}']=this.value`;
    const jnspOption = f.options.length >= 2
      ? `<option value="">Je ne sais pas encore</option>`
      : '';
    // Valeur unique : pré-sélectionner silencieusement
    if (f.options.length === 1) selSize[f.key] = String(f.options[0]);
    return `<div class="dim-field">
      <label>${f.label}</label>
      <select class="size-select" id="${f.id}" onchange="${onchangeFn}">
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
          if (this.id === 'p11-dim-taille') { selSize.taille = this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; buildDimsGrid(); }
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

const P11_LABELS = ['Choisir votre modèle', 'Configurer vos composants', 'Votre cadre', 'Votre taille', 'Personnalisation', 'Votre configuration'];

// Retourne l'ID de la div à afficher pour un numéro d'étape donné, selon le parcours choisi
function p11StepDivId(n) {
  if (n === 1) return 'p11-s1';
  if (n === 2) return 'p11-s2';
  if (n === 3) return 'p11-s5perso'; // repurposé : Personnalisation (cadre standard déjà connu)
  if (n === 4) {
    if (v2Parcours === 'sur_mesure') return 'p11-s4mesure';
    if (v2Parcours === 'hors_gamme') return 'p11-s4horsgamme';
    return 'p11-s4std';
  }
  if (n === 5) return 'p11-s5evo';
  if (n === 6) return 'p11-s6devis';
  return 'p11-s1';
}

// ─── HISTORIQUE NAVIGATEUR MOBILE (bouton/geste retour matériel) ──────────────
let p11HistoryReady = false;
let p11SkipHistoryPush = false;

function p11InitHistory() {
  if (p11HistoryReady) return;
  p11HistoryReady = true;
  // Marquer l'entrée courante comme étape 1 (référence pour le tout premier "retour")
  history.replaceState({ p11step: 1 }, '', location.href);
  window.addEventListener('popstate', function(e) {
    if (e.state && typeof e.state.p11step === 'number') {
      p11SkipHistoryPush = true;
      p11UpdateStep(e.state.p11step);
      p11SkipHistoryPush = false;
    }
  });
}

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
  v2Parcours = 'standard';
  p11InitHistory();
  p11UpdateStep(1);
  p11InitSwipe();
}

// Rafraîchit le libellé du bouton + le lien "Besoin d'aide" de l'étape 2 SANS
// naviguer — utile quand le choix Cadre change alors qu'on est déjà sur cette page
// (p11UpdateStep(n) ne fait ce calcul qu'au moment d'un changement d'étape).
function p11UpdateStep2Footer() {
  const nextLbl = document.getElementById('p11-next-label');
  const aideLink = document.getElementById('p11-aide-taille-link');
  if (nextLbl) {
    nextLbl.textContent = v2Parcours === 'sur_mesure' ? 'Continuer'
      : !selSize.taille ? 'Déterminer ma taille'
      : 'Personnalisation';
  }
  if (aideLink) aideLink.style.display = (v2Parcours !== 'sur_mesure' && selSize.taille) ? 'block' : 'none';
}

function p11UpdateStep(n) {
  p11CurrentStep = n;
  // Historique : chaque changement d'étape pousse une entrée, sauf si on répond à un popstate
  if (p11HistoryReady && !p11SkipHistoryPush) {
    history.pushState({ p11step: n }, '', location.href);
  }
  // Dots + labels (6 étapes)
  for (let i=1; i<=6; i++) {
    const dot = document.getElementById('p11-dot-' + i);
    if (!dot) continue;
    dot.className = 'p11-step-dot' + (i === n ? ' active' : i < n ? ' done' : '');
    const sl = document.getElementById('p11-sl-' + i);
    if (sl) sl.style.color = i === n ? '#F5C400' : i < n ? '#666' : '#888';
  }
  const backBtn = document.getElementById('p11-back-btn');
  const fwdBtn  = document.getElementById('p11-fwd-btn');
  if (backBtn) backBtn.style.color = n > 1 ? '#F5C400' : '#333';
  if (fwdBtn)  fwdBtn.style.color  = (n < 6 && n !== 3) ? '#F5C400' : '#333';
  // Steps
  document.querySelectorAll('.p11-step').forEach(s => { s.classList.remove('active'); s.classList.remove('p11-active'); s.style.display = 'none'; });
  const stepId = p11StepDivId(n);
  const step = document.getElementById(stepId);
  if (step) { step.classList.add('p11-active'); step.style.display = 'block'; }
  // Bandeau bas : toujours visible si un modèle est choisi (sauf étape 6, récap déjà détaillé)
  // Seul le bouton "Suivant" est masqué sur les pages avec boutons inline (3, 4mesure, 4horsgamme, 5, 6)
  const bar = document.getElementById('p11-bottom-bar');
  const btn = document.getElementById('p11-next-btn');
  const nextLbl = document.getElementById('p11-next-label');
  const priceStrip = document.getElementById('p11-price-strip');
  const hasInlineNav = (n === 3) || (n === 4 && (v2Parcours === 'sur_mesure' || v2Parcours === 'hors_gamme')) || (n === 5) || (n === 6);
  if (bar) bar.style.display = (selModel && n !== 6) ? 'block' : 'none';
  if (btn) btn.style.display = hasInlineNav ? 'none' : 'flex';
  if (n === 6) p11InitStep4Bar();
  if (!hasInlineNav && nextLbl) {
    if (n === 4 && !window.sizeValidated) {
      nextLbl.textContent = v2Parcours === 'standard_evo' ? 'Continuer' : 'Continuer sans taille';
    } else if (n === 4 && v2Parcours === 'standard_evo') {
      nextLbl.textContent = 'Mes personnalisations';
    } else if (n === 4) {
      nextLbl.textContent = 'Ma configuration';
    } else if (n === 2) {
      nextLbl.textContent = v2Parcours === 'sur_mesure' ? 'Continuer'
        : !selSize.taille ? 'Déterminer ma taille'
        : 'Personnalisation';
    } else {
      nextLbl.textContent = P11_LABELS[n] || '';
    }
  }
  // Lien discret "Besoin d'aide" — uniquement étape 2, cadre = taille déjà connue
  const aideLink = document.getElementById('p11-aide-taille-link');
  if (aideLink) aideLink.style.display = (n === 2 && v2Parcours !== 'sur_mesure' && selSize.taille) ? 'block' : 'none';
  // Afficher le prix sur toutes les pages dès qu'un modèle est choisi (sauf étape 6, récap déjà détaillé)
  if (priceStrip) priceStrip.style.display = (selModel && n !== 6) ? 'flex' : 'none';
  const stripSave = document.getElementById('p11-strip-save');
  if (stripSave) stripSave.style.display = (n >= 2 && n !== 6 && selModel) ? 'flex' : 'none';
  if (selModel) p11UpdateTotal();
  // Step 1 : désactiver next si pas de modèle
  if (n === 1 && btn) btn.style.opacity = selModel ? '1' : '.4';
  // Step 2 : construire les postes
  if (n === 2) { p11RenderPosts(); p11UpdateTotal(); }
  // Step 3 (repurposé) : Personnalisation seule (cadre standard déjà connu)
  if (n === 3) { p11EvoActiveContainer = 'p11-evo-options-perso'; p11EvoRender(); }
  // Step 4std (taille) : rebuilder dims si mode connu
  if (n === 4 && v2Parcours !== 'sur_mesure' && v2Parcours !== 'hors_gamme' && p11SizeMode) p11BuildDimsGrid();
  // Step 4 sur_mesure : rendre les options Évolution incluses (sans prix)
  if (n === 4 && v2Parcours === 'sur_mesure') { p11EvoActiveContainer = 'p11-mesure-evo-options'; p11EvoRender(); }
  // Step 5 : rendre les options Évolution (avec prix)
  if (n === 5) { p11EvoActiveContainer = 'p11-evo-options'; p11EvoRender(); }
  // Step 6 : construire le récap final
  if (n === 6) p11RenderFinalRecap();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function p11Next() {
  if (p11CurrentStep === 1) { if (!selModel) return; p11UpdateStep(2); return; }
  if (p11CurrentStep === 2) {
    // Destination selon le choix Cadre (carte "Cadre" en haut des composants)
    if (v2Parcours === 'sur_mesure') { p11UpdateStep(4); return; }
    if (!selSize.taille) { p11OpenGuideSheet(); return; }
    p11UpdateStep(3); return; // Personnalisation (repurposé)
  }
  if (p11CurrentStep === 3) return; // navigation par boutons inline uniquement
  if (p11CurrentStep === 4) {
    if (v2Parcours === 'standard_evo') { p11UpdateStep(5); return; }
    p11UpdateStep(6); return;
  }
  if (p11CurrentStep === 5) { p11UpdateStep(6); return; }
}

function p11Back() {
  if (p11CurrentStep === 1) return;
  if (p11CurrentStep === 2) { p11UpdateStep(1); return; }
  if (p11CurrentStep === 3) { p11UpdateStep(2); return; }
  if (p11CurrentStep === 4) {
    if (v2Parcours === 'hors_gamme') { p11UpdateStep(1); return; } // Titanium -> retour étape 1 (démarré de là)
    p11UpdateStep(2); return; // Performance -> retour composants
  }
  if (p11CurrentStep === 5) { p11UpdateStep(4); return; }
  if (p11CurrentStep === 6) {
    if (v2Parcours === 'standard_evo') { p11UpdateStep(5); return; }
    if (v2Parcours === 'sur_mesure' || v2Parcours === 'hors_gamme') { p11UpdateStep(4); return; }
    p11UpdateStep(3); return; // standard -> retour Personnalisation
  }
}

function p11GoTo(n) { p11UpdateStep(n); }

// ─── BIFURCATION MOBILE (Étape 3) ──────────────────────────────────────────────
function p11ChooseParcours(parcours) {
  v2Parcours = parcours;
  ['standard','standard_evo','sur_mesure','hors_gamme'].forEach(p => {
    const card = document.getElementById('p11-card-' + p);
    if (card) card.style.borderColor = p === parcours ? '#F5C400' : '#333';
  });
  setTimeout(() => { p11UpdateStep(4); }, 150);
}

// Depuis Évolution / Sur mesure / Hors gamme -> Récap (étape 6)
function p11GoDevisFromOOD() {
  if (v2Parcours === 'sur_mesure') {
    window._v2Message = document.getElementById('p11-mesure-message')?.value || '';
  } else if (v2Parcours === 'hors_gamme') {
    window._v2Message = document.getElementById('p11-horsgamme-message')?.value || '';
  }
  if (evoChecked['evo_gravure'] && evoGravureText.length > 20) {
    const input = document.getElementById('p11-evo-gravure-input') || document.getElementById('evo-gravure-input');
    if (input) { input.style.borderColor = '#e05555'; input.focus(); }
    return;
  }
  p11UpdateStep(6);
}

// ─── DROPZONE FICHIER MOBILE (tap pour choisir, pas de drag&drop) ──────────────
function p11FileChange(inputId, dropzoneId) {
  const input = document.getElementById(inputId);
  const dz = document.getElementById(dropzoneId);
  if (!input || !dz || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const icon = dz.querySelector('i');
  const text = dz.querySelector('.p11-dz-text');
  const hint = dz.querySelector('.p11-dz-hint');
  dz.style.borderStyle = 'solid';
  dz.style.borderColor = '#F5C400';
  if (icon) { icon.className = 'ti ti-file-check'; icon.style.color = '#F5C400'; }
  if (text) { text.textContent = file.name; text.style.color = '#f2f2f2'; }
  if (hint) hint.textContent = (file.size / 1024).toFixed(0) + ' Ko — toucher pour changer';
}

// ─── OPTIONS ÉVOLUTION MOBILE (réutilise EVO_OPTIONS / EVO_INSERTS / evoChecked / evoOrder déjà définis) ──
let p11EvoActiveContainer = 'p11-evo-options';

function p11EvoRender() {
  const container = document.getElementById(p11EvoActiveContainer);
  if (!container) return;
  const showPrices = p11EvoActiveContainer !== 'p11-mesure-evo-options';
  const opts = EVO_OPTIONS.filter(o => o.modeles.includes(selModel));
  const firstId = evoOrder[0];

  container.innerHTML = opts.map(opt => {
    const checked = evoChecked[opt.id] || false;
    const priceLabel = evoOptionPrice(opt.id) + ' €';
    const isGravure = opt.id === 'evo_gravure';
    const isInserts = opt.id === 'evo_inserts';
    const iconName = EVO_ICONS[opt.id] || 'ti-adjustments';
    const gravureText = evoGravureText || '';
    const gravureError = gravureText.length > 20;

    return `<div style="background:#111;border:0.5px solid ${checked ? '#F5C400' : '#222'};padding:.9rem 1rem;border-radius:8px;">
      <div style="display:flex;align-items:flex-start;gap:.65rem;${isInserts ? '' : 'cursor:pointer;'}" ${isInserts ? '' : `onclick="p11EvoToggle('${opt.id}')"`}>
        <i class="ti ${iconName}" style="font-size:16px;color:${checked ? '#F5C400' : '#666'};flex-shrink:0;margin-top:1px;"></i>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;">
            <span style="font-size:14px;font-weight:500;color:#f2f2f2;">${opt.label}</span>
            ${(isInserts || !showPrices) ? '' : `<span style="font-size:13px;font-weight:500;color:${checked ? '#F5C400' : firstId ? '#aaa' : '#666'};white-space:nowrap;">${priceLabel}</span>`}
          </div>
          ${opt.note && !isInserts ? `<div style="font-size:13px;color:#999;line-height:1.5;margin-top:4px;">${opt.note}</div>` : ''}
          ${isGravure ? `<img src="/configurateur/assets/evolution/votre_nom_mob.webp" alt="Exemple de gravure sur tube supérieur" style="width:100%;aspect-ratio:3/1;object-fit:cover;border-radius:4px;margin-top:8px;border:0.5px solid #333;display:block;">` : ''}
        </div>
        ${isInserts ? '' : `<div style="width:18px;height:18px;border-radius:5px;border:0.5px solid ${checked ? '#F5C400' : '#444'};background:${checked ? '#F5C400' : 'transparent'};flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;">
          ${checked ? '<i class="ti ti-check" style="font-size:11px;color:#1a1a00;"></i>' : ''}
        </div>`}
      </div>
      ${isInserts ? p11EvoRenderInsertsSubList(priceLabel, showPrices) : ''}
      ${isGravure && checked ? `
      <div style="margin-top:.75rem;padding-top:.75rem;border-top:0.5px solid #222;" onclick="event.stopPropagation()">
        <input type="text" id="p11-evo-gravure-input" maxlength="30" value="${gravureText.replace(/"/g,'&quot;')}" placeholder="TEXTE À GRAVER (20 CARACTÈRES MAX)" oninput="p11EvoUpdateGravureText(this.value)" style="width:100%;box-sizing:border-box;background:#0d0d0d;border:0.5px solid ${gravureError ? '#e05555' : '#333'};color:#f2f2f2;padding:10px;font-size:14px;font-family:inherit;text-transform:uppercase;letter-spacing:.03em;border-radius:6px;">
        <div style="font-size:11px;color:${gravureError ? '#e05555' : '#888'};margin-top:4px;">${gravureError ? 'Maximum 20 caractères, espaces compris' : (gravureText.length + ' / 20 caractères')}</div>
      </div>` : ''}
    </div>`;
  }).join('');

  container.innerHTML += p11EvoRenderCustomText();
  p11EvoUpdateTotal();
}

function p11EvoRenderInsertsSubList(priceLabel, showPrices) {
  const items = EVO_INSERTS.filter(i => i.avail[selModel] !== 'x');
  if (items.length === 0) return '';
  const anyInsertChecked = items.some(i => i.avail[selModel] === 0 && evoInsertsChecked[i.id]);
  return `<div style="margin-top:.75rem;padding-top:.75rem;border-top:0.5px solid #222;display:flex;flex-direction:column;gap:8px;">` +
    items.map(item => {
      const isIncluded = item.avail[selModel] === 1;
      const isChecked = evoInsertsChecked[item.id] || false;
      const iName = EVO_ICONS[item.id] || 'ti-plug';
      if (isIncluded) {
        return `<div style="display:flex;align-items:center;gap:8px;opacity:.7;">
          <i class="ti ${iName}" style="font-size:14px;color:#666;flex-shrink:0;"></i>
          <span style="font-size:13px;color:#999;flex:1;">${item.label}${item.note ? ' — ' + item.note : ''}</span>
          <span style="font-size:11px;color:#999;">sur cadre standard</span>
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:8px;" onclick="event.stopPropagation();p11EvoToggleInsert('${item.id}')">
        <i class="ti ${iName}" style="font-size:14px;color:${isChecked ? '#F5C400' : '#666'};flex-shrink:0;"></i>
        <span style="font-size:13px;color:#f2f2f2;flex:1;">${item.label}${item.note ? ' — ' + item.note : ''}</span>
        <div style="width:16px;height:16px;border-radius:5px;border:0.5px solid ${isChecked ? '#F5C400' : '#444'};background:${isChecked ? '#F5C400' : 'transparent'};flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          ${isChecked ? '<i class="ti ti-check" style="font-size:10px;color:#1a1a00;"></i>' : ''}
        </div>
      </div>`;
    }).join('') +
    (showPrices ? `<div style="display:flex;justify-content:flex-end;margin-top:2px;padding-top:6px;border-top:0.5px solid #1a1a1a;">
      <span style="font-size:13px;font-weight:500;color:${anyInsertChecked ? '#F5C400' : '#666'};">${priceLabel}</span>
    </div>` : '') +
  '</div>';
}

function p11EvoRenderCustomText() {
  return `<div style="margin-top:.5rem;padding:1rem;background:#0d0d0d;border:0.5px dashed #333;border-radius:8px;">
    <div style="font-size:13px;color:#888;margin-bottom:6px;">Une demande particulière non listée ci-dessus ?</div>
    <textarea id="p11-evo-custom-text" rows="2" placeholder="Décrivez votre besoin..." oninput="evoCustomText=this.value" style="width:100%;box-sizing:border-box;background:#111;border:0.5px solid #333;color:#f2f2f2;padding:10px;font-size:14px;font-family:inherit;resize:vertical;line-height:1.5;border-radius:6px;">${evoCustomText}</textarea>
    <div style="font-size:11px;color:#666;margin-top:6px;">Cette demande sera soumise à validation de faisabilité par notre équipe.</div>
  </div>`;
}

function p11EvoToggleInsert(id) {
  evoInsertsChecked[id] = !evoInsertsChecked[id];
  applyInsertExclusivity(id);
  const items = EVO_INSERTS.filter(i => i.avail[selModel] === 0);
  const anyChecked = items.some(i => evoInsertsChecked[i.id]);
  evoChecked['evo_inserts'] = anyChecked;
  if (anyChecked) { if (!evoOrder.includes('evo_inserts')) evoOrder.push('evo_inserts'); }
  else { evoOrder = evoOrder.filter(x => x !== 'evo_inserts'); }
  p11EvoRender();
  p11UpdateTotal();
}

function p11EvoToggle(id) {
  evoChecked[id] = !evoChecked[id];
  if (evoChecked[id]) { if (!evoOrder.includes(id)) evoOrder.push(id); }
  else { evoOrder = evoOrder.filter(x => x !== id); }
  p11EvoRender();
  p11UpdateTotal();
}

function p11EvoUpdateGravureText(val) {
  const upperVal = val.toUpperCase();
  evoGravureText = upperVal;
  const input = document.getElementById('p11-evo-gravure-input');
  const cursorPos = input ? input.selectionStart : null;
  if (input && input.value !== upperVal) {
    input.value = upperVal;
    if (cursorPos !== null) input.setSelectionRange(cursorPos, cursorPos);
  }
  const errDiv = input ? input.parentElement.querySelector('div') : null;
  const isError = upperVal.length > 20;
  if (input) input.style.borderColor = isError ? '#e05555' : '#333';
  if (errDiv) {
    errDiv.style.color = isError ? '#e05555' : '#888';
    errDiv.textContent = isError ? 'Maximum 20 caractères, espaces compris' : (upperVal.length + ' / 20 caractères');
  }
}

function p11EvoUpdateTotal() {
  const isMesure = p11EvoActiveContainer === 'p11-mesure-evo-options';
  const isPerso  = p11EvoActiveContainer === 'p11-evo-options-perso';
  const totalId = isMesure ? 'p11-mesure-evo-total' : isPerso ? 'p11-evo-total-perso' : 'p11-evo-total';
  const totalEl = document.getElementById(totalId);
  if (!totalEl) return;
  if (isMesure) {
    totalEl.textContent = 'Ces options sont incluses dans le forfait Performance — 300 €';
    return;
  }
  const total = evoTotalPrice();
  totalEl.innerHTML = total === null
    ? '<span style="color:#666;">Sélectionnez les options souhaitées</span>'
    : 'Total options : <strong style="color:#F5C400;">' + total + ' €</strong>';
}

// Rendu modèles mobile
// Accordéon mobile : ouvre/ferme une carte modèle (referme automatiquement les
// autres, une seule carte dépliée à la fois — voir p11RenderModels()).
// Accordéon mobile : tap sur une vignette différente de celle actuellement active
// (déjà sélectionnée ou juste dépliée) fait perdre à l'ancienne son focus ET son
// bouton actif s'il y en avait un, et déplie la nouvelle SANS choisir de mode —
// exactement la même logique que dtHighlightCard() côté desktop (cohérence totale).
// Tap sur la vignette déjà active : ne change rien.
function p11ToggleModelCard(modelId) {
  if (selModel === modelId) return;
  selModel = modelId;
  window._kitCadre = null; // focus sans choix de mode
  p11RenderModels();
}

function p11RenderModels() {
  const grid = document.getElementById('p11-model-grid');
  if (!grid) return;
  grid.className = 'model-grid';
  grid.innerHTML = MODELS.map(m => {
    const sel = m.id === selModel;
    // window._kitCadre est à 3 états : null (focus sans choix), true (kit cadre),
    // false (vélo complet) — même logique que desktop, pour un comportement identique.
    const isKitSel = sel && window._kitCadre === true;
    const isCompletSel = sel && window._kitCadre === false;
    const completPrice = tiMinPrice(m.id);
    const kitPrice = kitMinPrice(m.id);
    const minPrice = kitPrice !== null ? Math.min(completPrice, kitPrice) : completPrice;
    // Accordéon : un seul modèle déplié à la fois — celui qui a le focus (sel),
    // qu'un mode ait déjà été choisi ou non. Un seul état à suivre désormais
    // (selModel), plus de variable séparée pour l'expansion.
    const isExpanded = sel;
    // Préconfigs (Signature/Ti1/Ti2) intégrées DANS la carte dépliée, juste sous les
    // boutons — jamais dans une barre flottante séparée en haut de page, sans lien
    // visuel avec le modèle concerné (source de confusion signalée par Damien).
    const hasPresets = PRESETS[m.id];
    const presetHtml = (isExpanded && isCompletSel && hasPresets) ?
      '<div class="mc-preset-inline">' +
        '<div class="mc-preset-inline-hdr">' +
          '<span>3 suggestions de départ</span>' +
          '<button onclick="event.stopPropagation();p11TogglePresetInfo()" title="En savoir plus"><i class="ti ti-info-circle"></i></button>' +
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
        '</div>' +
      '</div>' : '';
    return '<div class="p11-model-card' + (sel ? ' sel' : '') + (isExpanded ? ' expanded' : '') + '"' +
      (isExpanded ? '' : ' onclick="p11ToggleModelCard(\'' + m.id + '\')"') + '>' +
      '<img class="mc-photo" src="' + (m.photo||'') + '" alt="' + m.name + '" loading="lazy">' +
      '<div class="mc-text">' +
        '<span class="mc-badge">' + m.badge + '</span>' +
        '<span class="mc-name">' + m.name + '</span>' +
        '<span class="mc-desc">' + m.desc + '</span>' +
        (isExpanded ?
          '<div class="mc-mode-buttons-stack">' +
            '<button class="mc-mode-btn-stack' + (isCompletSel ? ' active' : '') + '" onclick="p11SelectModelMode(\'' + m.id + '\', false)">' +
              '<span class="mc-mode-btn-label">Vélo complet</span>' +
              '<span class="mc-mode-btn-price">' + completPrice.toLocaleString('fr-FR') + ' €</span>' +
            '</button>' +
            '<button class="mc-mode-btn-stack' + (isKitSel ? ' active' : '') + '" onclick="p11SelectModelMode(\'' + m.id + '\', true)">' +
              '<span class="mc-mode-btn-label">Kit cadre</span>' +
              (kitPrice !== null ? '<span class="mc-mode-btn-price">' + kitPrice.toLocaleString('fr-FR') + ' €</span>' : '') +
            '</button>' +
          '</div>' +
          presetHtml
        :
          '<div class="mc-price-range">à partir de ' + minPrice.toLocaleString('fr-FR') + ' €</div>' +
          '<button class="mc-choose-btn" onclick="event.stopPropagation();p11ToggleModelCard(\'' + m.id + '\')">Choisir ce modèle ↓</button>'
        ) +
      '</div>' +
    '</div>';
  }).join('');
  // Ancienne barre de préconfigs (hors carte) — conservée cachée pour compatibilité,
  // les préconfigs vivent maintenant dans la carte dépliée elle-même (voir presetHtml).
  const oldBar = document.getElementById('p11-preset-bar');
  if (oldBar) oldBar.style.display = 'none';
}

// Choix "Vélo complet" / "Kit cadre seul" — mobile
function p11SelectModelMode(id, isKit) {
  window._kitCadre = isKit;
  p11SelectModel(id);
}



// Les préconfigs vivent maintenant directement dans la carte modèle dépliée
// (voir p11RenderModels/presetHtml) — cette fonction ne fait plus que garder
// l'ancienne barre séparée masquée, pour ne pas casser ses appelants existants.
function p11RenderPresets() {
  const bar = document.getElementById('p11-preset-bar');
  if (bar) bar.style.display = 'none';
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
  syncAllPostDims();
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
  // Vélo complet -> preset Ti1 par défaut. Kit cadre -> préconfig kit cadre dédiée
  // (fourche/pilotage/tige uniquement — vide pour le VTT, le visiteur choisit lui-même).
  if (window._kitCadre) {
    window._activePreset = null;
    const kitPreset = KIT_CADRE_PRESETS[id];
    if (kitPreset && Object.keys(kitPreset).length) { selOpts = {...kitPreset}; syncAllPostDims(); }
  } else {
    const preset = PRESETS[id] && PRESETS[id]['Ti2'];
    if (preset) { window._activePreset = 'Ti2'; selOpts = {...preset}; syncAllPostDims(); }
  }
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
  const icons = { fourche:'ti-git-fork', roues:'ti-circle', pneus:'ti-circle-dotted', transmission:'ti-settings', power:'ti-activity', frein:'ti-hand-stop', pilotage:'ti-adjustments-horizontal', potence:'ti-adjustments-horizontal', cintre:'ti-arrows-horizontal', selle:'ti-armchair', tige:'ti-arrows-vertical', pedales:'ti-rotate-clockwise', fourche_kit:'ti-git-fork', potence_kit:'ti-adjustments-horizontal', cintre_kit:'ti-arrows-horizontal', tige_kit:'ti-arrows-vertical' };
  container.innerHTML =
    '<div class="mc-switch-mode" style="margin:0 0 12px;padding:10px 12px;background:var(--bg2);border:0.5px solid var(--border);border-top:0.5px solid var(--border);">Vous configurez : <strong>' + (window._kitCadre ? 'Kit cadre' : 'Vélo complet') + '</strong> — <a onclick="p11SwitchMode()">passer en ' + (window._kitCadre ? 'vélo complet' : 'kit cadre') + '</a></div>' +
    renderCadreCard('p11-cadre-taille-select') + activePostMeta().map(p => {
    // Poste absorbé par un combo (ex: Cintre inclus avec la potence Alanera)
    const comboLock = findComboLock(p.id);
    if (comboLock) {
      return '<div class="post-block post-block-combo-locked" data-post-id="' + p.id + '">' +
        '<div class="post-hdr" style="cursor:default;">' +
          '<i class="ti ' + (icons[p.id]||'ti-point') + ' ph-icon"></i>' +
          '<span class="ph-name">' + p.name + '</span>' +
          '<span class="ph-sel" style="color:#888;font-style:italic;">' + comboLock.comboWithLabel + '</span>' +
        '</div>' +
      '</div>';
    }

    const opts = optionsFor(p.id, selModel);
    if (!opts.length) return '';
    // Masquer "mesure de puissance" si une seule option (= non disponible)
    if (p.id === 'power' && opts.length <= 1) return '';
    const selOpt = opts.find(o => o.id === selOpts[p.id]);
    const isOpen = openPost === p.id;
    // En kit cadre, aucun composant n'est "déjà compris" dans le prix de base — le statut
    // locked (recommandé par défaut) ne doit donc jamais annuler son prix dans le calcul
    // du delta affiché sur les autres options, contrairement au vélo complet.
    const curPrice = selOpt ? selOpt.price : 0;  // V5 — prix absolu, plus d'exemption "locked"
    const hasPhotos = opts.some(o => o.image && o.image.length > 0 && o.image !== 'assets/no_option.png');

    const optHtml = hasPhotos
      ? '<div class="opt-photo-grid">' + opts.map(o => {
          const sel = selOpts[p.id] === o.id;
          const isDefault = isPresetDefault(p.id, o.id);
          const rec = isRecommended(o, selModel);
          // Toujours l'écart réel vs le composant actuellement sélectionné (comme sur desktop) —
          // le statut "locked" de l'option affichée n'a pas à changer ce calcul.
          const d = o.price - curPrice;
          const diff = sel ? '±0 €' : d===0 ? '±0 €' : (d>0?'+':'')+d.toLocaleString('fr-FR')+' €';
          const pc = d<0?'neg':d>0?'pos':'zero';
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
              (diff ? '<div class="opc-price' + (pc==='neg'?' negative':'') + '">' + diff + '</div>' : '') +
            '</div>' +
          '</div>';
        }).join('') + '</div>'
      : '<div class="opt-list">' + opts.map(o => {
          const sel = selOpts[p.id] === o.id;
          const isDefault = isPresetDefault(p.id, o.id);
          // Toujours l'écart réel vs le composant actuellement sélectionné (comme sur desktop)
          const d = o.price - curPrice;
          const diff = sel ? '±0 €' : d===0 ? '±0 €' : (d>0?'+':'')+d.toLocaleString('fr-FR')+' €';
          const diffNeg = d < 0;
          return '<div class="opt-item' + (sel?' sel':'') + '" onclick="p11SelectOpt(\'' + p.id + '\',\'' + o.id + '\')">' +
            '<div class="opt-radio"><div class="radio-dot"></div></div>' +
            '<div class="oi-info">' +
              '<div class="oi-name">' + o.name + '</div>' +
              (o.desc ? '<div class="oi-desc">' + o.desc + '</div>' : '') +
            '</div>' +
            '<div class="oi-meta">' + '<div class="oi-price' + (diffNeg?' negative':'') + '">' + diff + '</div></div>' +
          '</div>';
        }).join('') + '</div>';

    // Dimensions dépendantes du composant choisi (plateaux/cassette/section/débattement)
    let dimsHtmlP11 = '';
    if (selOpt && selOpt.dims && POST_DIM_FIELDS[p.id]) {
      POST_DIM_FIELDS[p.id].forEach(key => {
        const dimOptions = selOpt.dims[key];
        if (dimOptions && dimOptions.length >= 1) {
          dimsHtmlP11 += renderComponentDimField(key, DIM_LABELS[key], dimOptions, 'p11RenderPosts', computeDimDefault(key, dimOptions));
        }
      });
    }

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
      '<div class="post-opts' + (isOpen?' open':'') + '">' + optHtml + dimsHtmlP11 + '</div>' +
    '</div>';
  }).join('');
  p11UpdateTotal();
}

function p11SelectOpt(postId, optId) {
  const opt = optionsFor(postId, selModel).find(o => o.id === optId);
  if (!opt) return;
  selOpts[postId] = optId;
  // Combo (ex: Alanera) : le poste absorbé n'a plus de sélection propre — il
  // s'affichera verrouillé au prochain rendu, pas de valeur fantôme à conserver.
  if (opt.comboWithPost) delete selOpts[opt.comboWithPost];

  // Synchroniser les dimensions dépendantes (plateaux/cassette/section/débattement)
  if (POST_DIM_FIELDS[postId]) syncPostDims(postId, opt);

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
  activePostMeta().forEach(p => {
    if (p.id === postId) return;
    if (!selOpts[p.id]) return;
    const allIncompat = activePostMeta().reduce((acc, pp) => {
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
  const {price: bikePriceT} = computeTotals(selModel, selOpts);
  const { surcharge: oodT, isMin: oodTMin } = computeOodSurcharge();
  const price = bikePriceT + oodT;
  const formatted = (oodTMin?'Dès ':'') + price.toLocaleString('fr-FR') + ' €';
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
  // Priorité à la STATURE (comme sur desktop) — l'entrejambe sert uniquement, ensuite,
  // à vérifier la cohérence de la taille retenue (voir checkEntrejambeConsistency).
  let matches = tailles.filter(t => stature >= t.stature_min && stature <= t.stature_max);
  if (!matches.length) {
    const cl = tailles.reduce((a,b) => Math.min(Math.abs(stature-a.stature_min),Math.abs(stature-a.stature_max)) < Math.min(Math.abs(stature-b.stature_min),Math.abs(stature-b.stature_max)) ? a : b);
    matches = [cl];
  }
  result.classList.add('show'); overlap.style.display='none';
  document.getElementById('p11-btn-sport').classList.remove('sel');
  document.getElementById('p11-btn-confort').classList.remove('sel');
  p11OverlapTailles = null;
  if (!matches.length) { main.textContent = 'Aucune taille trouvée.'; return; }
  if (matches.length === 1) {
    const { taille: t, warning } = checkEntrejambeConsistency(matches[0], tailles, ejRaw);
    window.sizeValidated = true;
    selSize.taille = t.taille;
    // Tous les autres champs sont calculés par p11BuildDimsGrid(), qui valide chaque valeur
    // contre les options RÉELLES du composant choisi — jamais d'assignation directe ici.
    if (typeof p11BuildDimsGrid === 'function') p11BuildDimsGrid();
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let info = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (acro && selSize.cintre) info += ' · Cintre : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    if (warning) info += '<div style="margin-top:8px;padding:8px 10px;background:#2a1500;border-left:2px solid #e08b3a;color:#e0a370;font-size:12px;line-height:1.5;">' + warning + '</div>';
    sub.innerHTML = info;
    // Mettre à jour le bouton
    const _nextLbl = document.getElementById('p11-next-label');
    if (_nextLbl) _nextLbl.textContent = 'Ma configuration';
    return;
  }
  // Chevauchement : l'entrejambe sort-il de la plage combinée des tailles candidates ?
  const outOfRangeM = checkEntrejambeOutOfCombinedRange(matches, tailles, ejRaw);
  if (outOfRangeM) {
    const t = outOfRangeM.taille;
    window.sizeValidated = true;
    selSize.taille = t.taille;
    if (typeof p11BuildDimsGrid === 'function') p11BuildDimsGrid();
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let info = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (acro && selSize.cintre) info += ' · Cintre : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    info += '<div style="margin-top:8px;padding:8px 10px;background:#2a1500;border-left:2px solid #e08b3a;color:#e0a370;font-size:12px;line-height:1.5;">' + outOfRangeM.warning + '</div>';
    sub.innerHTML = info;
    const _nextLbl2 = document.getElementById('p11-next-label');
    if (_nextLbl2) _nextLbl2.textContent = 'Ma configuration';
    return;
  }
  p11OverlapTailles = matches;
  const sortedCheckM = [...matches].sort((a,b) => a.stature_min - b.stature_min);
  if (sortedCheckM[0].taille === sortedCheckM[sortedCheckM.length - 1].taille) {
    // Sport et confort mèneraient à la même taille : pas la peine de demander.
    const t = sortedCheckM[0];
    p11OverlapTailles = null;
    window.sizeValidated = true;
    selSize.taille = t.taille;
    if (typeof p11BuildDimsGrid === 'function') p11BuildDimsGrid();
    if (acro) calcCintreFromAcro(acro);
    main.innerHTML = 'Taille recommandée : <span style="color:#F5C400">' + t.taille + '</span>';
    let infoSame = 'Stature ' + t.stature_min + '–' + t.stature_max + ' cm';
    if (acro && selSize.cintre) infoSame += ' · Cintre : <span style="color:#F5C400">' + selSize.cintre + ' mm</span>';
    sub.innerHTML = infoSame;
    const _nextLbl3 = document.getElementById('p11-next-label');
    if (_nextLbl3) _nextLbl3.textContent = 'Ma configuration';
    return;
  }
  main.innerHTML = 'Deux tailles : <span style="color:#F5C400">' + matches.map(t=>t.taille).join(' ou ') + '</span>';
  sub.innerHTML = '<span style="color:#e8e8e8">Précisez votre usage ↓</span>';
  overlap.style.display = 'block';
}

function p11ChooseUsage(usage) {
  if (!p11OverlapTailles) return;
  document.getElementById('p11-btn-sport').classList.toggle('sel', usage==='sport');
  document.getElementById('p11-btn-confort').classList.toggle('sel', usage==='confort');
  // (l'entrejambe a déjà été vérifié en amont, contre la plage combinée des tailles
  // candidates, avant même de proposer ce choix — voir checkEntrejambeOutOfCombinedRange
  // dans p11CalcSize() — donc aucun ajustement supplémentaire ici)
  const sorted = [...p11OverlapTailles].sort((a,b)=>a.stature_min-b.stature_min);
  const chosen = usage==='sport' ? sorted[0] : sorted[sorted.length-1];
  window.sizeValidated = true;
  selSize.taille = chosen.taille;
  const _cLbl = document.getElementById('p11-next-label');
  if (_cLbl) _cLbl.textContent = 'Ma configuration';
  // Tous les autres champs sont calculés par p11BuildDimsGrid(), qui valide chaque valeur
  // contre les options RÉELLES du composant choisi — jamais d'assignation directe ici.
  if (typeof p11BuildDimsGrid === 'function') p11BuildDimsGrid();
  const acroRaw = parseFloat(document.getElementById('p11-guide-acro').value) || null;
  if (acroRaw) calcCintreFromAcro(Math.round(acroRaw*10));
  document.getElementById('p11-result-main').innerHTML =
    'Taille recommandée : <span style="color:#F5C400">' + chosen.taille + '</span> <span style="font-size:12px;color:#888">(' + (usage==='sport'?'sportif':'confort') + ')</span>';
  document.getElementById('p11-result-sub').innerHTML = 'Stature ' + chosen.stature_min + '–' + chosen.stature_max + ' cm';
  // Mettre à jour le bouton "Continuer sans taille" → "Voir votre configuration"
  const _nextLbl = document.getElementById('p11-next-label');
  if (_nextLbl && p11CurrentStep === 4) _nextLbl.textContent = v2Parcours === 'standard_evo' ? 'Mes personnalisations' : 'Ma configuration';
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
    // plateaux/cassette : choisis désormais directement sur la page Composants (étape 2)
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

  // Section pneu, débattement fourche, plateaux/cassette et largeur selle :
  // choisis désormais directement sur la page Composants (étape 2)

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

  const P11_SEC = [];
  const p11Primary   = fields.filter(f => !P11_SEC.includes(f.key));
  const p11Secondary = fields.filter(f =>  P11_SEC.includes(f.key));

  function p11RenderField(f) {
    if (f.options.length === 1) selSize[f.key] = String(f.options[0]);
    const optHTML = f.options.map(o =>
      '<option value="' + o + '"' + (selSize[f.key]==o?' selected':'') + '>' + o +
      (['manivelle','potence'].includes(f.key) ? ' mm' : '') + '</option>'
    ).join('');
    const onchangeFn = f.key === 'taille'
      ? "selSize['" + f.key + "']=this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; p11BuildDimsGrid();"
      : "selSize['" + f.key + "']=this.value";
    return '<div class="dim-field"><label>' + f.label + '</label>' +
      '<select class="size-select" id="' + f.id + '" onchange="' + onchangeFn + '">' +
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
      if (nextLbl && p11CurrentStep === 4) nextLbl.textContent = v2Parcours === 'standard_evo' ? 'Mes personnalisations' : 'Ma configuration';
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
  const {price: bikePrice, weight} = computeTotals(selModel, selOpts);
  const { surcharge: oodSurcharge, isMin: priceIsMin } = computeOodSurcharge();
  const price = bikePrice + oodSurcharge;
  const photoP11 = (window._kitCadre && KIT_CADRE_PHOTOS[model.id]) ? KIT_CADRE_PHOTOS[model.id] : model.photo;
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',potence:'ti-adjustments-horizontal',cintre:'ti-arrows-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise',fourche_kit:'ti-git-fork',potence_kit:'ti-adjustments-horizontal',cintre_kit:'ti-arrows-horizontal',tige_kit:'ti-arrows-vertical'};
  let html = '<div style="margin-bottom:1rem;padding:1rem;background:#111;border:0.5px solid #222;display:flex;align-items:center;gap:12px;">' +
    (photoP11 ? '<img src="' + photoP11 + '" alt="' + model.name + '" style="width:80px;height:54px;object-fit:cover;flex-shrink:0;border:0.5px solid #333;">' : '') +
    '<div style="flex:1;min-width:0;">' +
      '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">' + model.badge + '</div>' +
      '<div style="font-size:15px;font-weight:600;color:#f2f2f2;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + model.name + '</div>' +
      '<div style="font-size:20px;font-weight:700;color:#F5C400;">' + (priceIsMin?'Dès ':'') + price.toLocaleString('fr-FR') + ' €</div>' +
      (oodSurcharge > 0 ? '<div style="font-size:11px;color:#888;margin-top:2px;">Vélo '+bikePrice.toLocaleString('fr-FR')+' € + '+(v2Parcours==='sur_mesure'?'Performance':v2Parcours==='hors_gamme'?'Titanium':'Évolution')+' '+(priceIsMin?'dès ':'')+oodSurcharge.toLocaleString('fr-FR')+' €</div>' : '') +
    '</div>' +
    '</div>';
  activePostMeta().forEach(p => {
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
  html += p11RecapBlock();
  el.innerHTML = html;
  // Pré-remplir le modal devis
  syncSelSize();
}

// Bloc détail du parcours OOD pour le récap mobile — miroir de v2RecapBlock() desktop
function p11RecapBlock() {
  if (v2Parcours === 'standard') {
    // Même correctif que v2RecapBlock() (desktop) — "standard_evo" n'est en pratique
    // jamais vrai, se fier à ça masquait inserts/gravure pour la quasi-totalité des
    // visiteurs. On se base désormais sur la présence réelle de données.
    const hasEvo = (typeof evoChecked !== 'undefined' && Object.values(evoChecked).some(v => v)) || (typeof evoCustomText !== 'undefined' && evoCustomText);
    return hasEvo ? v2EvoRecapBlockHtml('Personnalisation du cadre', true) : '';
  }

  if (v2Parcours === 'standard_evo') {
    return v2EvoRecapBlockHtml('Options Évolution', true);
  }

  if (v2Parcours === 'sur_mesure') {
    const msg = window._v2Message || '';
    const fileInput = document.getElementById('p11-mesure-file');
    const fileName = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Cadre sur mesure — Niveau Performance</div>' +
      (msg ? '<div style="font-size:13px;color:#f2f2f2;line-height:1.6;white-space:pre-wrap;">' + msg.replace(/</g,'&lt;') + '</div>' : '<div style="font-size:13px;color:#888;font-style:italic;">Aucune description fournie.</div>') +
      (fileName ? '<div style="font-size:12px;color:#F5C400;margin-top:8px;"><i class="ti ti-paperclip"></i> ' + fileName.replace(/</g,'&lt;') + '</div>' : '') +
    '</div>' + v2EvoRecapBlockHtml('Options Évolution incluses', false);
  }

  if (v2Parcours === 'hors_gamme') {
    const msg = window._v2Message || '';
    const fileInput = document.getElementById('p11-horsgamme-file');
    const fileName = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : '';
    return '<div style="margin-top:1rem;padding:1rem;background:#1e1e1e;border:0.5px solid #333;">' +
      '<div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Projet spécifique — Niveau Titanium</div>' +
      (msg ? '<div style="font-size:13px;color:#f2f2f2;line-height:1.6;white-space:pre-wrap;">' + msg.replace(/</g,'&lt;') + '</div>' : '<div style="font-size:13px;color:#888;font-style:italic;">Aucune description fournie.</div>') +
      (fileName ? '<div style="font-size:12px;color:#F5C400;margin-top:8px;"><i class="ti ti-paperclip"></i> ' + fileName.replace(/</g,'&lt;') + '</div>' : '') +
    '</div>';
  }

  return '';
}


// Sauvegarde rapide depuis le bandeau


// ─── BANDEAU FIXE ONGLET 4 ────────────────────────────────────────
let _step4Observer = null;
function p11InitStep4Bar() {
  const barS4 = document.getElementById('p11-bar-s4');
  if (!barS4) return;
  // Mettre à jour le prix dans le bandeau
  if (selModel) {
    const {price: bikePriceBar} = computeTotals(selModel, selOpts);
    const { surcharge: oodSurchargeBar } = computeOodSurcharge();
    const price = bikePriceBar + oodSurchargeBar;
    const s4price = document.getElementById('p11-s4-price');
    if (s4price) s4price.textContent = (v2Parcours === 'hors_gamme' ? 'Dès ' : '') + price.toLocaleString('fr-FR') + ' €';
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
  selModel = null; selOpts = {}; selSize = {}; selSizeSource = {}; window.sizeValidated = false;
  openPost = null; p11SizeMode = null; p11OverlapTailles = null;
  window._activePreset = null; window._kitCadre = false;
  v2Parcours = 'standard'; evoChecked = {}; evoInsertsChecked = {}; evoOrder = [];
  evoGravureText = ''; evoCustomText = ''; window._v2Message = '';
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
    if (dx < 0) p11Next();
    else if (dx > 0) p11Back();
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
    dtInitHistory();
  }
}

// ─── HISTORIQUE NAVIGATEUR DESKTOP (bouton/flèche retour du navigateur) ────────
let dtHistoryReady = false;
let dtSkipPush = false;
let dtLastPushedStep = 1;

let dtHistDepth = 0;

function dtInitHistory() {
  if (dtHistoryReady) return;
  dtHistoryReady = true;
  dtLastPushedStep = dtStep;
  dtHistDepth = 0;
  history.replaceState({ dtHist: true, depth: 0 }, '', location.href);
  window.addEventListener('popstate', function(e) {
    if (window.innerWidth < 768) return;
    const newDepth = (e.state && typeof e.state.depth === 'number') ? e.state.depth : 0;
    if (newDepth >= dtHistDepth) {
      // Tentative d'avancer dans l'historique — action désactivée, on reste sur place
      history.pushState({ dtHist: true, depth: dtHistDepth }, '', location.href);
      return;
    }
    dtSkipPush = true;
    dtSmartBack();
    dtLastPushedStep = dtStep;
    dtHistDepth = newDepth;
    dtSkipPush = false;
  });
}

function dtPushHistory() {
  if (window.innerWidth < 768 || !dtHistoryReady || dtSkipPush) return;
  if (dtStep === dtLastPushedStep) return;
  dtLastPushedStep = dtStep;
  dtHistDepth++;
  history.pushState({ dtHist: true, depth: dtHistDepth }, '', location.href);
}

// Reproduit exactement l'action du bouton "Retour" déjà affiché à l'écran pour l'étape courante
function dtSmartBack() {
  if (dtStep === 1) return;
  if (dtStep === 2) { dtGo(1); return; }
  if (dtStep === 3) { dtGo(2); return; }
  if (dtStep === 4) {
    if (v2Parcours === 'sur_mesure' || v2Parcours === 'hors_gamme') v2BackFromMesureOrHorsGamme();
    else v2BackFromTaille();
    return;
  }
  if (dtStep === 5) { v2GoBackToTailleEvo(); return; }
  if (dtStep === 6) { v2BackFromDevis(); return; }
}

// Enveloppe les fonctions de navigation existantes pour pousser une entrée d'historique
// après chaque transition réussie, sans jamais modifier leur comportement d'origine.
['dtGo','v2NextFromTaille','v2GoDevis','v2BackFromTaille','v2BackFromMesureOrHorsGamme','v2BackFromDevis','v2GoBackToTailleEvo'].forEach(function(fnName) {
  const orig = window[fnName];
  if (typeof orig !== 'function') return;
  window[fnName] = function() {
    const result = orig.apply(this, arguments);
    dtPushHistory();
    return result;
  };
});
// v2ChooseParcours change dtStep de façon asynchrone (setTimeout 150ms) — on attend un peu plus
const _origChooseParcours = window.v2ChooseParcours;
if (typeof _origChooseParcours === 'function') {
  window.v2ChooseParcours = function() {
    const result = _origChooseParcours.apply(this, arguments);
    setTimeout(dtPushHistory, 200);
    return result;
  };
}

// Appel immédiat ET sur DOMContentLoaded pour être sûr
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', p11TryInit);
  document.addEventListener('DOMContentLoaded', v3InitTitaniumSticky);
  document.addEventListener('DOMContentLoaded', v3InitTitaniumStickyMobile);
} else {
  p11TryInit();
  v3InitTitaniumSticky();
  v3InitTitaniumStickyMobile();
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