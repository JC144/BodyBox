import { rotationBaton } from './_rotation-buste-baton.js';

// Exercice T : assis au sol, genoux fléchis, pieds à plat (bloqués sous un support), bâton
// derrière les épaules ; rotations lentes à droite puis à gauche. Vue de dessus : buste penché
// en arrière (le cou est derrière le bassin), jambes vers l'avant, tapis de sol.
export default rotationBaton({
  id: 'rotations-buste-assis-sol-baton',
  title: 'Rotations du buste assis au sol, bâton',
  cycle: 4,
  amplitude: 50,
  bassin: [120, 124],
  buste: { length: 22, angle: -90 },
  jambes: { hanche: 13, cuisse: [36, 86], tibia: [28, 88], pied: [12, 90] },
  props: [{ rect: [80, 70, 80, 150], w: 2 }],
});
