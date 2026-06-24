// data/modeles.js
// Modèles, préconfigurations, descriptions

const MODELS = [
  { id: 'route',              name: 'ON/',        badge: 'Route',          desc: 'Cadre titane, fourche carbone, sportif et polyvalent. Transmission électronique.',                                  basePrice: 5490, assembly: 300, photo: 'https://www.obviouscycles.com/wp-content/uploads/2025/05/on-da-1-mifi-655x460.jpg?m=1747931996' },
  { id: 'gravel_racing',      name: 'ON/OFF',     badge: 'Gravel Racing',  desc: 'Cadre titane, géométrie sport, fourche carbone, intégration complète',                 basePrice: 4450, assembly: 300, photo: 'https://www.obviouscycles.com/wp-content/uploads/2024/03/onoff-2024-6-655x427.webp?m=1711027780' },
  { id: 'gravel_bikepacking', name: 'OUT/QUEST',  badge: 'Gravel Aventure',desc: "Cadre titane, géométrie confort / longue distance, nombreux points d'accroche",         basePrice: 4390, assembly: 300, photo: 'https://www.obviouscycles.com/wp-content/uploads/2024/11/outquest-1-655x450.webp?m=1730756293' },
  { id: 'vtt_enduro',         name: '/OFF',        badge: 'Enduro HT',      desc: 'Cadre titane semi-rigide, géométrie enduro, fourche 140/150 mm, boost 148 mm',          basePrice: 5090, assembly: 300, photo: 'https://www.obviouscycles.com/wp-content/uploads/2024/12/off-x0-1-1-655x404.webp?m=1733503243' },
];


const PRESETS = {
  'gravel_racing': {
    'Ti2':       {fourche:'fourche_gr_car_00',roues:'roue_gr_fu_soa',pneus:'pneu_gr_sc_r',transmission:'trans_gr_sh_611',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_gr_suz_alu',selle:'selle_rd_ant_r5',tige:'tige_rd_ob_car',pedales:'ped_no'},
    'Ti1':       {fourche:'fourche_gr_car_00',roues:'roue_gr_ob_35',pneus:'pneu_gr_sc_r',transmission:'trans_gr_sr_fo',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_gr_suz_alu',selle:'selle_rd_ant_r3',tige:'tige_rd_ob_car',pedales:'ped_no'},
    'Signature': {fourche:'fourche_gr_car_00',roues:'roue_gr_ob_35',pneus:'pneu_gr_sc_r',transmission:'trans_gr_sr_re',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_gr_suz_car',selle:'selle_rd_arg_r00',tige:'tige_rd_ob_car',pedales:'ped_no'},
  },
  'gravel_bikepacking': {
    'Ti2':       {fourche:'fourche_gr_car_ins',roues:'roue_gr_fu_soa',pneus:'pneu_gr_sc_r',transmission:'trans_gr_sh_cud',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_gr_drp_alu',selle:'selle_gr_arg_x5',tige:'tige_rd_ob_car',pedales:'ped_no'},
    'Ti1':       {fourche:'fourche_gr_car_ins',roues:'roue_gr_dt_g16',pneus:'pneu_gr_sc_r',transmission:'trans_gr_sh_821',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_gr_ger_alu',selle:'selle_gr_arg_x3',tige:'tige_rd_ob_ti',pedales:'ped_no'},
    'Signature': {fourche:'fourche_gr_car_ins',roues:'roue_gr_ob_35',pneus:'pneu_gr_sc_r',transmission:'trans_gr_ca_re',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_gr_ger_alu',selle:'selle_br_b17_ho',tige:'tige_rd_ob_ti',pedales:'ped_no'},
  },
  'route': {
    'Ti2':       {fourche:'fourche_rd_car_00',roues:'roue_rd_dt_p16',pneus:'pneu_rd_co_gp',transmission:'trans_rd_sh_105',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_rd_suz_alu',selle:'selle_rd_ant_r5',tige:'tige_rd_ob_car',pedales:'ped_no'},
    'Ti1':       {fourche:'fourche_rd_car_00',roues:'roue_rd_ob_35',pneus:'pneu_rd_co_gp',transmission:'trans_rd_sr_fo',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_rd_suz_alu',selle:'selle_rd_ant_r3',tige:'tige_rd_ob_car',pedales:'ped_no'},
    'Signature': {fourche:'fourche_rd_car_00',roues:'roue_rd_fu_w57',pneus:'pneu_rd_co_gp',transmission:'trans_rd_sh_da',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_rd_ala',selle:'selle_rd_ari_r00',tige:'tige_rd_ob_car',pedales:'ped_no'},
  },
  'vtt_enduro': {
    'Ti2':       {fourche:'fourche_vtt_rs_lyr_sel_150',roues:'roue_vtt_fu_rm5',pneus:'pneu_vtt_sc_gra',transmission:'trans_vtt_sh_slx',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_vtt_end',selle:'selle_vtt_alpt_x5',tige:'tige_vtt_ou_tel',pedales:'ped_no'},
    'Ti1':       {fourche:'fourche_vtt_rs_lyr_ult_150',roues:'roue_vtt_hp_f30',pneus:'pneu_vtt_sc_gra',transmission:'trans_vtt_sh_xt',power:'pwr_all',frein:'frein_all',pilotage:'pilotage_vtt_end',selle:'selle_vtt_alpt_x5',tige:'tige_vtt_ou_tel',pedales:'ped_no'},
    'Signature': {fourche:'fourche_vtt_fox_fac_36_150',roues:'roue_vtt_ob_30',pneus:'pneu_vtt_sc_gra',transmission:'trans_vtt_sr_x0',power:'pwr_all',frein:'frein_vtt_sr_mvs',pilotage:'pilotage_vtt_end',selle:'selle_vtt_alpt_x5',tige:'tige_vtt_ou_tel',pedales:'ped_no'},
  },
};

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

const PRESET_DESCS_DT = {
  'Signature': 'Le haut de gamme — composants premium, chaque détail soigné.',
  'Ti1':       'Le meilleur équilibre performance / prix de la gamme.',
  'Ti2':       'Point de départ idéal — composants fiables, budget maîtrisé.'
};
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
  document.body.classList.toggle('dt-step-4', n === 4);
  dtRender();
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
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('dts-' + i);
    const d = document.getElementById('dts-dot-' + i);
    if (!s || !d) continue;
    s.className = 'dts-step' + (i === n ? ' active' : i < n ? ' done' : '');
    d.innerHTML = i < n ? '<i class="ti ti-check" style="font-size:9px;"></i>' : i === 4 ? '→' : String(i);
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
  const next3lbl = el('dt-next-3-lbl');
  if (next3lbl) next3lbl.textContent = window.sizeValidated ? 'Voir votre récap' : 'Continuer sans taille';

  // Bouton "changer de vélo" dans le récap — visible après reset


  // Rendu spécifique
  if (n === 1) dtRenderS1();
  if (n === 2) dtRenderS2();
  if (n === 3) { dtRenderS3(); setTimeout(() => dtToggleSizeMode('guide'), 50); }
  if (n === 4) dtRenderS4();

  // Récap droit (pas à l'étape 4)
  if (n !== 4) dtRenderRecap();

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
      '<div class="preset-label" style="margin-bottom:0;">3 suggestions pour démarrer</div>' +
      '<button onclick="toggleDtPresetInfo(\'' + infoPopupId + '\')" style="background:none;border:none;color:#888;font-size:15px;cursor:pointer;padding:0;line-height:1;" title="En savoir plus"><i class="ti ti-info-circle"></i></button>' +
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
  const inner = document.getElementById('dt-s4-inner');
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
  // Lire le résultat depuis les divs originaux
  const guideResult  = document.getElementById('guide-result');
  const dimsResult   = document.getElementById('dims-summary');
  const resultEl = document.getElementById('dt-s3-result');
  if (!resultEl) return;

  let html = '';
  // Guide result
  if (guideResult && guideResult.classList.contains('show')) {
    const main = document.getElementById('guide-result-main');
    const sub  = document.getElementById('guide-result-sub');
    if (main && main.textContent) {
      html = '✅ ' + main.innerHTML + (sub ? '<br><span style="font-size:12px;color:#aaa;">' + sub.innerHTML + '</span>' : '');
      window.sizeValidated = true;
    }
  }
  // Manual result
  if (!html && dimsResult && dimsResult.classList.contains('show')) {
    html = '✅ <strong style="color:#F5C400;">Dimensions enregistrées</strong><br>' + dimsResult.innerHTML;
    window.sizeValidated = true;
  }
  // Build from selSize
  if (!html && window.sizeValidated) {
    const parts = [];
    if (selSize.taille)        parts.push('<strong>Taille :</strong> ' + selSize.taille);
    if (selSize.manivelle)     parts.push('<strong>Manivelle :</strong> ' + selSize.manivelle + ' mm');
    if (selSize.potence)       parts.push('<strong>Potence :</strong> ' + selSize.potence + ' mm');
    if (selSize.cintre)        parts.push('<strong>Cintre :</strong> ' + selSize.cintre + ' mm');
    if (parts.length) html = '✅ <strong style="color:#F5C400;">Dimensions</strong> : ' + parts.join(' · ');
  }

  if (html) {
    // dt-s3-result retiré — on met juste à jour le bouton
    const lbl = document.getElementById('dt-next-3-lbl');
    if (lbl) lbl.textContent = 'Votre configuration →';
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
  const lbl = document.getElementById('dt-next-3-lbl');
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
  const inner = document.getElementById('dt-s4-inner');
  if (!inner || !selModel) return;
  const model = MODELS.find(m => m.id === selModel);
  const { price } = computeTotals(selModel, selOpts);
  const preset = (window._activePreset && PRESETS[selModel]) ? PRESETS[selModel][window._activePreset] : {};
  const icons = {fourche:'ti-git-fork',roues:'ti-circle',pneus:'ti-circle-dotted',transmission:'ti-settings',power:'ti-activity',frein:'ti-hand-stop',pilotage:'ti-adjustments-horizontal',selle:'ti-armchair',tige:'ti-arrows-vertical',pedales:'ti-rotate-clockwise'};
  const mc = dtModifCount();

  inner.innerHTML =
    '<div style="display:grid;grid-template-columns:280px 1fr;gap:2rem;align-items:start;">' +
      // Colonne gauche : photo + infos
      '<div>' +
        (model.photo ? '<img src="'+model.photo+'" style="width:100%;height:180px;object-fit:cover;display:block;border:0.5px solid #222;margin-bottom:1rem;">' : '') +
        '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">'+model.badge+'</div>' +
        '<div style="font-size:20px;font-weight:500;color:#f2f2f2;margin-bottom:4px;">'+model.name+'</div>' +
        (window._activePreset ? '<div style="font-size:11px;color:#666;margin-bottom:.75rem;">'+window._activePreset+'</div>' : '<div style="min-height:1.4em;"></div>') +
        '<div style="font-size:28px;font-weight:700;color:#F5C400;margin-bottom:.5rem;">'+price.toLocaleString('fr-FR')+' €</div>' +
        (mc > 0 ? '<div style="font-size:13px;color:#F5C400;display:flex;align-items:center;gap:6px;margin-bottom:1rem;font-weight:500;"><span style="width:7px;height:7px;border-radius:50%;background:#F5C400;display:inline-block;flex-shrink:0;"></span>'+mc+' personnalisation'+(mc>1?'s':'')+' · '+window._activePreset+'</div>' : '') +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:1rem;">' +
          '<button class="dtr-btn-main" onclick="openOrderModal()"><i class="ti ti-send"></i> Recevoir mon étude personnalisée</button>' +
          '<button class="dtr-btn-sec" onclick="dtQuickSave()"><i class="ti ti-bookmark"></i> Sauvegarder</button>' +
          '<button class="dtr-btn-sec" onclick="dtReset()"><i class="ti ti-refresh"></i> Nouvelle configuration</button>' +
        '</div>' +
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
        '<div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Dimensions</div>' +
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
    '';
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

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadSaved();
renderModels();
dtInit();

// Présélection via paramètre URL (?modele=ON/OFF&roues=roue_gr_ob_35...)
const ALIASES = {
  'ON/':       'route',
  'ON/OFF':    'gravel_racing',
  'OUT/QUEST': 'gravel_bikepacking',
  '/OFF':      'vtt_enduro',
};

const urlParams = new URLSearchParams(window.location.search);
const modeleParam = urlParams.get('modele');
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

const PRESET_DESCS = {
  'Ti2':       'Point de départ idéal — composants fiables, budget maîtrisé.',
  'Ti1':       'Le meilleur équilibre performance / prix de la gamme.',
  'Signature': 'Le haut de gamme — composants haut de gamme, chaque détail compté.'
};
