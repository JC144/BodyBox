import { tractions, MENTON } from './_tractions.js';

// Exercice C3 : deux tiers de la traction, du menton au-dessus de la barre à une position basse,
// bras encore fléchis.
export default tractions({
  id: 'tractions-supination-deux-tiers',
  title: "Tractions, deux tiers d'amplitude",
  cycle: 2.8,
  keyTime: 0.5,
  poses: {
    bas: { s: [112, 86], tronc: -95, tete: -104, cuisse: 72, tibia: 164, pied: 115 },
    haut: MENTON,
  },
  timeline: [[0, 'bas'], [0.42, 'haut'], [0.52, 'haut'], [0.92, 'bas'], [1, 'bas']],
});
