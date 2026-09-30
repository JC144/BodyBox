import { profil } from '../rig.js';

// E7 : squat sur une jambe, dos à un mur ; en bas, le bout des doigts touche le mur une fraction
// de seconde. Jambe d'appui au premier plan, jambe libre (tendue devant) en retrait.
const CHEVILLE = [112, 209];
const MUR = 64;

export default {
  id: 'squat-une-jambe-dos-au-mur',
  title: 'Squat sur une jambe dos au mur',
  cycle: 3,
  keyTime: 0.43,
  skeleton: profil({ double: true }).filter((s) => !/^(avant-)?bras-2$/.test(s.name)),
  ground: 214,
  props: [{ line: [MUR, 30, MUR, 214] }],
  poses: {
    haut: {
      angles: {
        cuisse: 90, tibia: 90, pied: 0, 'cuisse-2': 45, 'tibia-2': 95, 'pied-2': 10,
        tronc: -90, tete: -90, bras: 96, 'avant-bras': 84,
      },
      pin: { point: 'tibia', at: CHEVILLE },
    },
    bas: {
      angles: {
        cuisse: -6, tibia: 122, pied: 0, 'cuisse-2': -4, 'tibia-2': 6, 'pied-2': -60,
        tronc: -56, tete: -62,
      },
      pin: { point: 'tibia', at: CHEVILLE },
      ik: [{ chain: ['bras', 'avant-bras'], target: [MUR + 7, 152], bend: -1 }],
    },
  },
  timeline: [[0, 'haut'], [0.4, 'bas'], [0.46, 'bas'], [0.9, 'haut'], [1, 'haut']],
};
