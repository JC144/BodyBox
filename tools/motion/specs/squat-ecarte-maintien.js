import { face, FACE_DEBOUT, solvePose } from '../rig.js';

// F2 : squat jambes écartées tenu (vue de face), cuisses presque parallèles au sol,
// dos droit, mains en appui sur les cuisses. Entrée, maintien, sortie.
const skeleton = face({ pieds: true });
const PIED_G = [70, 209];
const PIED_D = [170, 209];
const jambes = [
  { chain: ['cuisse-g', 'tibia-g'], target: PIED_G, bend: 1 },
  { chain: ['cuisse-d', 'tibia-d'], target: PIED_D, bend: -1 },
];
const angles = { ...FACE_DEBOUT, 'pied-g': 200, 'pied-d': -20 };

// Mains posées sur les cuisses, aux deux tiers vers le genou.
const pose = (y) => {
  const { pts } = solvePose(skeleton, { root: [120, y], angles, ik: jambes });
  const main = (c) => [pts.start[c][0] + (pts.end[c][0] - pts.start[c][0]) * 0.75, pts.start[c][1] + (pts.end[c][1] - pts.start[c][1]) * 0.75 - 6];
  return {
    root: [120, y], angles,
    ik: [...jambes,
      { chain: ['bras-g', 'avant-bras-g'], target: main('cuisse-g'), bend: 1 },
      { chain: ['bras-d', 'avant-bras-d'], target: main('cuisse-d'), bend: -1 }],
  };
};

export default {
  id: 'squat-ecarte-maintien',
  title: 'Squat écarté tenu',
  cycle: 4,
  keyTime: 0.5,
  skeleton,
  ground: 214,
  poses: { debout: pose(140), bas: pose(162) },
  timeline: [[0, 'debout'], [0.2, 'bas'], [0.8, 'bas'], [0.95, 'debout'], [1, 'debout']],
};
