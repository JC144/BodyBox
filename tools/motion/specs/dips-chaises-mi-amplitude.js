import { dips } from './_dips.js';

// Exercice B2 : petites répétitions rapides autour de la position « bras parallèles au sol »,
// sans jamais tendre les bras ni descendre à fond.
export default dips({
  id: 'dips-chaises-mi-amplitude',
  title: 'Dips, mi-amplitude rapide',
  cycle: 1.6,
  keyTime: 0.5,
  poses: {
    haut: { alpha: -32, beta: 80, tronc: -74, cuisse: 78, tibia: 160, pied: 140 },
    bas: { alpha: 10, beta: 72, tronc: -68, cuisse: 74, tibia: 168, pied: 155 },
  },
  timeline: [[0, 'haut'], [0.44, 'bas'], [0.52, 'bas'], [0.92, 'haut'], [1, 'haut']],
});
