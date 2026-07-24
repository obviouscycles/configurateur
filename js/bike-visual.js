// js/bike-visual.js — OB_CONFIG_V3
// Moteur d'illustration du vélo, piloté par les vraies données de /data/composants.js et /data/modeles.js.
// Ne duplique aucune donnée catalogue : lit ALL_OPTIONS / MODELS déjà chargés en global,
// et DÉRIVE le style visuel (matière, silhouette, options) depuis les id/name/desc/dims réels,
// plutôt que de maintenir une liste manuelle par référence produit (dizaines d'entrées, illisible à tenir à jour).

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

  function visPneu(opt) {
    if (!opt || !opt.dims || !opt.dims.section) return { widthMm: 32, label:'' };
    const vals = opt.dims.section;
    const last = vals[vals.length - 1];
    const num = parseFloat(String(last));
    // Pouces VTT -> mm approx pour l'échelle visuelle
    const widthMm = /pouce/.test(String(last)) ? num * 25 : num;
    return { widthMm: widthMm || 32, label: String(last) };
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

  // ── Helpers SVG ─────────────────────────────────────────────────────────
  function svgDefs() {
    return `
    <defs>
      <linearGradient id="bv-titane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e8e8e8"/><stop offset="45%" stop-color="#9a9a9a"/><stop offset="100%" stop-color="#5c5c5c"/>
      </linearGradient>
      <linearGradient id="bv-carbone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2b2b2b"/><stop offset="50%" stop-color="#111"/><stop offset="100%" stop-color="#2b2b2b"/>
      </linearGradient>
      <linearGradient id="bv-alu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d8d8d8"/><stop offset="100%" stop-color="#8a8a8a"/>
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
      <filter id="bv-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#F5C400" flood-opacity="0.9"/>
      </filter>
    </defs>`;
  }

  function line(x1,y1,x2,y2,cls,extra){ return `<line class="bv-part ${cls||''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra||''}/>`; }
  function circle(cx,cy,r,cls,extra){ return `<circle class="bv-part ${cls||''}" cx="${cx}" cy="${cy}" r="${r}" ${extra||''}/>`; }

  function buildWheel(cx, cy, r, tireWidthMm, roueVis, id) {
    const tireW = 3 + Math.min(tireWidthMm, 66) / 66 * 9;
    const rimFill = roueVis.material === 'carbone' ? 'url(#bv-rim-carbone)' : 'url(#bv-rim-alu)';
    const rimR = r - tireW - 5;
    const spokeN = roueVis.material === 'carbone' ? 6 : 20;
    const spokeW = roueVis.material === 'carbone' ? 3.5 : 1.1;
    let spokes = '';
    for (let i = 0; i < spokeN; i++) {
      const a = (Math.PI * 2 / spokeN) * i + (roueVis.material === 'carbone' ? 0.25 : 0);
      spokes += `<line class="bv-part bv-spoke" stroke="#555" stroke-width="${spokeW}" x1="${cx}" y1="${cy}" x2="${(cx+Math.cos(a)*rimR).toFixed(1)}" y2="${(cy+Math.sin(a)*rimR).toFixed(1)}"/>`;
    }
    // crantage pneu (petits ticks radiaux sur la bande de roulement)
    let tread = '';
    const treadN = 28;
    for (let i = 0; i < treadN; i++) {
      const a = (Math.PI * 2 / treadN) * i;
      const x1 = cx + Math.cos(a) * (r - 1);
      const y1 = cy + Math.sin(a) * (r - 1);
      const x2 = cx + Math.cos(a) * (r - tireW + 2);
      const y2 = cy + Math.sin(a) * (r - tireW + 2);
      tread += `<line stroke="#000" stroke-opacity=".35" stroke-width="1.1" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }
    const rimDepthRing = roueVis.depth === 'aero'
      ? `<circle class="bv-part" cx="${cx}" cy="${cy}" r="${rimR - 6}" fill="none" stroke="#F5C400" stroke-opacity=".18" stroke-width="4"/>`
      : '';
    return `
      <g data-grp="roues" class="bv-group">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#151515" stroke="#000" stroke-width="${tireW}"/>
        ${tread}
        <circle cx="${cx}" cy="${cy}" r="${rimR}" fill="none" stroke="${rimFill}" stroke-width="${roueVis.material==='carbone'?9:4}"/>
        ${rimDepthRing}
        ${spokes}
        <circle cx="${cx}" cy="${cy}" r="6" fill="url(#bv-alu)" stroke="#333" stroke-width="1"/>
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

  function buildFork(m, f) {
    if (f.type === 'suspendue') {
      const midY = m.headTopY + (m.axleY - m.headTopY) * 0.5;
      return `
        <g data-grp="fourche" class="bv-group">
          <line x1="${m.headX}" y1="${m.headTopY+8}" x2="${m.frontX-4}" y2="${midY}" stroke="url(#bv-alu)" stroke-width="11" stroke-linecap="round"/>
          <line x1="${m.headX}" y1="${m.headTopY+8}" x2="${m.frontX-4}" y2="${midY}" stroke="#F5C400" stroke-width="2" stroke-dasharray="1 5" opacity=".55"/>
          <line x1="${m.frontX-4}" y1="${midY}" x2="${m.frontX}" y2="${m.axleY}" stroke="url(#bv-carbone)" stroke-width="7.5" stroke-linecap="round"/>
          <path d="M${m.frontX-16} ${m.axleY-m.wheelR+16} q 16 -6 22 10" fill="none" stroke="#3a3a3a" stroke-width="4"/>
          <text x="${(m.headX+m.frontX)/2 - 26}" y="${(m.headTopY+m.axleY)/2 - 20}" font-size="10" fill="#888" font-family="inherit">${f.travel} mm</text>
        </g>`;
    }
    const midX = (m.headX + m.frontX) / 2 + 6;
    const midY = (m.headTopY + m.axleY) / 2 - 4;
    const insertDots = f.type === 'rigide_carbone_inserts'
      ? `<circle cx="${(m.headX+midX)/2+18}" cy="${(m.headTopY+midY)/2+6}" r="2.2" fill="#F5C400" fill-opacity=".7"/>
         <circle cx="${(m.headX+midX)/2+30}" cy="${(m.headTopY+midY)/2+22}" r="2.2" fill="#F5C400" fill-opacity=".7"/>`
      : '';
    return `
      <g data-grp="fourche" class="bv-group">
        <path d="M${m.headX} ${m.headTopY+8} Q ${midX} ${midY} ${m.frontX} ${m.axleY}" fill="none" stroke="url(#bv-carbone)" stroke-width="6"/>
        <path d="M${m.headX+5} ${m.headTopY+8} Q ${midX+5} ${midY} ${m.frontX+5} ${m.axleY}" fill="none" stroke="url(#bv-carbone)" stroke-width="6"/>
        ${insertDots}
      </g>`;
  }

  function buildCockpit(m, p) {
    const stemX = m.headX, stemY = m.headTopY - 6;
    const stemColor = p.material === 'carbone' ? 'url(#bv-carbone)' : 'url(#bv-alu)';
    if (p.bar === 'flat') {
      const hx = stemX - m.stemLen;
      return `
        <g data-grp="pilotage" class="bv-group">
          <line x1="${stemX}" y1="${stemY+6}" x2="${hx}" y2="${stemY-10}" stroke="${stemColor}" stroke-width="6" stroke-linecap="round"/>
          <line x1="${hx-40}" y1="${stemY-10}" x2="${hx+40}" y2="${stemY-10}" stroke="${stemColor}" stroke-width="5" stroke-linecap="round"/>
          <circle cx="${hx-38}" cy="${stemY-10}" r="4.5" fill="#111"/>
          <circle cx="${hx+38}" cy="${stemY-10}" r="4.5" fill="#111"/>
        </g>`;
    }
    const hx = stemX - m.stemLen;
    const flareY = 12 + (p.flare || 0) * 0.4;
    return `
      <g data-grp="pilotage" class="bv-group">
        <line x1="${stemX}" y1="${stemY+6}" x2="${hx}" y2="${stemY}" stroke="${stemColor}" stroke-width="6" stroke-linecap="round"/>
        <path d="M${hx-2} ${stemY} h -30 q -16 0 -18 16 q -2 15 12 ${16+flareY*0.3} q 8 2 9 -7"
          fill="none" stroke="url(#bv-alu)" stroke-width="5.5" stroke-linecap="round"/>
        <circle cx="${hx-32}" cy="${stemY+2}" r="4" fill="#1a1a1a" stroke="#444" stroke-width="0.5"/>
      </g>`;
  }

  function buildSaddleAndPost(m, tige, selle) {
    const isDropper = tige.dropper;
    const postColor = tige.material === 'titane' ? 'url(#bv-titane)' : tige.material === 'carbone' ? 'url(#bv-carbone)' : 'url(#bv-alu)';
    const postW = isDropper ? 8.5 : 4.5;
    const postGroup = `
      <g data-grp="tige" class="bv-group">
        <line x1="${m.bbX+2}" y1="${m.bbY-8}" x2="${m.seatX+3}" y2="${m.seatTopY+4}" stroke="${postColor}" stroke-width="${postW}" stroke-linecap="round"/>
        ${isDropper ? `<rect x="${m.seatX-2}" y="${m.seatTopY+16}" width="12" height="9" rx="2" fill="#222" stroke="#F5C400" stroke-width="0.6"/>
          <path d="M${m.seatX+10} ${m.seatTopY+20} q ${(m.headX-m.seatX)*0.4} -6 ${m.headX-m.seatX-6} -${m.seatTopY-m.headTopY+18}" fill="none" stroke="#555" stroke-width="1.4" stroke-dasharray="2 3"/>` : ''}
      </g>`;
    let saddlePath, extra = '';
    if (selle.style === 'cuir') {
      saddlePath = `M${m.seatX-6} ${m.seatTopY} q 30 -8 54 3 q 4 3 0 6 q -26 8 -54 0 q -5 -3 0 -9 Z`;
      extra = `<path d="M${m.seatX+46} ${m.seatTopY+4} q 6 4 2 10" fill="none" stroke="#7a5230" stroke-width="1.6"/>
               <path d="M${m.seatX+48} ${m.seatTopY+2} q 7 5 3 12" fill="none" stroke="#7a5230" stroke-width="1.6"/>`;
    } else if (selle.style === 'courte') {
      saddlePath = `M${m.seatX-6} ${m.seatTopY-1} q 20 -9 38 1 q 4 3 -1 6 q -18 5 -37 -1 q -4 -3 0 -6 Z`;
    } else if (selle.style === 'ultralight') {
      saddlePath = `M${m.seatX-6} ${m.seatTopY} q 22 -6 42 2 q 3 2 -1 4 q -20 4 -41 -1 q -3 -2 0 -5 Z`;
    } else {
      saddlePath = `M${m.seatX-6} ${m.seatTopY-1} q 26 -9 48 2 q 4 3 -1 6 q -22 6 -47 -1 q -4 -3 0 -7 Z`;
    }
    const saddleColor = selle.style === 'cuir' ? '#8a5a30' : '#151515';
    return postGroup + `
      <g data-grp="selle" class="bv-group">
        <path d="${saddlePath}" fill="${saddleColor}" stroke="#000" stroke-width="0.6"/>
        <path d="${saddlePath}" fill="none" stroke="#F5C400" stroke-opacity=".12" stroke-width="1"/>
        ${extra}
      </g>`;
  }

  function buildDrivetrain(m, trans, frein, power) {
    const R1 = 22, R2 = 15;
    const ringFill = trans.brand === 'sram' ? '#161616' : trans.brand === 'campagnolo' ? '#c9c9c9' : '#8f8f8f';
    let rings = `<circle cx="${m.bbX}" cy="${m.bbY}" r="${R1}" fill="none" stroke="${ringFill}" stroke-width="4"/>`;
    if (trans.rings === 2) rings += `<circle cx="${m.bbX}" cy="${m.bbY}" r="${R2}" fill="none" stroke="${ringFill}" stroke-width="3.5"/>`;
    // dents schématiques
    let teeth = '';
    const tN = 14;
    for (let i = 0; i < tN; i++) {
      const a = (Math.PI * 2 / tN) * i;
      const x1 = m.bbX + Math.cos(a) * (R1 + 2), y1 = m.bbY + Math.sin(a) * (R1 + 2);
      const x2 = m.bbX + Math.cos(a) * (R1 + 4.5), y2 = m.bbY + Math.sin(a) * (R1 + 4.5);
      teeth += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${ringFill}" stroke-width="1.6"/>`;
    }
    // cassette (empilement de disques dégradés au moyeu arrière)
    const cN = trans.rings === 2 ? 8 : 11;
    let cassette = '';
    for (let i = 0; i < cN; i++) {
      cassette += `<line x1="${m.rearX-3}" y1="${m.axleY-3-i*1.9}" x2="${m.rearX+11-i*0.5}" y2="${m.axleY-3-i*1.9}" stroke="#999" stroke-width="1.5"/>`;
    }
    // chaîne
    const chain = `<path d="M${m.bbX+R1} ${m.bbY} Q ${(m.bbX+m.rearX)/2} ${m.bbY+ (m.axleY-m.bbY)/2 + 10} ${m.rearX+4} ${m.axleY-4}" fill="none" stroke="#222" stroke-width="2.4" stroke-dasharray="1.5 2.2"/>`;
    // capteur de puissance
    const pwr = power ? `<circle cx="${m.bbX}" cy="${m.bbY}" r="3.5" fill="url(#bv-yellow)" stroke="#000" stroke-width="0.5"/>` : '';
    // dérivation antenne AXS/Di2
    const wireless = trans.wireless ? `<circle cx="${m.rearX+13}" cy="${m.axleY-cN*1.9-2}" r="1.8" fill="#F5C400"/>` : '';

    const rotorR = frein.rotor === 'large' ? 17 : 11;
    const pistons = frein.pistons === 4
      ? `<rect x="${m.rearX-14}" y="${m.axleY-4}" width="9" height="8" rx="1.5" fill="#1a1a1a" stroke="#F5C400" stroke-width="0.6"/>
         <rect x="${m.frontX+6}" y="${m.axleY-4}" width="9" height="8" rx="1.5" fill="#1a1a1a" stroke="#F5C400" stroke-width="0.6"/>`
      : `<rect x="${m.rearX-12}" y="${m.axleY-3}" width="7" height="6" rx="1.2" fill="#1a1a1a"/>
         <rect x="${m.frontX+6}" y="${m.axleY-3}" width="7" height="6" rx="1.2" fill="#1a1a1a"/>`;
    const rotors = `
        <circle cx="${m.rearX}" cy="${m.axleY}" r="${rotorR}" fill="none" stroke="#888" stroke-width="1.6" stroke-dasharray="2 2.4"/>
        <circle cx="${m.frontX}" cy="${m.axleY}" r="${rotorR}" fill="none" stroke="#888" stroke-width="1.6" stroke-dasharray="2 2.4"/>
        ${pistons}`;

    return `
      <g data-grp="transmission" class="bv-group">${rings}${teeth}${cassette}${chain}${pwr}${wireless}</g>
      <g data-grp="frein" class="bv-group">${rotors}</g>`;
  }

  function buildPedales(m, ped) {
    if (ped.type === 'aucune') {
      return `<g data-grp="pedales" class="bv-group">
        <line x1="${m.bbX}" y1="${m.bbY}" x2="${m.bbX+24}" y2="${m.bbY+8}" stroke="url(#bv-alu)" stroke-width="4" stroke-linecap="round"/>
        <line x1="${m.bbX}" y1="${m.bbY}" x2="${m.bbX-24}" y2="${m.bbY-8}" stroke="url(#bv-alu)" stroke-width="4" stroke-linecap="round"/>
      </g>`;
    }
    let shape;
    if (ped.type === 'plate') {
      shape = (cx, cy) => `<rect x="${cx-11}" y="${cy-4}" width="22" height="8" rx="2" fill="#161616" stroke="#F5C400" stroke-width="0.6"/>
        ${[-7,-2,3,8].map(dx=>`<line x1="${cx+dx}" y1="${cy-4}" x2="${cx+dx}" y2="${cy+4}" stroke="#F5C400" stroke-width="0.7" opacity=".6"/>`).join('')}`;
    } else if (ped.type === 'route_auto') {
      shape = (cx, cy) => `<path d="M${cx-13} ${cy-3} q 13 -6 26 0 q -1 6 -13 6 q -12 0 -13 -6 Z" fill="#111" stroke="#999" stroke-width="0.7"/>`;
    } else {
      shape = (cx, cy) => `<rect x="${cx-8}" y="${cy-4}" width="16" height="8" rx="2" fill="#111" stroke="#777" stroke-width="0.6"/>`;
    }
    const cx1 = m.bbX + 24, cy1 = m.bbY + 8, cx2 = m.bbX - 24, cy2 = m.bbY - 8;
    return `
      <g data-grp="pedales" class="bv-group">
        <line x1="${m.bbX}" y1="${m.bbY}" x2="${cx1}" y2="${cy1}" stroke="url(#bv-alu)" stroke-width="4" stroke-linecap="round"/>
        <line x1="${m.bbX}" y1="${m.bbY}" x2="${cx2}" y2="${cy2}" stroke="url(#bv-alu)" stroke-width="4" stroke-linecap="round"/>
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
    const pneu = visPneu(getOpt('pneus'));
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
        ${buildWheel(m.rearX, m.axleY, m.wheelR, pneu.widthMm, roues, 'rear')}
        ${buildWheel(m.frontX, m.axleY, m.wheelR, pneu.widthMm, roues, 'front')}
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
