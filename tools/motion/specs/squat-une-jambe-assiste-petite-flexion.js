import { squat, pose, DEBOUT } from './_squat-une-jambe-e.js';

// Exercice E : petite flexion sur une jambe (moins de la moitié du chemin vers la cuisse parallèle).
export default squat({
  id: 'squat-une-jambe-assiste-petite-flexion',
  title: 'Squat une jambe, petite flexion',
  cycle: 2.2,
  keyTime: 0.45,
  poses: { haut: DEBOUT, bas: pose(52, 112, -68, [45, 62, -25]) },
  timeline: [[0, 'haut'], [0.4, 'bas'], [0.5, 'bas'], [0.9, 'haut'], [1, 'haut']],
});
