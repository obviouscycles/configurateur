// Généré automatiquement depuis configurateur_velos_v6.xlsx — NE PAS ÉDITER À LA MAIN
// Tuning : cases de personnalisation rattachées à un composant déjà choisi (chape
// oversize, collier de selle, jeu de direction...). Prix ABSOLUS en donnée — l'écart
// affiché au visiteur (vs l'option marquée 'standard') est calculé à l'affichage.

const TUNING_POSTS = [
  { tuningId: 'chape_oversize', label: 'Chape de dérailleur', parentPost: 'transmission', requiresOptionIn: ["trans_rd_sh_105", "trans_rd_sh_ul", "trans_rd_sh_da", "trans_gr_ca_ek", "trans_rd_sr_ri", "trans_rd_sr_fo", "trans_rd_sr_re"], showStandardAsChoice: false },
  { tuningId: 'collier_selle', label: 'Collier de selle', parentPost: 'cadre', requiresOptionIn: ["cadre_rd_on", "cadre_grr_onoff", "cadre_gra_out", "cadre_vtt_off"], showStandardAsChoice: true },
  { tuningId: 'jeu_direction', label: 'Jeu de direction', parentPost: 'cadre', requiresOptionIn: ["cadre_vtt_off"], showStandardAsChoice: true },
  { tuningId: 'boitier-pedalier', label: 'Boîtier de pédalier', parentPost: 'transmission', requiresOptionIn: ["trans_gr_sh_821", "trans_gr_sh_822", "trans_gr_sr_ri", "trans_gr_sr_fo", "trans_gr_sr_re", "trans_gr_ca_ek", "trans_gr_ca_re", "trans_rd_sh_105", "trans_rd_sh_ul", "trans_rd_sh_da", "trans_rd_sr_ri", "trans_rd_sr_fo", "trans_rd_sr_re", "trans_rd_ca_re", "trans_rd_ca_sre", "trans_vtt_sh_xt", "trans_vtt_sh_xte", "trans_vtt_sh_xtr", "trans_vtt_sh_xtre", "trans_vtt_sr_gx", "trans_vtt_sr_x0", "trans_vtt_sr_xxs"], showStandardAsChoice: true },
  { tuningId: 'plateau', label: 'Plateau', parentPost: 'transmission', requiresOptionIn: ["trans_gr_sr_ri", "trans_gr_sr_fo", "trans_gr_sr_re", "trans_rd_ca_re", "trans_rd_ca_sre"], showStandardAsChoice: false },
];

const TUNING_OPTIONS = {
  'chape_oversize': [
    { id: 'chape_std', name: 'Chape standard', desc: 'Chape de dérailleur d\'origine', price: 0, isStandard: true, image: '/configurateur/assets/no_option.png', couleurs: null },
    { id: 'chape_ovs', name: 'Chape de dérailleur Novaride CCD Evo VS', desc: 'Chape à galets oversize et roulement en céramique intégrale', price: 320, isStandard: false, image: '/configurateur/assets/chape/chape_nova_ovs_noir.png', couleurs: [{nom:'Noir',hex:'#0d0d0d',photo:'/configurateur/assets/chape/chape_nova_ovs_noir.png'}, {nom:'Argent',hex:'#b1b1b1',photo:'/configurateur/assets/chape/chape_nova_ovs_argent.png'}, {nom:'Bleu',hex:'#024e97',photo:'/configurateur/assets/chape/chape_nova_ovs_bleu.png'}, {nom:'Rouge',hex:'#c63a40',photo:'/configurateur/assets/chape/chape_nova_ovs_rouge.png'}, {nom:'Violet',hex:'#783f60',photo:'/configurateur/assets/chape/chape_nova_ovs_violet.png'}, {nom:'Gold',hex:'#b7884e',photo:'/configurateur/assets/chape/chape_nova_ovs_gold.png'}] },
  ],
  'collier_selle': [
    { id: 'collier_std', name: 'Collier Obvious aluminium', desc: 'Collier de selle aluminium noir', price: 10, isStandard: true, image: '/configurateur/assets/collier/collier_alu.png', couleurs: null },
    { id: 'collier_hope_alu', name: 'Collier Hope aluminium', desc: 'Collier de selle aluminium', price: 25, isStandard: false, image: '/configurateur/assets/collier/collier_hope_noir.png', couleurs: [{nom:'Noir',hex:'#000000',photo:'/configurateur/assets/collier/collier_hope_noir.png'}, {nom:'Argent',hex:'#C2C3C1',photo:'/configurateur/assets/collier/collier_hope_argent.png'}, {nom:'Fumé',hex:'#727770',photo:'/configurateur/assets/collier/collier_hope_fume.png'}, {nom:'Bleu',hex:'#4A88E7',photo:'/configurateur/assets/collier/collier_hope_bleur.png'}, {nom:'Rouge',hex:'#ED4043',photo:'/configurateur/assets/collier/collier_hope_rouge.png'}, {nom:'Violet',hex:'#BA59C0',photo:'/configurateur/assets/collier/collier_hope_violet.png'}, {nom:'Orange',hex:'#FAA232',photo:'/configurateur/assets/collier/collier_hope_orange.png'}] },
    { id: 'collier_titane', name: 'Collier Obvious titane', desc: 'Collier de selle titane brut', price: 45, isStandard: false, image: '/configurateur/assets/collier/collier_titane.png', couleurs: null },
  ],
  'jeu_direction': [
    { id: 'jeu_std_ext', name: 'Jeu de direction standard', desc: 'Jeu ZS44 EC44 noir pivot conique', price: 15, isStandard: true, image: '/configurateur/assets/headset/head_mtb_hope_noir.png', couleurs: null },
    { id: 'jeu_vtt_hope', name: 'Jeu de direction Hope', desc: 'Roulements inox, pour pivot conique, ref HSC2/HSCH', price: 115, isStandard: false, image: '/configurateur/assets/headset/head_mtb_hope_noir.png', couleurs: [{nom:'Noir',hex:'#000000',photo:'/configurateur/assets/headset/head_mtb_hope_noir.png'}, {nom:'Argent',hex:'#C2C3C1',photo:'/configurateur/assets/headset/head_mtb_hope_argent.png'}, {nom:'Fumé',hex:'#727770',photo:'/configurateur/assets/headset/head_mtb_hope_fume.png'}, {nom:'Bleu',hex:'#4A88E7',photo:'/configurateur/assets/headset/head_mtb_hope_bleu.png'}, {nom:'Rouge',hex:'#ED4043',photo:'/configurateur/assets/headset/head_mtb_hope_rouge.png'}, {nom:'Violet',hex:'#BA59C0',photo:'/configurateur/assets/headset/head_mtb_hope_violet.png'}, {nom:'Orange',hex:'#FAA232',photo:'/configurateur/assets/headset/head_mtb_hope_orange.png'}] },
  ],
};