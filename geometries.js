// data/geometries.js
// Tables de tailles de cadre par modèle

const TAILLES_CADRE = {
  "route": [
    {
      "taille": "XXS",
      "stature_min": 155,
      "stature_max": 164,
      "ej_min": 73.9,
      "ej_max": 78.4
    },
    {
      "taille": "XS",
      "stature_min": 163,
      "stature_max": 171,
      "ej_min": 77.3,
      "ej_max": 81.8
    },
    {
      "taille": "S",
      "stature_min": 170,
      "stature_max": 177,
      "ej_min": 80.7,
      "ej_max": 85.2
    },
    {
      "taille": "M",
      "stature_min": 176,
      "stature_max": 182,
      "ej_min": 84.1,
      "ej_max": 88.6
    },
    {
      "taille": "L",
      "stature_min": 181,
      "stature_max": 187,
      "ej_min": 87.5,
      "ej_max": 92.0
    },
    {
      "taille": "XL",
      "stature_min": 186,
      "stature_max": 194,
      "ej_min": 90.9,
      "ej_max": 95.5
    }
  ],
  "gravel_racing": [
    {
      "taille": "XS",
      "stature_min": 160,
      "stature_max": 168,
      "ej_min": 76.3,
      "ej_max": 80.9
    },
    {
      "taille": "S",
      "stature_min": 166,
      "stature_max": 174,
      "ej_min": 79.7,
      "ej_max": 84.3
    },
    {
      "taille": "M",
      "stature_min": 172,
      "stature_max": 180,
      "ej_min": 83.1,
      "ej_max": 87.7
    },
    {
      "taille": "L",
      "stature_min": 178,
      "stature_max": 186,
      "ej_min": 86.6,
      "ej_max": 91.1
    },
    {
      "taille": "XL",
      "stature_min": 184,
      "stature_max": 194,
      "ej_min": 90.0,
      "ej_max": 94.5
    }
  ],
  "gravel_bikepacking": [
    {
      "taille": "XS",
      "stature_min": 160,
      "stature_max": 168,
      "ej_min": 75.3,
      "ej_max": 79.9
    },
    {
      "taille": "S",
      "stature_min": 166,
      "stature_max": 174,
      "ej_min": 78.8,
      "ej_max": 83.3
    },
    {
      "taille": "M",
      "stature_min": 172,
      "stature_max": 180,
      "ej_min": 82.2,
      "ej_max": 86.8
    },
    {
      "taille": "L",
      "stature_min": 178,
      "stature_max": 186,
      "ej_min": 85.6,
      "ej_max": 90.2
    },
    {
      "taille": "XL",
      "stature_min": 184,
      "stature_max": 194,
      "ej_min": 89.0,
      "ej_max": 93.6
    }
  ],
  "vtt_enduro": [
    {
      "taille": "S",
      "stature_min": 164,
      "stature_max": 172,
      "ej_min": 77.2,
      "ej_max": 83.9
    },
    {
      "taille": "M",
      "stature_min": 170,
      "stature_max": 178,
      "ej_min": 83.2,
      "ej_max": 89.0
    },
    {
      "taille": "L",
      "stature_min": 176,
      "stature_max": 184,
      "ej_min": 87.8,
      "ej_max": 93.5
    },
    {
      "taille": "XL",
      "stature_min": 182,
      "stature_max": 192,
      "ej_min": 92.4,
      "ej_max": 98.1
    }
  ]
}

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
    if (transOpt.dims.plateaux && transOpt.dims.plateaux.length > 1)
      fields.push({id:'dim-plateaux', label:'Plateau(x)', options: transOpt.dims.plateaux, key:'plateaux'});
    if (transOpt.dims.cassette && transOpt.dims.cassette.length > 1)
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
  if (pneuOpt && pneuOpt.dims && pneuOpt.dims.section && pneuOpt.dims.section.length > 1)
    fields.push({id:'dim-section', label:'Section pneu', options: pneuOpt.dims.section, key:'section',
      note: selModel === 'vtt_enduro' ? 'en pouces' : null,
      unit: selModel === 'vtt_enduro' ? '"' : null});

  // Fourche VTT
  const fourcheOpt = selOpts.fourche ? ALL_OPTIONS.fourche.find(o => o.id === selOpts.fourche) : null;
  if (fourcheOpt && fourcheOpt.dims && fourcheOpt.dims.debattement && fourcheOpt.dims.debattement.length > 1)
    fields.push({id:'dim-debattement', label:'Débattement fourche (mm)', options: fourcheOpt.dims.debattement, key:'debattement'});

  // Selle
  const selleOpt = selOpts.selle ? ALL_OPTIONS.selle.find(o => o.id === selOpts.selle) : null;
  if (selleOpt && selleOpt.dims && selleOpt.dims.largeur_selle && selleOpt.dims.largeur_selle.length > 1)
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

  const SECONDARY_KEYS = ['plateaux', 'cassette', 'section', 'debattement'];
  const primaryFields   = fields.filter(f => !SECONDARY_KEYS.includes(f.key));
  const secondaryFields = fields.filter(f =>  SECONDARY_KEYS.includes(f.key));

  function renderField(f) {
    if (f.options.length === 1) {
      selSize[f.key] = String(f.options[0]);
      const unit = ['manivelle','potence','cintre','debattement','largeur_selle'].includes(f.key) ? ' mm' : '';
      return `<div class="dim-field">
        <label>${f.label}</label>
        <div class="dim-single">${f.options[0]}${unit}</div>
        ${f.note ? `<span class="dim-note">${f.note}</span>` : ''}
      </div>`;
    }
    const optHTML = f.options.map(o =>
      `<option value="${o}" ${selSize[f.key]==o?'selected':''}>${o}${f.key==='manivelle'||f.key==='potence'?' mm':''}</option>`
    ).join('');
    const onchangeFn = f.key === 'taille'
      ? `selSize['${f.key}']=this.value; selSize.manivelle=null; selSize.cintre=null; selSize.potence=null; selSize.debattement=null; buildDimsGrid();`
      : `selSize['${f.key}']=this.value`;
    return `<div class="dim-field">
      <label>${f.label}</label>
      <select class="size-select" id="${f.id}" onchange="${onchangeFn}">
        <option value="">— choisir —</option>
        ${optHTML}
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
        secondaryFields.map(f => {
          const optHTML = f.options.map(o =>
            `<option value="${o}" ${selSize[f.key]==o?'selected':''}>${o}</option>`
          ).join('');
          return `<div class="dim-field">
            <label>${f.label}</label>
            <select class="size-select" id="guide-${f.id}" onchange="selSize['${f.key}']=this.value">
              <option value="">— choisir —</option>${optHTML}
            </select>
            ${f.note ? `<span class="dim-note" style="font-size:11px;color:var(--text3);margin-top:3px;display:block;">${f.note}</span>` : ''}
          </div>`;
        }).join('') + '</div>';
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

