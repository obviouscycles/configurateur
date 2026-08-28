// Généré automatiquement depuis configurateur_velos_v5.xlsx — NE PAS ÉDITER À LA MAIN
// Nouveauté V5 : dimensions RECOMMANDÉES par taille (manivelle/cintre/potence/etc.)
// — donnée absente de geometries.js (V3/V4), à exploiter plus tard pour un pré-remplissage
// automatique des dimensions une fois la taille déterminée (non câblé pour l'instant).
const TAILLES_CADRE = {
  'route': [
    { 'taille': "XXS", 'stature_min': 155, 'stature_max': 164, 'ej_min': 70, 'ej_max': 81.39999999999999, 'manivelle': 165, 'cintre': 380, 'potence': 80, 'largeur_selle': 145, 'section': 28, 'plateaux': "52x36", 'cassette': "11x34", 'debattement': null },
    { 'taille': "XS", 'stature_min': 163, 'stature_max': 171, 'ej_min': 73.4, 'ej_max': 84.8, 'manivelle': 165, 'cintre': 400, 'potence': 90, 'largeur_selle': 145, 'section': 28, 'plateaux': "52x36", 'cassette': "11x34", 'debattement': null },
    { 'taille': "S", 'stature_min': 170, 'stature_max': 177, 'ej_min': 76.8, 'ej_max': 88.19999999999999, 'manivelle': 170, 'cintre': 400, 'potence': 90, 'largeur_selle': 145, 'section': 28, 'plateaux': "52x36", 'cassette': "11x34", 'debattement': null },
    { 'taille': "M", 'stature_min': 176, 'stature_max': 182, 'ej_min': 80.2, 'ej_max': 91.6, 'manivelle': 170, 'cintre': 420, 'potence': 100, 'largeur_selle': 145, 'section': 28, 'plateaux': "52x36", 'cassette': "11x34", 'debattement': null },
    { 'taille': "L", 'stature_min': 181, 'stature_max': 187, 'ej_min': 83.6, 'ej_max': 95, 'manivelle': 172.5, 'cintre': 420, 'potence': 110, 'largeur_selle': 145, 'section': 28, 'plateaux': "52x36", 'cassette': "11x34", 'debattement': null },
    { 'taille': "XL", 'stature_min': 186, 'stature_max': 194, 'ej_min': 87, 'ej_max': 98.39999999999999, 'manivelle': 175, 'cintre': 440, 'potence': 120, 'largeur_selle': 145, 'section': 28, 'plateaux': "52x36", 'cassette': "11x34", 'debattement': null },
  ],
  'gravel_racing': [
    { 'taille': "XS", 'stature_min': 160, 'stature_max': 168, 'ej_min': 72.8, 'ej_max': 83.1, 'manivelle': 165, 'cintre': 400, 'potence': 80, 'largeur_selle': 145, 'section': 45, 'plateaux': "40", 'cassette': "10x45", 'debattement': null },
    { 'taille': "S", 'stature_min': 166, 'stature_max': 174, 'ej_min': 76.2, 'ej_max': 86.5, 'manivelle': 170, 'cintre': 420, 'potence': 90, 'largeur_selle': 145, 'section': 45, 'plateaux': "40", 'cassette': "10x45", 'debattement': null },
    { 'taille': "M", 'stature_min': 172, 'stature_max': 180, 'ej_min': 79.6, 'ej_max': 89.89999999999999, 'manivelle': 170, 'cintre': 420, 'potence': 100, 'largeur_selle': 145, 'section': 45, 'plateaux': "40", 'cassette': "10x45", 'debattement': null },
    { 'taille': "L", 'stature_min': 178, 'stature_max': 186, 'ej_min': 83, 'ej_max': 93.3, 'manivelle': 172.5, 'cintre': 440, 'potence': 110, 'largeur_selle': 145, 'section': 45, 'plateaux': "40", 'cassette': "10x45", 'debattement': null },
    { 'taille': "XL", 'stature_min': 184, 'stature_max': 194, 'ej_min': 86.4, 'ej_max': 96.69999999999999, 'manivelle': 175, 'cintre': 460, 'potence': 120, 'largeur_selle': 145, 'section': 45, 'plateaux': "40", 'cassette': "10x45", 'debattement': null },
  ],
  'gravel_bikepacking': [
    { 'taille': "XS", 'stature_min': 160, 'stature_max': 168, 'ej_min': 71.7, 'ej_max': 82, 'manivelle': 165, 'cintre': 400, 'potence': 80, 'largeur_selle': 145, 'section': 40, 'plateaux': "40", 'cassette': "10x51", 'debattement': null },
    { 'taille': "S", 'stature_min': 166, 'stature_max': 174, 'ej_min': 75.1, 'ej_max': 85.39999999999999, 'manivelle': 170, 'cintre': 420, 'potence': 90, 'largeur_selle': 145, 'section': 40, 'plateaux': "40", 'cassette': "10x52", 'debattement': null },
    { 'taille': "M", 'stature_min': 172, 'stature_max': 180, 'ej_min': 78.5, 'ej_max': 88.8, 'manivelle': 170, 'cintre': 420, 'potence': 100, 'largeur_selle': 145, 'section': 40, 'plateaux': "40", 'cassette': "10x53", 'debattement': null },
    { 'taille': "L", 'stature_min': 178, 'stature_max': 186, 'ej_min': 81.9, 'ej_max': 92.1, 'manivelle': 172.5, 'cintre': 440, 'potence': 110, 'largeur_selle': 145, 'section': 40, 'plateaux': "40", 'cassette': "10x54", 'debattement': null },
    { 'taille': "XL", 'stature_min': 184, 'stature_max': 194, 'ej_min': 85.3, 'ej_max': 95.5, 'manivelle': 175, 'cintre': 460, 'potence': 120, 'largeur_selle': 145, 'section': 40, 'plateaux': "40", 'cassette': "10x55", 'debattement': null },
  ],
  'vtt_enduro': [
    { 'taille': "S", 'stature_min': 164, 'stature_max': 172, 'ej_min': 74.2, 'ej_max': 86.69999999999999, 'manivelle': 165, 'cintre': null, 'potence': null, 'largeur_selle': 145, 'section': "2.4\"", 'plateaux': "32", 'cassette': "10x52", 'debattement': 150 },
    { 'taille': "M", 'stature_min': 170, 'stature_max': 178, 'ej_min': 78.8, 'ej_max': 93.19999999999999, 'manivelle': 170, 'cintre': null, 'potence': null, 'largeur_selle': 145, 'section': "2.4\"", 'plateaux': "32", 'cassette': "10x52", 'debattement': 150 },
    { 'taille': "L", 'stature_min': 176, 'stature_max': 184, 'ej_min': 83.4, 'ej_max': 97.8, 'manivelle': 170, 'cintre': null, 'potence': null, 'largeur_selle': 145, 'section': "2.4\"", 'plateaux': "32", 'cassette': "10x52", 'debattement': 150 },
    { 'taille': "XL", 'stature_min': 182, 'stature_max': 192, 'ej_min': 88, 'ej_max': 102.3, 'manivelle': 172.5, 'cintre': null, 'potence': null, 'largeur_selle': 145, 'section': "2.4\"", 'plateaux': "32", 'cassette': "10x52", 'debattement': 150 },
  ],
};