import { squat, pose, DEBOUT } from './_squat-une-jambe-e.js';

// Exercice E2 : descente la plus basse possible, puis remontée jusqu'à la jambe tendue.
export default squat({
  id: 'squat-une-jambe-assiste-flexion-complete',
  title: 'Squat une jambe, flexion complète',
  cycle: 3.2,
  keyTime: 0.45,
  poses: { haut: DEBOUT, bas: pose(-28, 126, -45, [-2, 8, -75]) },
  timeline: [[0, 'haut'], [0.4, 'bas'], [0.5, 'bas'], [0.9, 'haut'], [1, 'haut']],
});
