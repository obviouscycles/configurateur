// js/bike-visual.js — OB_CONFIG_V3 (proportions corrigées, vérifiées visuellement)
// Moteur d'illustration du vélo, piloté par les vraies données de /data/composants.js et /data/modeles.js.
//
// IMPORTANT (historique) : les versions précédentes avaient un empattement ~3x trop long par
// rapport au diamètre des roues (ratio réel empattement/diamètre ≈ 1,5-1,6 sur un vrai vélo),
// ce qui donnait un dessin "étiré" ne ressemblant pas à un vélo. La géométrie ci-dessous est
// calculée à partir de proportions réelles (empattement, base, chasse, angle de selle) et a été
// vérifiée en rendant le SVG en image et en le regardant, pas seulement en écrivant des coordonnées.

const BikeVisual = (function () {

  // ── Géométrie par modèle, dérivée de proportions réelles (voir calculs en commentaire) ──
  // wheelbase = 3.2×R, base (BB) = 0.42×wheelbase, chute BB = 0.21×R,
  // hauteur tube de selle = 1.48×R, recul tube de selle = 0.456×R,
  // longueur tube horizontal = 1.62×R, décalage tube de direction = 0.222×R
  const GEO = {
    route:              { wheelR:82, rearX:249, frontX:511, axleY:258, bbX:359, bbY:275, seatX:322, seatTopY:154, headX:454, headTopY:172, stemLen:34, label:'ON/ — Route' },
    gravel_racing:       { wheelR:84, rearX:246, frontX:514, axleY:258, bbX:358, bbY:276, seatX:320, seatTopY:151, headX:456, headTopY:170, stemLen:33, label:'ON/OFF — Gravel Racing' },
    gravel_bikepacking:  { wheelR:86, rearX:242, frontX:518, axleY:258, bbX:358, bbY:276, seatX:319, seatTopY:149, headX:458, headTopY:168, stemLen:32, rack:true, label:'OUT/QUEST — Gravel Aventure' },
    vtt_enduro:          { wheelR:92, rearX:233, frontX:527, axleY:258, bbX:356, bbY:277, seatX:314, seatTopY:141, headX:464, headTopY:162, stemLen:26, suspension:true, label:'/OFF — Enduro HT' }
  };

  // ── Dérivation du "type visuel" à partir des vraies données catalogue ──────────────
  function low(s){ return (s || '').toLowerCase(); }

  function visFourche(opt) {
    if (!opt) return { type:'rigide_carbone' };
    if (opt.dims && opt.dims.debattement) {
      const travels = opt.dims.debattement;
      return { type:'suspendue', travel: travels[travels.length - 1] };
    }
    return { type: opt.id.includes('_ins') ? 'rigide_carbone_inserts' : 'rigide_carbone' };
  }
  function brandOf(id) {
    if (/_sh_/.test(id)) return 'shimano';
    if (/_sr_/.test(id)) return 'sram';
    if (/_ca_/.test(id)) return 'campagnolo';
    return null;
  }
  function visRoues(opt) {
    if (!opt) return { material:'alu' };
    const carbone = /carbone/.test(low(opt.desc)) || /_ob_/.test(opt.id);
    return { material: carbone ? 'carbone' : 'alu' };
  }
  function visPneu(opt, modelId) {
    let widthMm = 32;
    if (opt && opt.dims && opt.dims.section) {
      const vals = opt.dims.section;
      const num = parseFloat(String(vals[vals.length - 1]));
      widthMm = /pouce/.test(String(vals[vals.length-1])) ? num * 25 : (num || 32);
    }
    const tread = modelId === 'vtt_enduro' ? 'crampons' : modelId === 'route' ? 'slick' : 'gravel';
    return { widthMm, tread };
  }
  function visTransmission(opt) {
    if (!opt) return { rings:1, brand:null };
    const plateaux = (opt.dims && opt.dims.plateaux) || [];
    const is2x = plateaux.some(p => String(p).includes('x'));
    return { rings: is2x ? 2 : 1, brand: brandOf(opt.id) };
  }
  function visFrein(opt) {
    if (!opt || opt.id === 'frein_all') return { pistons:2 };
    return { pistons:4 };
  }
  function visPilotage(opt) {
    if (!opt) return { bar:'drop' };
    const flat = /flat|plat/.test(low(opt.name) + low(opt.id));
    return { bar: flat ? 'flat' : 'drop' };
  }
  function visSelle(opt) {
    if (!opt) return { style:'standard' };
    if (/^selle_br_|^selle_ber_/.test(opt.id)) return { style:'cuir' };
    if (/arg/.test(opt.id)) return { style:'courte' };
    return { style:'standard' };
  }
  function visTige(opt) {
    if (!opt) return { dropper:false };
    return { dropper: /tel/.test(opt.id) || /télescop|dropper/i.test(opt.desc || '') };
  }
  function visPedales(opt) {
    if (!opt || opt.id === 'ped_no') return { type:'aucune' };
    if (opt.id.startsWith('ped_rd_')) return { type:'route_auto' };
    if (/_on_/.test(opt.id)) return { type:'plate' };
    return { type:'vtt_auto' };
  }

  function svgDefs() {
    return `
    <defs>
      <linearGradient id="bv-titane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d9d5c9"/><stop offset="45%" stop-color="#a8a299"/><stop offset="100%" stop-color="#726c62"/>
      </linearGradient>
      <linearGradient id="bv-carbone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3a3a3a"/><stop offset="50%" stop-color="#161616"/><stop offset="100%" stop-color="#2f2f2f"/>
      </linearGradient>
      <linearGradient id="bv-alu" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e2e2e2"/><stop offset="100%" stop-color="#8f8f8f"/>
      </linearGradient>
      <filter id="bv-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="#F5C400" flood-opacity="0.9"/>
      </filter>
    </defs>`;
  }

  function buildWheel(cx, cy, r, pneu, roue, grp) {
    const tireW = 8 + Math.min(pneu.widthMm, 66) / 66 * 8;
    const rimR = r - tireW - 3;
    const spokeN = roue.material === 'carbone' ? 5 : 20;
    const spokeW = roue.material === 'carbone' ? 3 : 1;
    let spokes = '';
    for (let i = 0; i < spokeN; i++) {
      const a = (Math.PI * 2 / spokeN) * i;
      spokes += `<line stroke="#666" stroke-width="${spokeW}" x1="${cx}" y1="${cy}" x2="${(cx+Math.cos(a)*rimR).toFixed(1)}" y2="${(cy+Math.sin(a)*rimR).toFixed(1)}"/>`;
    }
    let tread = '';
    if (pneu.tread === 'gravel') {
      for (let i = 0; i < 36; i++) {
        const a = (Math.PI * 2 / 36) * i;
        tread += `<line stroke="#000" stroke-opacity=".35" stroke-width="1" x1="${(cx+Math.cos(a)*r).toFixed(1)}" y1="${(cy+Math.sin(a)*r).toFixed(1)}" x2="${(cx+Math.cos(a)*(r-tireW*0.7)).toFixed(1)}" y2="${(cy+Math.sin(a)*(r-tireW*0.7)).toFixed(1)}"/>`;
      }
    } else if (pneu.tread === 'crampons') {
      for (let i = 0; i < 22; i++) {
        const a = (Math.PI * 2 / 22) * i;
        const bx = cx + Math.cos(a) * (r - 2), by = cy + Math.sin(a) * (r - 2);
        tread += `<rect x="${(bx-2).toFixed(1)}" y="${(by-2).toFixed(1)}" width="4" height="4" fill="#000" fill-opacity=".4" transform="rotate(${(a*180/Math.PI).toFixed(0)} ${bx.toFixed(1)} ${by.toFixed(1)})"/>`;
      }
    }
    return `
      <g data-grp="roues" class="bv-group">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#111" stroke="#000" stroke-width="${tireW}"/>
        ${tread}
        <circle cx="${cx}" cy="${cy}" r="${rimR}" fill="none" stroke="${roue.material==='carbone' ? '#2a2a2a' : '#ddd'}" stroke-width="${roue.material==='carbone'?7:3}"/>
        ${spokes}
        <circle cx="${cx}" cy="${cy}" r="6" fill="url(#bv-alu)" stroke="#333" stroke-width="0.8"/>
      </g>`;
  }

  // Cordon de soudure titane : petit anneau de traits fins perpendiculaires au tube,
  // signature visuelle des cadres titane (jonctions brutes, meulées mais visibles)
  function weldBead(x, y, angleDeg, spread) {
    let marks = '';
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * spread;
      const rad = (angleDeg) * Math.PI / 180;
      const px = x + Math.cos(rad) * t, py = y + Math.sin(rad) * t;
      const nrad = rad + Math.PI / 2;
      const dx = Math.cos(nrad) * 2.2, dy = Math.sin(nrad) * 2.2;
      marks += `<line x1="${(px-dx).toFixed(1)}" y1="${(py-dy).toFixed(1)}" x2="${(px+dx).toFixed(1)}" y2="${(py+dy).toFixed(1)}" stroke="#4a463f" stroke-width="0.6" opacity=".55"/>`;
    }
    return marks;
  }

  function buildFrame(m) {
    const seatStayStartY = m.seatTopY + (m.bbY - m.seatTopY) * 0.5;
    const seatStayStartX = m.seatX + (m.bbX - m.seatX) * 0.2;
    const rack = m.rack ? `<line stroke="#666" stroke-width="1.6" stroke-dasharray="2 3" x1="${seatStayStartX-4}" y1="${seatStayStartY-22}" x2="${m.rearX+3}" y2="${m.axleY-m.wheelR-4}"/>` : '';
    const tube = (x1,y1,x2,y2,w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#bv-titane)" stroke-width="${w}" stroke-linecap="round"/>`;
    const angle = (x1,y1,x2,y2) => Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
    // cordons de soudure aux 3 jonctions principales : douille de direction, boîtier, jonction selle/horizontal
    const welds = weldBead(m.headX, m.headTopY, angle(m.seatX,m.seatTopY,m.headX,m.headTopY), 9)
      + weldBead(m.bbX, m.bbY, angle(m.rearX,m.axleY,m.bbX,m.bbY) - 45, 9)
      + weldBead(m.seatX, m.seatTopY, angle(m.seatX,m.seatTopY,m.headX,m.headTopY), 8);
    return `
      <g data-grp="frame" class="bv-group">
        ${tube(m.rearX, m.axleY, m.bbX, m.bbY, 8)}
        ${tube(m.bbX, m.bbY, m.seatX, m.seatTopY, 8.5)}
        ${tube(m.seatX, m.seatTopY, m.headX, m.headTopY, 8)}
        ${tube(m.headX, m.headTopY, m.bbX, m.bbY, 8)}
        ${tube(seatStayStartX, seatStayStartY, m.rearX, m.axleY, 5)}
        ${welds}
        <circle cx="${m.headX}" cy="${m.headTopY}" r="6.5" fill="#2a2a2a" stroke="#111" stroke-width="0.6"/>
        <circle cx="${m.headX}" cy="${m.headTopY}" r="2.4" fill="#F5C400"/>
        <circle cx="${m.bbX}" cy="${m.bbY}" r="10" fill="url(#bv-titane)" stroke="#333" stroke-width="0.6"/>
        ${rack}
      </g>`;
  }

  function buildFork(m, f) {
    if (f.type === 'suspendue') {
      return `
        <g data-grp="fourche" class="bv-group">
          <line x1="${m.headX}" y1="${m.headTopY}" x2="${m.frontX}" y2="${m.axleY}" stroke="url(#bv-alu)" stroke-width="12" stroke-linecap="round"/>
          <line x1="${m.headX}" y1="${m.headTopY}" x2="${m.frontX}" y2="${m.axleY}" stroke="#111" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 ${Math.hypot(m.frontX-m.headX,m.axleY-m.headTopY)*0.55} 999"/>
          <line x1="${(m.headX+m.frontX)/2}" y1="${(m.headTopY+m.axleY)/2 - 2}" x2="${m.frontX}" y2="${m.axleY}" stroke="#111" stroke-width="10" stroke-linecap="round"/>
          <text x="${(m.headX+m.frontX)/2 - 22}" y="${(m.headTopY+m.axleY)/2 - 16}" font-size="10" fill="#999" font-family="inherit">${f.travel} mm</text>
        </g>`;
    }
    const insertDots = f.type === 'rigide_carbone_inserts'
      ? `<circle cx="${m.headX + (m.frontX-m.headX)*0.6}" cy="${m.headTopY + (m.axleY-m.headTopY)*0.55}" r="2" fill="#F5C400" fill-opacity=".7"/>`
      : '';
    return `
      <g data-grp="fourche" class="bv-group">
        <line x1="${m.headX}" y1="${m.headTopY}" x2="${m.frontX}" y2="${m.axleY}" stroke="url(#bv-carbone)" stroke-width="9" stroke-linecap="round"/>
        ${insertDots}
      </g>`;
  }

  function buildCockpit(m, p) {
    const stemX = m.headX, stemY = m.headTopY - 2;
    const hx = stemX - m.stemLen;
    if (p.bar === 'flat') {
      const riseY = stemY - 16;
      return `
        <g data-grp="pilotage" class="bv-group">
          <line x1="${stemX}" y1="${stemY}" x2="${hx}" y2="${riseY}" stroke="url(#bv-alu)" stroke-width="6" stroke-linecap="round"/>
          <line x1="${hx-34}" y1="${riseY}" x2="${hx+34}" y2="${riseY}" stroke="url(#bv-alu)" stroke-width="5" stroke-linecap="round"/>
          <circle cx="${hx-32}" cy="${riseY}" r="3.5" fill="#161616"/>
          <circle cx="${hx+32}" cy="${riseY}" r="3.5" fill="#161616"/>
        </g>`;
    }
    return `
      <g data-grp="pilotage" class="bv-group">
        <line x1="${stemX}" y1="${stemY}" x2="${hx}" y2="${stemY-10}" stroke="url(#bv-alu)" stroke-width="6" stroke-linecap="round"/>
        <path d="M${hx} ${stemY-10} q -10 -3 -16 5 q -5 7 -3 16 q 6 4 8 -4 q 1 -7 -3 -10"
          fill="none" stroke="url(#bv-alu)" stroke-width="5" stroke-linecap="round"/>
        <circle cx="${hx-9}" cy="${stemY-9}" r="3" fill="#161616"/>
      </g>`;
  }

  function buildSaddleAndPost(m, tige, selle) {
    const postW = tige.dropper ? 8 : 4.5;
    const postGroup = `
      <g data-grp="tige" class="bv-group">
        <line x1="${m.bbX}" y1="${m.bbY-4}" x2="${m.seatX}" y2="${m.seatTopY+8}" stroke="url(#bv-titane)" stroke-width="${postW}" stroke-linecap="round"/>
        ${tige.dropper ? `<rect x="${m.seatX-5}" y="${m.seatTopY+14}" width="11" height="8" rx="2" fill="#222" stroke="#F5C400" stroke-width="0.6"/>` : ''}
      </g>`;
    let noseLen, tailLen, tailW;
    if (selle.style === 'cuir') { noseLen = 12; tailLen = 26; tailW = 12; }
    else if (selle.style === 'courte') { noseLen = 7; tailLen = 20; tailW = 10; }
    else { noseLen = 10; tailLen = 24; tailW = 11; }
    const noseX = m.seatX + noseLen, tailX = m.seatX - tailLen;
    const topY = m.seatTopY - tailW * 0.3, botY = m.seatTopY + tailW * 0.5;
    const saddlePath = `M${noseX} ${m.seatTopY}
      Q ${(noseX+m.seatX)/2} ${topY-2} ${m.seatX} ${topY}
      Q ${(m.seatX+tailX)/2} ${topY-2} ${tailX} ${topY+4}
      Q ${tailX-3} ${m.seatTopY} ${tailX} ${botY}
      Q ${(m.seatX+tailX)/2} ${botY+2} ${m.seatX} ${m.seatTopY+3}
      Q ${(noseX+m.seatX)/2} ${m.seatTopY+2} ${noseX} ${m.seatTopY} Z`;
    const fill = selle.style === 'cuir' ? '#8a5a30' : '#151515';
    return postGroup + `
      <g data-grp="selle" class="bv-group">
        <line x1="${noseX-2}" y1="${botY-1}" x2="${tailX+3}" y2="${botY-1}" stroke="#888" stroke-width="1.2"/>
        <path d="${saddlePath}" fill="${fill}" stroke="#000" stroke-width="0.6"/>
      </g>`;
  }

  function toothedRing(cx, cy, r, teethN, fill) {
    let teeth = '';
    for (let i = 0; i < teethN; i++) {
      const a = (Math.PI * 2 / teethN) * i;
      const a2 = a + (Math.PI * 2 / teethN) * 0.4;
      const x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r;
      const x2 = cx + Math.cos(a2) * (r + 2.5), y2 = cy + Math.sin(a2) * (r + 2.5);
      const x3 = cx + Math.cos(a + (Math.PI * 2 / teethN) * 0.75) * r, y3 = cy + Math.sin(a + (Math.PI * 2 / teethN) * 0.75) * r;
      teeth += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} Z" fill="${fill}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fill}" stroke-width="2.5"/>${teeth}`;
  }

  function buildDrivetrain(m, trans, frein, power) {
    const R1 = 20, R2 = 14;
    const ringFill = trans.brand === 'sram' ? '#1c1c1c' : trans.brand === 'campagnolo' ? '#c9c9c9' : '#9a9a9a';
    let rings = toothedRing(m.bbX, m.bbY, R1, 18, ringFill);
    if (trans.rings === 2) rings += toothedRing(m.bbX, m.bbY, R2, 14, ringFill);

    const cN = trans.rings === 2 ? 7 : 9;
    let cassette = '';
    const baseR = 15;
    for (let i = 0; i < cN; i++) {
      const rr = baseR - i * (baseR - 6) / cN;
      cassette += `<ellipse cx="${m.rearX + i*0.3}" cy="${m.axleY}" rx="1" ry="${rr.toFixed(1)}" fill="#b9b9b9" stroke="#777" stroke-width="0.3"/>`;
    }
    const chain = `<path d="M${m.bbX+R1*0.6} ${m.bbY-R1*0.8} Q ${(m.bbX+m.rearX)/2} ${m.bbY+ (m.axleY-m.bbY)/2} ${m.rearX+6} ${m.axleY-8}" fill="none" stroke="#222" stroke-width="2" stroke-dasharray="1.5 2"/>`;
    const pwr = power ? `<circle cx="${m.bbX}" cy="${m.bbY}" r="3" fill="#F5C400" stroke="#000" stroke-width="0.4"/>` : '';

    function rotorCaliper(cx, cy) {
      const rotorR = frein.pistons === 4 ? 16 : 11;
      const caliperW = frein.pistons === 4 ? 11 : 8;
      return `
        <circle cx="${cx}" cy="${cy}" r="${rotorR}" fill="none" stroke="#888" stroke-width="1.4"/>
        <circle cx="${cx}" cy="${cy}" r="${rotorR*0.5}" fill="none" stroke="#666" stroke-width="0.8"/>
        <rect x="${cx-caliperW/2}" y="${cy-caliperW*0.4}" width="${caliperW}" height="${caliperW*0.8}" rx="1.3" fill="#161616" stroke="#000" stroke-width="0.5"/>`;
    }

    return `
      <g data-grp="transmission" class="bv-group">${rings}${cassette}${chain}${pwr}</g>
      <g data-grp="frein" class="bv-group">${rotorCaliper(m.rearX, m.axleY)}${rotorCaliper(m.frontX, m.axleY)}</g>`;
  }

  function buildPedales(m, ped) {
    const cx1 = m.bbX + 20, cy1 = m.bbY + 7, cx2 = m.bbX - 20, cy2 = m.bbY - 7;
    const crank = (cx, cy) => `<line x1="${m.bbX}" y1="${m.bbY}" x2="${cx}" y2="${cy}" stroke="url(#bv-alu)" stroke-width="4.5" stroke-linecap="round"/>`;
    if (ped.type === 'aucune') return `<g data-grp="pedales" class="bv-group">${crank(cx1,cy1)}${crank(cx2,cy2)}</g>`;
    let shape;
    if (ped.type === 'plate') {
      shape = (cx, cy) => `<rect x="${cx-10}" y="${cy-4}" width="20" height="8" rx="1.5" fill="#161616" stroke="#F5C400" stroke-width="0.6"/>`;
    } else if (ped.type === 'route_auto') {
      shape = (cx, cy) => `<ellipse cx="${cx}" cy="${cy}" rx="10" ry="3.5" fill="#111" stroke="#aaa" stroke-width="0.6"/>`;
    } else {
      shape = (cx, cy) => `<rect x="${cx-7}" y="${cy-3}" width="14" height="6" rx="1.3" fill="#111" stroke="#777" stroke-width="0.6"/>`;
    }
    return `<g data-grp="pedales" class="bv-group">${crank(cx1,cy1)}${crank(cx2,cy2)}${shape(cx1,cy1)}${shape(cx2,cy2)}</g>`;
  }

  function render(modelId, selOpts) {
    const m = GEO[modelId] || GEO.route;
    const getOpt = (postId) => (typeof ALL_OPTIONS !== 'undefined' && ALL_OPTIONS[postId])
      ? ALL_OPTIONS[postId].find(o => o.id === selOpts[postId]) || null : null;

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
        ${buildWheel(m.rearX, m.axleY, m.wheelR, pneu, roues)}
        ${buildWheel(m.frontX, m.axleY, m.wheelR, pneu, roues)}
        ${buildFrame(m)}
        ${buildFork(m, fourche)}
        ${buildDrivetrain(m, trans, frein, hasPower)}
        ${buildCockpit(m, pilotage)}
        ${buildSaddleAndPost(m, tige, selle)}
        ${buildPedales(m, pedales)}
      </svg>`;
  }

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
