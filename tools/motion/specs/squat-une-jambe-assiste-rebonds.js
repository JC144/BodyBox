import { squat, pose } from './_squat-une-jambe-e.js';

// Exercice E3 : rebonds rapides autour de la position basse, sans jamais tendre la jambe.
export default squat({
  id: 'squat-une-jambe-assiste-rebonds',
  title: 'Squat une jambe en rebonds',
  cycle: 1.6,
  keyTime: 0.45,
  poses: { moyen: pose(28, 115, -58, [30, 45, -40]), bas: pose(-8, 120, -50, [14, 24, -62]) },
  timeline: [[0, 'moyen'], [0.4, 'bas'], [0.5, 'bas'], [0.9, 'moyen'], [1, 'moyen']],
});
