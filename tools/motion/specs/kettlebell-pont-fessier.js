import { profil } from '../rig.js';

// Pont fessier : allongé sur le dos, tête à gauche, genoux fléchis, pieds à plat, kettlebell posée
// sur le bassin. Les fesses montent jusqu'à aligner genoux, hanches et épaules,
// arrêt, puis redescente. Les épaules et les pieds restent fixes ; la kettlebell suit le bassin.
const SOL = 172;
const EPAULE = [72, 161];
const CHEVILLE = [182, 167];

// Kettlebell attachée au tronc, posée sur la hanche (coordonnées locales : y vers le haut quand le
// tronc pointe vers la tête). Les bras restent au sol le long du corps : tendus vers l'anse, ils
// brouillaient la silhouette du pont.
const pose = (tronc) => ({
  angles: { pied: 0, tronc, tete: 190, bras: 10, 'avant-bras': 0 },
  pin: { point: 'tronc', at: EPAULE },
  ik: [{ chain: ['cuisse', 'tibia'], target: CHEVILLE, bend: -1 }],
});

export default {
  id: 'kettlebell-pont-fessier',
  title: 'Pont fessier',
  cycle: 2.8,
  keyTime: 0.45,
  skeleton: profil(),
  ground: SOL,
  attach: { tronc: [{ circle: [4, 31, 6], w: 4 }, { circle: [4, 16, 11], fill: true }] },
  poses: { bas: pose(185), haut: pose(155) },
  timeline: [[0, 'bas'], [0.36, 'haut'], [0.56, 'haut'], [0.94, 'bas'], [1, 'bas']],
};
