import { squat, pose, DEBOUT } from './_squat-une-jambe-e.js';

// Exercice E1 : descente jusqu'à la cuisse parallèle au sol, jambe libre tendue devant.
export default squat({
  id: 'squat-une-jambe-assiste-cuisse-parallele',
  title: 'Squat une jambe, cuisse parallèle',
  cycle: 2.8,
  keyTime: 0.45,
  poses: { haut: DEBOUT, bas: pose(4, 118, -52, [22, 32, -55]) },
  timeline: [[0, 'haut'], [0.4, 'bas'], [0.5, 'bas'], [0.9, 'haut'], [1, 'haut']],
});
