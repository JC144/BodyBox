import { rotationBaton } from './_rotation-buste-baton.js';

// Exercice X : assis sur un tabouret (ou une chaise), jambes écartées, pieds au sol, bâton
// derrière les épaules ; rotations lentes et régulières à droite puis à gauche, bassin immobile.
// Vue de dessus : assise ronde du tabouret sous le bassin, cuisses écartées vers l'avant.
// Le cou est placé un peu derrière le bassin pour que la ligne des hanches reste visible
// (repère fixe face à la carrure qui tourne), alors que le livre demande de se pencher
// légèrement en avant : écart assumé au profit de la lisibilité.
export default rotationBaton({
  id: 'rotations-buste-tabouret-baton',
  title: 'Rotations du buste sur tabouret, bâton',
  cycle: 4,
  amplitude: 50,
  bassin: [120, 124],
  buste: { length: 20, angle: -90 },
  jambes: { hanche: 13, cuisse: [40, 70], tibia: [16, 80], pied: [12, 88] },
  props: [{ circle: [120, 124, 26], w: 3 }],
});
