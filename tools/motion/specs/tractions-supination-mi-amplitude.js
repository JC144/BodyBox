import { tractions } from './_tractions.js';

// Exercice C2 : petites répétitions rapides autour de la position « bras parallèles au sol »,
// sans tendre les bras ni passer le menton au-dessus de la barre.
export default tractions({
  id: 'tractions-supination-mi-amplitude',
  title: 'Tractions, mi-amplitude rapide',
  cycle: 1.6,
  keyTime: 0.5,
  poses: {
    bas: { s: [104, 78], tronc: -95, tete: -96, cuisse: 70, tibia: 162, pied: 114 },
    haut: { s: [98, 58], tronc: -96, tete: -90, cuisse: 66, tibia: 158, pied: 110 },
  },
  timeline: [[0, 'bas'], [0.42, 'haut'], [0.5, 'haut'], [0.92, 'bas'], [1, 'bas']],
});
