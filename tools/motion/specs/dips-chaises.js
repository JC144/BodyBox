import { dips, HAUT } from './_dips.js';

// Exercice B : dips complets entre deux chaises, jambes fléchies.
export default dips({
  id: 'dips-chaises',
  title: 'Dips entre deux chaises',
  cycle: 3,
  keyTime: 0.5,
  poses: {
    haut: HAUT,
    bas: { alpha: 22, beta: 68, tronc: -66, cuisse: 72, tibia: 172, pied: 160 },
  },
  timeline: [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.93, 'haut'], [1, 'haut']],
});
