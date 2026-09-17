// V9 — Notes de caractère par modèle (rigidité/confort/aérodynamique/polyvalence,
// 0-100) et poids de base hors composants variables (cadre + peinture + petite
// visserie fixe). DONNÉES PROVISOIRES — en attente d'un onglet xlsx dédié (voir
// Damien : gradation à définir précisément par modèle). Ne pas considérer ces
// valeurs comme fiables pour un usage commercial en l'état.
const MODEL_STATS = {
  route: { rigidite: 78, confort: 52, aero: 82, polyvalence: 48, poidsBase: 350 },
  gravel_racing: { rigidite: 72, confort: 64, aero: 60, polyvalence: 78, poidsBase: 380 },
  gravel_bikepacking: { rigidite: 58, confort: 82, aero: 42, polyvalence: 85, poidsBase: 420 },
  vtt_enduro: { rigidite: 65, confort: 88, aero: 30, polyvalence: 55, poidsBase: 480 },
};
