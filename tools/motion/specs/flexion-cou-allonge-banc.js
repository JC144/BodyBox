import { profil } from '../rig.js';

// Exercice S : allongé sur le dos sur une chaise ou un banc, tête dans le vide, pieds au sol.
// La tête descend en arrière puis remonte, menton vers la poitrine. Seule la tête bouge.
const base = {
  cuisse: -14, pied: 0, tronc: 192,
  bras: -35, 'avant-bras': 22,
};
const IK_JAMBE = { chain: ['cuisse', 'tibia'], target: [174, 209], bend: -1 };
const pose = (tete) => ({
  angles: { ...base, tete },
  pin: { point: 'tronc', at: [80, 160] },
  ik: [IK_JAMBE],
});

export default {
  id: 'flexion-cou-allonge-banc',
  title: 'Flexion du cou, allongé sur un banc',
  cycle: 3.2,
  keyTime: 0.47,
  skeleton: profil(),
  ground: 214,
  // Banc (ou assise de chaise) sous le haut du dos, tête dans le vide.
  props: [{ line: [80, 172, 112, 172] }, { line: [87, 172, 87, 214] }, { line: [108, 172, 108, 214] }],
  poses: { arriere: pose(126), menton: pose(232) },
  timeline: [[0, 'arriere'], [0.4, 'menton'], [0.52, 'menton'], [0.92, 'arriere'], [1, 'arriere']],
};
