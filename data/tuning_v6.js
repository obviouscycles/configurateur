// Généré automatiquement depuis configurateur_velos_v6.xlsx — NE PAS ÉDITER À LA MAIN
// Tuning : cases de personnalisation rattachées à un composant déjà choisi (chape
// oversize, collier de selle, jeu de direction...). Prix ABSOLUS en donnée — l'écart
// affiché au visiteur (vs l'option marquée 'standard') est calculé à l'affichage.

const TUNING_POSTS = [
  { tuningId: 'chape_oversize', label: 'Chape de dérailleur', parentPost: 'transmission', requiresOptionIn: null, showStandardAsChoice: false },
  { tuningId: 'boitier-pedalier', label: 'Boîtier de pédalier', parentPost: 'transmission', requiresOptionIn: null, showStandardAsChoice: true },
  { tuningId: 'plateau', label: 'Plateau', parentPost: 'transmission', requiresOptionIn: null, showStandardAsChoice: false },
];

const TUNING_OPTIONS = {
  'chape_oversize': [
    { id: 'chape_std', name: 'Chape standard', desc: 'Chape de dérailleur d\'origine', price: 0, isStandard: true, requiresOptionIn: null, image: '/configurateur/assets/no_option.png', couleurs: null },
    { id: 'chape_ovs', name: 'Chape de dérailleur Novaride CCD Evo VS', desc: 'Chape à galets oversize et roulement en céramique intégrale', price: 320, isStandard: false, requiresOptionIn: ["trans_rd_sh_105", "trans_rd_sh_ul", "trans_rd_sh_da", "trans_gr_ca_ek", "trans_rd_sr_ri", "trans_rd_sr_fo", "trans_rd_sr_re"], image: '/configurateur/assets/chape/chape_nova_ovs_noir.png', couleurs: [{nom:'Noir',hex:'#0d0d0d',photo:'/configurateur/assets/chape/chape_nova_ovs_noir.png'}, {nom:'Argent',hex:'#b1b1b1',photo:'/configurateur/assets/chape/chape_nova_ovs_argent.png'}, {nom:'Bleu',hex:'#024e97',photo:'/configurateur/assets/chape/chape_nova_ovs_bleu.png'}, {nom:'Rouge',hex:'#c63a40',photo:'/configurateur/assets/chape/chape_nova_ovs_rouge.png'}, {nom:'Violet',hex:'#783f60',photo:'/configurateur/assets/chape/chape_nova_ovs_violet.png'}, {nom:'Gold',hex:'#b7884e',photo:'/configurateur/assets/chape/chape_nova_ovs_gold.png'}] },
  ],
};