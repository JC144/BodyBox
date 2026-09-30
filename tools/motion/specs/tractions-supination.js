import { tractions, BAS, MENTON } from './_tractions.js';

// Exercice C : traction complète en supination, des bras tendus au menton au-dessus de la barre.
export default tractions({
  id: 'tractions-supination',
  title: 'Tractions en supination',
  cycle: 3.2,
  keyTime: 0.5,
  poses: { bas: BAS, haut: MENTON },
  timeline: [[0, 'bas'], [0.42, 'haut'], [0.52, 'haut'], [0.92, 'bas'], [1, 'bas']],
});
