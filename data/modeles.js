// data/modeles.js

const MODELS = [
  { id: 'route',              name: 'ON/',        badge: 'Route',          desc: 'Cadre titane, fourche carbone, sportif et polyvalent. Transmission électronique.',                                  basePrice: 5490, assembly: 300, photo: '/configurateur/assets/velos/ON_2025.webp' },
  { id: 'gravel_racing',      name: 'ON/OFF',     badge: 'Gravel Racing',  desc: 'Cadre titane, géométrie sport, fourche carbone, intégration complète',                 basePrice: 4450, assembly: 300, photo: '/configurateur/assets/velos/ONOFF_2024.webp' },
  { id: 'gravel_bikepacking', name: 'OUT/QUEST',  badge: 'Gravel Aventure',desc: "Cadre titane, géométrie confort / longue distance, nombreux points d'accroche",         basePrice: 4390, assembly: 300, photo: '/configurateur/assets/velos/OUTQUEST_2024.webp' },
  { id: 'vtt_enduro',         name: '/OFF',        badge: 'Enduro HT',      desc: 'Cadre titane semi-rigide, géométrie enduro, fourche 140/150 mm, boost 148 mm',          basePrice: 5090, assembly: 300, photo: '/configurateur/assets/velos/OFF_2025.webp' },
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

const PRESET_DESCS_DT = {
  'Signature': 'Le haut de gamme — composants premium, chaque détail soigné.',
  'Ti1':       'Le meilleur équilibre performance / prix de la gamme.',
  'Ti2':       'Point de départ idéal — composants fiables, budget maîtrisé.'
};

const PRESET_DESCS = {
  'Ti2':       'Point de départ idéal — composants fiables, budget maîtrisé.',
  'Ti1':       'Le meilleur équilibre performance / prix de la gamme.',
  'Signature': 'Le haut de gamme — composants haut de gamme, chaque détail compté.'
};

// ─── KIT CADRE SEUL — prix et préconfig par défaut (fourche + pilotage + tige) ──
const KIT_CADRE_PRICES = {
  'route':              { basePrice: 2749, assembly: 0, photo: '/configurateur/assets/kits/kit_ON.webp' },
  'gravel_racing':       { basePrice: 2749, assembly: 0, photo: '/configurateur/assets/kits/kit_ONOFF.webp' },
  'gravel_bikepacking':  { basePrice: 2749, assembly: 0, photo: '/configurateur/assets/kits/kit_OUTQUEST.webp' },
  'vtt_enduro':          { basePrice: 2549, assembly: 0, photo: '/configurateur/assets/kits/kit_OFF.webp' },
};

const KIT_CADRE_PRESETS = {
  // Postes dédiés kit cadre : fourche_kit/potence_kit/cintre_kit/tige_kit — jamais
  // fourche/tige/pilotage (postes du vélo complet, POST_META partagé).
  // Cintre par défaut "sans" sur les 4 modèles — les vrais cintres ne se
  // débloquent qu'une fois une potence réelle sélectionnée (voir app_v4.js).
  'route':              { fourche_kit: 'fourche_rd_car_00', potence_kit: 'potence_rd_sub', cintre_kit: 'cintre_no', tige_kit: 'tige_rd_ob_car' },
  'gravel_racing':       { fourche_kit: 'fourche_gr_car_00', potence_kit: 'potence_rd_sub', cintre_kit: 'cintre_no', tige_kit: 'tige_rd_ob_car' },
  'gravel_bikepacking':  { fourche_kit: 'fourche_gr_car_ins', potence_kit: 'potence_no', cintre_kit: 'cintre_no', tige_kit: 'tige_rd_ob_car' },
  'vtt_enduro':          { fourche_kit: 'fourche-no', potence_kit: 'potence_no', cintre_kit: 'cintre_no', tige_kit: 'tige_no' },
};
