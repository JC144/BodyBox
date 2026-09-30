import { dips, HAUT } from './_dips.js';

// Exercice B1 : dips en demi-amplitude, arrêt quand les bras sont parallèles au sol.
export default dips({
  id: 'dips-chaises-demi-amplitude',
  title: 'Dips, demi-amplitude',
  cycle: 2.4,
  keyTime: 0.5,
  poses: {
    haut: HAUT,
    bas: { alpha: 0, beta: 74, tronc: -70, cuisse: 76, tibia: 166, pied: 150 },
  },
  timeline: [[0, 'haut'], [0.44, 'bas'], [0.54, 'bas'], [0.92, 'haut'], [1, 'haut']],
});
