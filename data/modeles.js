// data/modeles.js

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
