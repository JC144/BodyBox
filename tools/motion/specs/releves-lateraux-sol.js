import { squelette, angles } from './_allonge-cote.js';

// N1 : allongé sur le côté au sol, jambes tendues l'une sur l'autre ; le buste se décolle du sol
// par une flexion latérale, puis redescend sans élan.
const BASSIN = [104, 199];

export default {
  id: 'releves-lateraux-sol',
  title: 'Relevés latéraux au sol',
  cycle: 2.4,
  keyTime: 0.45,
  skeleton: squelette(),
  ground: 214,
  poses: {
    bas: { angles: angles(-4, 181), root: BASSIN },
    haut: { angles: angles(-36, 181), root: BASSIN },
  },
  timeline: [[0, 'bas'], [0.4, 'haut'], [0.52, 'haut'], [0.92, 'bas'], [1, 'bas']],
};
