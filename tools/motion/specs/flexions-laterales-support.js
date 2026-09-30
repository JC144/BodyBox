import { squelette, angles } from './_allonge-cote.js';

// N : allongé sur le côté sur une chaise, le buste dépassant à partir des hanches, pieds bloqués
// contre un montant ; le buste descend vers le sol par une flexion latérale puis remonte au plus haut.
const BASSIN = [118, 137];

export default {
  id: 'flexions-laterales-support',
  title: 'Flexions latérales sur support',
  cycle: 3,
  keyTime: 0.95,
  skeleton: squelette(),
  ground: 214,
  props: [
    // Chaise : assise et deux pieds
    { line: [62, 150, 114, 150] }, { line: [66, 150, 66, 214] }, { line: [110, 150, 110, 214] },
    // Montant qui bloque les pieds
    { line: [30, 116, 30, 214] },
  ],
  poses: {
    haut: { angles: angles(-30), root: BASSIN },
    bas: { angles: angles(38), root: BASSIN },
  },
  timeline: [[0, 'haut'], [0.4, 'bas'], [0.5, 'bas'], [0.9, 'haut'], [1, 'haut']],
};
