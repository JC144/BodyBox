import { profil } from '../rig.js';

// Exercice Z (et sa suite) : le pont arrière, en trois étapes enchaînées.
// 1. Allongé sur le dos, genoux fléchis, pieds parallèles à plat ; mains à plat au sol de part et
//    d'autre de la tête, doigts vers les pieds, coudes en l'air.
// 2. En poussant sur les bras et en soulevant les hanches, on pose le sommet du crâne au sol.
// 3. On tend les bras en arquant le dos (pont complet), avec un balancier du cou : menton vers la
//    poitrine, puis tête relâchée. Retour par l'étape 2.
// Pieds (chevilles) et mains fixes ; les épaules sont épinglées, jambes et bras en IK.
const CHEVILLE = [66, 209];
const MAINS = [162, 209];
const pose = (epaules, tronc, tete) => ({
  angles: { tronc, tete, pied: 180 },
  pin: { point: 'tronc', at: epaules },
  ik: [
    { chain: ['cuisse', 'tibia'], target: CHEVILLE, bend: 1 },
    { chain: ['bras', 'avant-bras'], target: MAINS, bend: -1 },
  ],
});

export default {
  id: 'pont-arriere-roue',
  title: 'Pont arrière (roue)',
  cycle: 4,
  keyTime: 0.5,
  skeleton: profil(),
  ground: 214,
  poses: {
    allonge: pose([150, 209], 0, -22),
    crane: pose([152, 180], 24, 44),
    pont: pose([150, 152], 12, 100),
    menton: pose([150, 152], 12, 128),
  },
  timeline: [
    [0, 'allonge'], [0.06, 'allonge', { samples: 2 }], [0.24, 'crane'], [0.3, 'crane', { samples: 2 }], [0.46, 'pont', { samples: 1 }],
    [0.54, 'menton', { samples: 1 }], [0.62, 'pont'], [0.66, 'pont', { samples: 2 }], [0.82, 'crane', { samples: 2 }], [0.96, 'allonge'], [1, 'allonge'],
  ],
};
