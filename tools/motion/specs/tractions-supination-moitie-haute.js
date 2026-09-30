import { tractions, MENTON, MI } from './_tractions.js';

// Exercice C1 : moitié haute de la traction, du menton au-dessus de la barre aux bras parallèles au sol.
export default tractions({
  id: 'tractions-supination-moitie-haute',
  title: 'Tractions, moitié haute',
  cycle: 2.6,
  keyTime: 0.04,
  poses: { haut: MENTON, mi: MI },
  timeline: [[0, 'haut'], [0.08, 'haut'], [0.5, 'mi'], [0.58, 'mi'], [1, 'haut']],
});
