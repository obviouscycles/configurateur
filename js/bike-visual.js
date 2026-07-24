// js/bike-visual.js — OB_CONFIG_V3 (v2 — silhouettes fidèles aux vraies pièces)
// Moteur d'illustration du vélo, piloté par les vraies données de /data/composants.js et /data/modeles.js.
// Ne duplique aucune donnée catalogue : lit ALL_OPTIONS / MODELS déjà chargés en global,
// et DÉRIVE le style visuel (matière, silhouette, options) depuis les id/name/desc/dims réels,
// plutôt que de maintenir une liste manuelle par référence produit (dizaines d'entrées, illisible à tenir à jour).
//
// v2 : les formes (fourche, cintre, selle, plateau, cassette, étrier, pédale) sont redessinées
// pour suivre l'anatomie réelle de chaque famille de pièce (proportions, courbes, articulations),
// et non plus des primitives génériques (lignes/cercles).

const BikeVisual = (function () {

  // ── Géométrie par modèle (schématique, cohérente avec TAILLES_CADRE / les 4 silhouettes réelles) ──
  const GEO = {
    route:              { wheelR:70, rearX:150, frontX:610, axleY:262, bbX:238, bbY:256, seatX:256, seatTopY:88,  headX:520, headTopY:118, stemLen:48, label:'ON/ — Route' },
    gravel_racing:       { wheelR:75, rearX:146, frontX:604, axleY:258, bbX:234, bbY:252, seatX:252, seatTopY:98,  headX:508, headTopY:130, stemLen:46, label:'ON/OFF — Gravel Racing' },
    gravel_bikepacking:  { wheelR:80, rearX:142, frontX:596, axleY:252, bbX:230, bbY:246, seatX:248, seatTopY:112, headX:496, headTopY:145, stemLen:44, rack:true, label:'OUT/QUEST — Gravel Aventure' },
    vtt_enduro:          { wheelR:92, rearX:138, frontX:582, axleY:240, bbX:224, bbY:234, seatX:238, seatTopY:132, headX:470, headTopY:168, stemLen:36, suspension:true, label:'/OFF — Enduro HT' }
  };

  // ── Dérivation du "type visuel" à partir des vraies données catalogue ──────────────
  function low(s){ return (s || '').toLowerCase(); }

  function visFourche(opt) {
    if (!opt) return { type:'rigide_carbone' };
    if (opt.dims && opt.dims.debattement) {
      const travels = opt.dims.debattement;
      return { type:'suspendue', travel: travels[travels.length - 1], brand: brandOf(opt.id) };
    }
    return { type: opt.id.includes('_ins') ? 'rigide_carbone_inserts' : 'rigide_carbone' };
  }

  function brandOf(id) {
    if (/_sh_/.test(id)) return 'shimano';
    if (/_sr_/.test(id)) return 'sram';
    if (/_ca_/.test(id)) return 'campagnolo';
    if (/_rs_/.test(id)) return 'rockshox';
    if (/_fox_/.test(id)) return 'fox';
    if (/_hp_/.test(id)) return 'hope';
    if (/_lk_/.test(id)) return 'look';
    if (/_ob_/.test(id)) return 'obvious';
    return null;
  }

  function visRoues(opt) {
    if (!opt) return { material:'alu', depth:'standard' };
    const carbone = /carbone/.test(low(opt.desc)) || /_ob_/.test(opt.id);
    const deep = /profil haut|aéro|aero/.test(low(opt.desc)) || carbone;
    return { material: carbone ? 'carbone' : 'alu', depth: deep ? 'aero' : 'standard' };
  }

  function visPneu(opt, modelId) {
    let widthMm = 32, label = '';
    if (opt && opt.dims && opt.dims.section) {
      const vals = opt.dims.section;
      const last = vals[vals.length - 1];
      const num = parseFloat(String(last));
      widthMm = /pouce/.test(String(last)) ? num * 25 : (num || 32);
      label = String(last);
    }
    const tread = modelId === 'vtt_enduro' ? 'crampons' : modelId === 'route' ? 'slick' : 'gravel';
    return { widthMm, label, tread };
  }

  function visTransmission(opt) {
    if (!opt) return { rings:1, brand:null, wireless:false };
    const plateaux = (opt.dims && opt.dims.plateaux) || [];
    const is2x = plateaux.some(p => String(p).includes('x'));
    const wireless = /axs|di2/i.test(opt.name || '');
    return { rings: is2x ? 2 : 1, brand: brandOf(opt.id), wireless };
  }

  function visFrein(opt) {
    if (!opt || opt.id === 'frein_all') return { pistons:2, rotor:'standard', brand:null };
    return { pistons:4, rotor:'large', brand: brandOf(opt.id) };
  }

  function visPilotage(opt) {
    if (!opt) return { bar:'drop', material:'alu' };
    const flat = /flat|plat/.test(low(opt.name) + low(opt.id));
    const carbone = /car/.test(opt.id.split('_').slice(-1)[0]) || /carbone/.test(low(opt.desc));
    const flareMatch = (opt.desc || '').match(/flare\s*(\d+)/i);
    return { bar: flat ? 'flat' : 'drop', material: carbone ? 'carbone' : 'alu', flare: flareMatch ? Number(flareMatch[1]) : 0 };
  }

  function visSelle(opt) {
    if (!opt) return { style:'standard' };
    if (/^selle_br_|^selle_ber_/.test(opt.id)) return { style:'cuir' };
    if (/arg/.test(opt.id)) return { style:'courte' };
    if (/bek_lup/.test(opt.id)) return { style:'ultralight' };
    return { style:'standard' };
  }

  function visTige(opt) {
    if (!opt) return { dropper:false, material:'alu' };
    const dropper = /tel/.test(opt.id) || /télescop|dropper/i.test(opt.desc || '');
    const material = opt.id.includes('_ti') ? 'titane' : opt.id.includes('_car') ? 'carbone' : 'alu';
    return { dropper, material };
  }

  function visPedales(opt) {
    if (!opt || opt.id === 'ped_no') return { type:'aucune' };
    if (opt.id.startsWith('ped_rd_')) return { type:'route_auto' };
    if (/_on_/.test(opt.id)) return { type:'plate' };
    return { type:'vtt_auto' };
  }

  // ── Defs (matières) ─────────────────────────────────────────────────────
  function svgDefs() {
    return `
    <defs>
      <linearGradient id="bv-titane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eaeaea"/><stop offset="45%" stop-color="#9a9a9a"/><stop offset="100%" stop-color="#5c5c5c"/>
      </linearGradient>
      <linearGradient id="bv-carbone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#333"/><stop offset="50%" stop-color="#0d0d0d"/><stop offset="100%" stop-color="#2b2b2b"/>
      </linearGradient>
      <linearGradient id="bv-alu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#dcdcdc"/><stop offset="100%" stop-color="#8a8a8a"/>
      </linearGradient>
      <linearGradient id="bv-alu-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8a8a8a"/><stop offset="50%" stop-color="#e6e6e6"/><stop offset="100%" stop-color="#8a8a8a"/>
      </linearGradient>
      <radialGradient id="bv-rim-carbone" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#3a3a3a"/><stop offset="100%" stop-color="#0c0c0c"/>
      </radialGradient>
      <radialGradient id="bv-rim-alu" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#eee"/><stop offset="100%" stop-color="#9a9a9a"/>
      </radialGradient>
      <linearGradient id="bv-yellow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#F5C400"/><stop offset="100%" stop-color="#c99e00"/>
      </linearGradient>
      <linearGradient id="bv-leather" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a3702f"/><stop offset="100%" stop-color="#6e4620"/>
      </linearGradient>
      <filter id="bv-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#F5C400" flood-opacity="0.9"/>
      </filter>
    </defs>`;
  }

  // ── Roue : jante + pneu avec bande de roulement selon la pratique ────────
  function buildWheel(cx, cy, r, pneu, roueVis, id) {
    const tireW = 3 + Math.min(pneu.widthMm, 66) / 66 * 9;
    const rimFill = roueVis.material === 'carbone' ? 'url(#bv-rim-carbone)' : 'url(#bv-rim-alu)';
    const rimR = r - tireW - 5;
    const spokeN = roueVis.material === 'carbone' ? 6 : 20;
    const spokeW = roueVis.material === 'carbone' ? 3.5 : 1.1;
    let spokes = '';
    for (let i = 0; i < spokeN; i++) {
      const a = (Math.PI * 2 / spokeN) * i + (roueVis.material === 'carbone' ? 0.25 : 0);
      spokes += `<line stroke="#555" stroke-width="${spokeW}" x1="${cx}" y1="${cy}" x2="${(cx+Math.cos(a)*rimR).toFixed(1)}" y2="${(cy+Math.sin(a)*rimR).toFixed(1)}"/>`;
    }
    let tread = '';
    if (pneu.tread === 'slick') {
      tread = `<circle cx="${cx}" cy="${cy}" r="${r-1}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="0.8"/>`;
    } else if (pneu.tread === 'gravel') {
      const n = 40;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 / n) * i;
        const x1 = cx + Math.cos(a) * (r - 1), y1 = cy + Math.sin(a) * (r - 1);
        const x2 = cx + Math.cos(a) * (r - tireW * 0.55), y2 = cy + Math.sin(a) * (r - tireW * 0.55);
        tread += `<line stroke="#000" stroke-opacity=".3" stroke-width="0.9" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      }
    } else {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 / n) * i;
        const offset = (i % 2 === 0) ? 0 : tireW * 0.35;
        const bx = cx + Math.cos(a) * (r - 2 - offset), by = cy + Math.sin(a) * (r - 2 - offset);
        tread += `<rect x="${(bx-1.6).toFixed(1)}" y="${(by-1.6).toFixed(1)}" width="3.2" height="3.2" fill="#000" fill-opacity=".4" transform="rotate(${(a*180/Math.PI).toFixed(0)} ${bx.toFixed(1)} ${by.toFixed(1)})"/>`;
      }
    }
    const rimDepthRing = roueVis.depth === 'aero'
      ? `<circle cx="${cx}" cy="${cy}" r="${rimR - 6}" fill="none" stroke="#F5C400" stroke-opacity=".18" stroke-width="4"/>`
      : '';
    return `
      <g data-grp="roues" class="bv-group">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#151515" stroke="#000" stroke-width="${tireW}"/>
        ${tread}
        <circle cx="${cx}" cy="${cy}" r="${rimR}" fill="none" stroke="${rimFill}" stroke-width="${roueVis.material==='carbone'?9:4}"/>
        ${rimDepthRing}
        ${spokes}
        <circle cx="${cx}" cy="${cy}" r="6" fill="url(#bv-alu)" stroke="#333" stroke-width="1"/>
        <circle cx="${cx}" cy="${cy}" r="2" fill="#222"/>
      </g>`;
  }

  function buildFrame(m) {
    const seatStayStartY = m.seatTopY + (m.bbY - m.seatTopY) * 0.55;
    const seatStayStartX = m.seatX + (m.bbX - m.seatX) * 0.15;
    const rack = m.rack ? `<line stroke="#666" stroke-width="1.6" stroke-dasharray="2 3" x1="${seatStayStartX-6}" y1="${seatStayStartY-30}" x2="${m.rearX+4}" y2="${m.axleY-m.wheelR-6}"/>` : '';
    const tube = (x1,y1,x2,y2,w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#bv-titane)" stroke-width="${w}" stroke-linecap="round"/>`;
    return `
      <g data-grp="frame" class="bv-group">
        ${tube(m.rearX, m.axleY, m.bbX, m.bbY, 6)}
        ${tube(m.bbX, m.bbY, m.seatX, m.seatTopY, 7)}
        ${tube(m.seatX, m.seatTopY, m.headX, m.headTopY, 6.5)}
        ${tube(m.headX, m.headTopY, m.bbX, m.bbY, 7.5)}
        ${tube(seatStayStartX, seatStayStartY, m.rearX, m.axleY, 4.5)}
        <rect x="${m.headX-4.5}" y="${m.headTopY-6}" width="9" height="18" rx="2" fill="url(#bv-alu)" stroke="#333" stroke-width="0.5"/>
        <circle cx="${m.bbX}" cy="${m.bbY}" r="9" fill="url(#bv-titane)" stroke="#333" stroke-width="0.5"/>
        ${rack}
      </g>`;
  }

  // ── Fourche : couronne + fourreaux, silhouette rigide carbone vs suspendue ──
  function buildFork(m, f) {
    if (f.type === 'suspendue') {
      const joinT = 0.5;
      const jx = m.headX + (m.frontX - m.headX) * joinT;
      const jy = m.headTopY + (m.axleY - m.headTopY) * joinT;
      return `
        <g data-grp="fourche" class="bv-group">
          <rect x="${m.headX-6}" y="${m.headTopY+2}" width="12" height="10" rx="2" fill="url(#bv-alu)" stroke="#333" stroke-width="0.5"/>
          <line x1="${m.headX}" y1="${m.headTopY+10}" x2="${jx}" y2="${jy}" stroke="url(#bv-alu-h)" stroke-width="8.5" stroke-linecap="round"/>
          <line x1="${jx-4}" y1="${jy-2}" x2="${jx+4}" y2="${jy+2}" stroke="#111" stroke-width="10" stroke-linecap="round"/>
          <line x1="${jx}" y1="${jy}" x2="${m.frontX}" y2="${m.axleY}" stroke="url(#bv-carbone)" stroke-width="9" stroke-linecap="round"/>
          <path d="M${m.frontX-18} ${m.axleY-m.wheelR+20} q 18 -8 24 12" fill="none" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>
          <text x="${(m.headX+m.frontX)/2 - 26}" y="${(m.headTopY+m.axleY)/2 - 22}" font-size="10" fill="#999" font-family="inherit">${f.travel} mm</text>
        </g>`;
    }
    const midX = (m.headX + m.frontX) / 2 + 8;
    const midY = (m.headTopY + m.axleY) / 2 - 2;
    const bladeA = `M${m.headX-5} ${m.headTopY+10}
      Q ${midX-6} ${midY} ${m.frontX-3} ${m.axleY-6}
      L ${m.frontX+3} ${m.axleY}
      Q ${midX+3} ${midY+6} ${m.headX+5} ${m.headTopY+14} Z`;
    const insertDots = f.type === 'rigide_carbone_inserts'
      ? `<circle cx="${(m.headX+midX)/2+18}" cy="${(m.headTopY+midY)/2+10}" r="2.2" fill="#F5C400" fill-opacity=".7"/>
         <circle cx="${(m.headX+midX)/2+30}" cy="${(m.headTopY+midY)/2+26}" r="2.2" fill="#F5C400" fill-opacity=".7"/>`
      : '';
    return `
      <g data-grp="fourche" class="bv-group">
        <rect x="${m.headX-7}" y="${m.headTopY+2}" width="14" height="10" rx="2" fill="url(#bv-carbone)"/>
        <path d="${bladeA}" fill="url(#bv-carbone)" stroke="#000" stroke-width="0.6"/>
        <path d="M${m.headX-2} ${m.headTopY+16} Q ${midX-4} ${midY+3} ${m.frontX} ${m.axleY-3}" fill="none" stroke="#3a3a3a" stroke-width="0.8" opacity=".6"/>
        ${insertDots}
      </g>`;
  }

  // ── Poste de pilotage : cintre route (courbe compacte) ou cintre plat VTT ──
  function buildCockpit(m, p) {
    const stemX = m.headX, stemY = m.headTopY - 6;
    const stemColor = p.material === 'carbone' ? 'url(#bv-carbone)' : 'url(#bv-alu)';
    if (p.bar === 'flat') {
      const hx = stemX - m.stemLen;
      const riseY = stemY - 12;
      return `
        <g data-grp="pilotage" class="bv-group">
          <path d="M${stemX} ${stemY+8} L ${hx+8} ${riseY+4} Q ${hx} ${riseY} ${hx-4} ${riseY-2}" fill="none" stroke="${stemColor}" stroke-width="7" stroke-linecap="round"/>
          <line x1="${hx-4}" y1="${riseY-2}" x2="${hx-40}" y2="${riseY-8}" stroke="url(#bv-alu-h)" stroke-width="5.5" stroke-linecap="round"/>
          <rect x="${hx-52}" y="${riseY-11}" width="14" height="6.5" rx="3" fill="#151515"/>
          <rect x="${hx-2}" y="${riseY-6}" width="10" height="9" rx="1.5" fill="#1a1a1a" stroke="#F5C400" stroke-width="0.5"/>
        </g>`;
    }
    const hx = stemX - m.stemLen;
    const flare = (p.flare || 0) * 0.25;
    const barColor = 'url(#bv-alu-h)';
    return `
      <g data-grp="pilotage" class="bv-group">
        <path d="M${stemX} ${stemY+8} L ${hx+4} ${stemY-1}" fill="none" stroke="${stemColor}" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M${hx+4} ${stemY-1}
          q -10 -2 -18 3
          q -6 4 -6 12
          q 8 5 9 -3
          q 1 -6 -3 -8"
          fill="none" stroke="${barColor}" stroke-width="5.5" stroke-linecap="round"/>
        <ellipse cx="${hx-20}" cy="${stemY+3}" rx="7" ry="4.5" fill="#161616" stroke="#333" stroke-width="0.5" transform="rotate(-18 ${hx-20} ${stemY+3})"/>
        <path d="M${hx-24} ${stemY+7}
          q -3 10 3 ${18+flare}
          q 3 6 11 6"
          fill="none" stroke="${barColor}" stroke-width="5" stroke-linecap="round"/>
      </g>`;
  }

  // ── Selle + tige : profil goutte-d'eau réel, rails, ressorts pour le cuir ──
  function buildSaddleAndPost(m, tige, selle) {
    const isDropper = tige.dropper;
    const postColor = tige.material === 'titane' ? 'url(#bv-titane)' : tige.material === 'carbone' ? 'url(#bv-carbone)' : 'url(#bv-alu)';
    const postW = isDropper ? 8.5 : 4.5;
    const postGroup = `
      <g data-grp="tige" class="bv-group">
        <line x1="${m.bbX+2}" y1="${m.bbY-8}" x2="${m.seatX+3}" y2="${m.seatTopY+6}" stroke="${postColor}" stroke-width="${postW}" stroke-linecap="round"/>
        ${isDropper ? `<rect x="${m.seatX-2}" y="${m.seatTopY+16}" width="12" height="9" rx="2" fill="#222" stroke="#F5C400" stroke-width="0.6"/>
          <path d="M${m.seatX+10} ${m.seatTopY+20} q ${(m.headX-m.seatX)*0.4} -6 ${m.headX-m.seatX-6} -${m.seatTopY-m.headTopY+18}" fill="none" stroke="#555" stroke-width="1.4" stroke-dasharray="2 3"/>` : ''}
      </g>`;

    let noseLen, tailLen, tailW, nx;
    if (selle.style === 'cuir') { noseLen = 16; tailLen = 34; tailW = 15; }
    else if (selle.style === 'courte') { noseLen = 10; tailLen = 26; tailW = 12; }
    else if (selle.style === 'ultralight') { noseLen = 13; tailLen = 27; tailW = 10; }
    else { noseLen = 14; tailLen = 32; tailW = 13; }
    nx = m.seatX - noseLen;
    const rearX = m.seatX + tailLen;
    const topY = m.seatTopY - tailW * 0.28;
    const botY = m.seatTopY + tailW * 0.5;
    const saddlePath = `M${nx} ${m.seatTopY - 1}
      Q ${nx+noseLen*0.3} ${topY - 2} ${m.seatX+noseLen*0.6} ${topY}
      Q ${(m.seatX+rearX)/2} ${topY - 3} ${rearX} ${topY + 3}
      Q ${rearX + 4} ${m.seatTopY} ${rearX} ${botY}
      Q ${(m.seatX+rearX)/2} ${botY + 3} ${m.seatX} ${m.seatTopY + 4}
      Q ${nx+noseLen*0.4} ${m.seatTopY + 3} ${nx} ${m.seatTopY - 1} Z`;

    const rails = `<line x1="${nx+3}" y1="${botY-2}" x2="${rearX-4}" y2="${botY-2}" stroke="#888" stroke-width="1.3"/>
      <line x1="${nx+3}" y1="${botY+1}" x2="${rearX-8}" y2="${botY+1}" stroke="#888" stroke-width="1.3"/>`;

    let extra = '', saddleFill;
    if (selle.style === 'cuir') {
      saddleFill = 'url(#bv-leather)';
      extra = `
        <path d="M${rearX-2} ${topY+2} q 4 5 0 9" fill="none" stroke="#4a2f14" stroke-width="1.4"/>
        <path d="M${rearX+1} ${topY+4} q 4 5 0 9" fill="none" stroke="#4a2f14" stroke-width="1.4"/>
        <circle cx="${nx+4}" cy="${m.seatTopY+1}" r="1" fill="#3a2410"/>
        <circle cx="${m.seatX+noseLen*0.6}" cy="${topY+1}" r="1" fill="#3a2410"/>`;
    } else {
      saddleFill = '#141414';
      extra = `<path d="M${nx+noseLen*0.5} ${m.seatTopY-0.5} Q ${(m.seatX+rearX)/2} ${topY-1} ${rearX-6} ${topY+2}" fill="none" stroke="#F5C400" stroke-opacity=".2" stroke-width="1.2"/>`;
    }

    return postGroup + `
      <g data-grp="selle" class="bv-group">
        ${rails}
        <path d="${saddlePath}" fill="${saddleFill}" stroke="#000" stroke-width="0.6"/>
        ${extra}
      </g>`;
  }

  // ── Groupe : plateau(x) denté, cassette conique, chaîne, étrier + disque perforé ──
  function toothedRing(cx, cy, r, teethN, fill) {
    let teeth = '';
    for (let i = 0; i < teethN; i++) {
      const a = (Math.PI * 2 / teethN) * i;
      const a2 = a + (Math.PI * 2 / teethN) * 0.35;
      const x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r;
      const x2 = cx + Math.cos(a2) * (r + 3), y2 = cy + Math.sin(a2) * (r + 3);
      const x3 = cx + Math.cos(a + (Math.PI * 2 / teethN) * 0.7) * r, y3 = cy + Math.sin(a + (Math.PI * 2 / teethN) * 0.7) * r;
      teeth += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} Z" fill="${fill}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fill}" stroke-width="3"/>${teeth}`;
  }

  function buildDrivetrain(m, trans, frein, power) {
    const R1 = 22, R2 = 15;
    const ringFill = trans.brand === 'sram' ? '#1c1c1c' : trans.brand === 'campagnolo' ? '#c9c9c9' : '#9a9a9a';
    let rings = toothedRing(m.bbX, m.bbY, R1, 20, ringFill);
    if (trans.rings === 2) rings += toothedRing(m.bbX, m.bbY, R2, 16, ringFill);

    const cN = trans.rings === 2 ? 8 : 11;
    let cassette = '';
    const baseR = 17;
    for (let i = 0; i < cN; i++) {
      const rr = baseR - i * (baseR - 6) / cN;
      cassette += `<ellipse cx="${m.rearX + i*0.35}" cy="${m.axleY}" rx="1.1" ry="${rr.toFixed(1)}" fill="#b9b9b9" stroke="#777" stroke-width="0.3"/>`;
    }
    const chain = `<path d="M${m.bbX+R1} ${m.bbY} Q ${(m.bbX+m.rearX)/2} ${m.bbY+ (m.axleY-m.bbY)/2 + 10} ${m.rearX+4} ${m.axleY-4}" fill="none" stroke="#222" stroke-width="2.4" stroke-dasharray="1.5 2.2"/>`;
    const pwr = power ? `<circle cx="${m.bbX}" cy="${m.bbY}" r="3.5" fill="url(#bv-yellow)" stroke="#000" stroke-width="0.5"/>` : '';
    const wireless = trans.wireless ? `<circle cx="${m.rearX+13}" cy="${m.axleY-baseR-4}" r="1.8" fill="#F5C400"/>` : '';

    function rotorAndCaliper(cx, cy) {
      const rotorR = frein.rotor === 'large' ? 18 : 12;
      let holes = '';
      const hN = 6;
      for (let i = 0; i < hN; i++) {
        const a = (Math.PI * 2 / hN) * i;
        holes += `<circle cx="${(cx+Math.cos(a)*rotorR*0.6).toFixed(1)}" cy="${(cy+Math.sin(a)*rotorR*0.6).toFixed(1)}" r="1.1" fill="none" stroke="#666" stroke-width="0.6"/>`;
      }
      const caliperW = frein.pistons === 4 ? 13 : 9;
      const caliperH = frein.pistons === 4 ? 9 : 6.5;
      const pistonN = frein.pistons === 4 ? 4 : 2;
      let pistons = '';
      for (let i = 0; i < pistonN; i++) {
        pistons += `<line x1="${cx-caliperW/2+1.5+i*(caliperW-3)/(pistonN-1)}" y1="${cy-caliperH/2+1}" x2="${cx-caliperW/2+1.5+i*(caliperW-3)/(pistonN-1)}" y2="${cy+caliperH/2-1}" stroke="#F5C400" stroke-width="0.7" opacity=".5"/>`;
      }
      return `
        <circle cx="${cx}" cy="${cy}" r="${rotorR}" fill="none" stroke="#8a8a8a" stroke-width="1.6"/>
        <circle cx="${cx}" cy="${cy}" r="${rotorR*0.55}" fill="none" stroke="#666" stroke-width="1"/>
        ${holes}
        <rect x="${cx-caliperW/2}" y="${cy-caliperH/2}" width="${caliperW}" height="${caliperH}" rx="1.5" fill="#161616" stroke="#000" stroke-width="0.5"/>
        ${pistons}`;
    }

    const rotors = rotorAndCaliper(m.rearX, m.axleY) + rotorAndCaliper(m.frontX, m.axleY);

    return `
      <g data-grp="transmission" class="bv-group">${rings}${cassette}${chain}${pwr}${wireless}</g>
      <g data-grp="frein" class="bv-group">${rotors}</g>`;
  }

  // ── Pédales : plate-forme VTT, SPD-SL route (aile asymétrique), SPD compact ──
  function buildPedales(m, ped) {
    const cx1 = m.bbX + 24, cy1 = m.bbY + 8, cx2 = m.bbX - 24, cy2 = m.bbY - 8;
    const crank = (cx, cy) => `<path d="M${m.bbX-2} ${m.bbY-2} L${m.bbX+2} ${m.bbY+2} L${cx+2} ${cy+2} L${cx-2} ${cy-2} Z" fill="url(#bv-alu)" stroke="#333" stroke-width="0.4"/>`;
    if (ped.type === 'aucune') {
      return `<g data-grp="pedales" class="bv-group">${crank(cx1,cy1)}${crank(cx2,cy2)}</g>`;
    }
    let shape;
    if (ped.type === 'plate') {
      shape = (cx, cy) => `<rect x="${cx-12}" y="${cy-4.5}" width="24" height="9" rx="2" fill="#161616" stroke="#F5C400" stroke-width="0.6"/>
        ${[-8,-3,2,7].map(dx=>`<line x1="${cx+dx}" y1="${cy-4.5}" x2="${cx+dx}" y2="${cy+4.5}" stroke="#F5C400" stroke-width="0.7" opacity=".6"/>`).join('')}`;
    } else if (ped.type === 'route_auto') {
      shape = (cx, cy) => `<path d="M${cx-9} ${cy-2.5} Q ${cx} ${cy-6} ${cx+15} ${cy-2} Q ${cx+17} ${cy} ${cx+14} ${cy+2.5} Q ${cx} ${cy+5.5} ${cx-9} ${cy+2.5} Z" fill="#111" stroke="#aaa" stroke-width="0.6"/>
        <rect x="${cx-3}" y="${cy-1.2}" width="9" height="2.4" fill="#d9d9d9"/>`;
    } else {
      shape = (cx, cy) => `<rect x="${cx-8}" y="${cy-3.5}" width="16" height="7" rx="1.5" fill="#111" stroke="#777" stroke-width="0.6"/>
        <line x1="${cx-8}" y1="${cy}" x2="${cx+8}" y2="${cy}" stroke="#555" stroke-width="0.6"/>`;
    }
    return `
      <g data-grp="pedales" class="bv-group">
        ${crank(cx1,cy1)}${crank(cx2,cy2)}
        ${shape(cx1, cy1)}
        ${shape(cx2, cy2)}
      </g>`;
  }

  // ── Rendu principal ─────────────────────────────────────────────────────
  function render(modelId, selOpts) {
    const m = GEO[modelId] || GEO.route;
    const getOpt = (postId) => {
      if (typeof ALL_OPTIONS === 'undefined' || !ALL_OPTIONS[postId]) return null;
      return ALL_OPTIONS[postId].find(o => o.id === selOpts[postId]) || null;
    };

    const fourche = visFourche(getOpt('fourche'));
    const roues = visRoues(getOpt('roues'));
    const pneu = visPneu(getOpt('pneus'), modelId);
    const trans = visTransmission(getOpt('transmission'));
    const frein = visFrein(getOpt('frein'));
    const pilotage = visPilotage(getOpt('pilotage'));
    const selle = visSelle(getOpt('selle'));
    const tige = visTige(getOpt('tige'));
    const pedales = visPedales(getOpt('pedales'));
    const hasPower = !!(selOpts.power && selOpts.power !== 'pwr_all');

    return `
      <svg viewBox="0 0 760 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
        ${svgDefs()}
        ${buildFrame(m)}
        ${buildFork(m, fourche)}
        ${buildWheel(m.rearX, m.axleY, m.wheelR, pneu, roues, 'rear')}
        ${buildWheel(m.frontX, m.axleY, m.wheelR, pneu, roues, 'front')}
        ${buildDrivetrain(m, trans, frein, hasPower)}
        ${buildCockpit(m, pilotage)}
        ${buildSaddleAndPost(m, tige, selle)}
        ${buildPedales(m, pedales)}
      </svg>`;
  }

  // Postes → sélecteur des groupes SVG à faire "flasher" en jaune
  const GROUP_MAP = {
    fourche: ['fourche'], roues: ['roues'], pneus: ['roues'],
    transmission: ['transmission'], power: ['transmission'], frein: ['frein'],
    pilotage: ['pilotage'], selle: ['selle'], tige: ['tige'], pedales: ['pedales']
  };

  function mount(containerEl, modelId, selOpts, changedPostId) {
    if (!containerEl) return;
    containerEl.innerHTML = render(modelId, selOpts);
    if (changedPostId && GROUP_MAP[changedPostId]) {
      GROUP_MAP[changedPostId].forEach(grp => {
        const el = containerEl.querySelector('[data-grp="' + grp + '"]');
        if (el) {
          el.setAttribute('filter', 'url(#bv-glow)');
          setTimeout(() => el.removeAttribute('filter'), 900);
        }
      });
    }
  }

  return { render, mount, GEO };
})();
