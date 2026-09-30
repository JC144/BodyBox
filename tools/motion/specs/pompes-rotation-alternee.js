// L : pompes avec rotation alternée. Vue de face (le personnage regarde vers nous) : c'est la seule
// qui montre le transfert du poids d'un bras sur l'autre. Le corps, dans l'axe du regard, est caché
// derrière les épaules ; on ne dessine que la ceinture scapulaire, la tête et les bras.
// (Essayé : dos et jambes en raccourci derrière la tête, qui faisaient croire à un équilibre sur les mains.)
const skeleton = [
  { name: 'cou', parent: null, length: 1, kind: 'none' },
  { name: 'epaule-g', parent: 'cou', length: 18 },
  { name: 'bras-g', parent: 'epaule-g', length: 32 },
  { name: 'avant-bras-g', parent: 'bras-g', length: 32 },
  { name: 'epaule-d', parent: 'cou', length: 18 },
  { name: 'bras-d', parent: 'epaule-d', length: 32 },
  { name: 'avant-bras-d', parent: 'bras-d', length: 32 },
  { name: 'tete', parent: 'cou', length: 7, kind: 'head' },
];
// Deux images intermédiaires par transition suffisent à garder les mains fixes.
const S = { samples: 2 };
const MAIN_G = [80, 209];
const MAIN_D = [160, 209];

// `pente` : inclinaison de la ligne des épaules (positive = épaule droite de l'écran plus basse).
const pose = (cou, pente) => ({
  angles: { cou: 90, tete: pente - 90, 'epaule-g': 180 + pente, 'epaule-d': pente },
  root: cou,
  ik: [
    { chain: ['bras-g', 'avant-bras-g'], target: MAIN_G, bend: 1 },
    { chain: ['bras-d', 'avant-bras-d'], target: MAIN_D, bend: -1 },
  ],
});

export default {
  id: 'pompes-rotation-alternee',
  title: 'Pompes avec rotation alternée',
  cycle: 4.4,
  keyTime: 0.235,
  skeleton,
  ground: 214,
  poses: {
    haut: pose([120, 150], 0),
    droite: pose([134, 180], 18),
    gauche: pose([106, 180], -18),
  },
  timeline: [
    [0, 'haut', S], [0.2, 'droite'], [0.27, 'droite', S], [0.47, 'haut'], [0.5, 'haut', S],
    [0.7, 'gauche'], [0.77, 'gauche', S], [0.97, 'haut'], [1, 'haut'],
  ],
};
