import { profil } from '../rig.js';
import { decor, buste, X, CHEVILLE, HAUT, ASSIS } from './_chaise-murale.js';

// F1 : chaise contre le mur, cuisses parallèles au sol ; maintien (entrée, maintien, sortie).
const jambe = { chain: ['cuisse', 'tibia'], target: CHEVILLE, bend: -1 };

export default {
  id: 'chaise-contre-mur',
  title: 'Chaise contre le mur',
  cycle: 4,
  keyTime: 0.5,
  skeleton: profil(),
  ...decor,
  poses: {
    debout: {
      root: [X, HAUT], angles: buste,
      ik: [jambe, { chain: ['bras', 'avant-bras'], target: [X + 8, HAUT + 2], bend: -1 }],
    },
    assis: {
      root: [X, ASSIS], angles: buste,
      ik: [jambe, { chain: ['bras', 'avant-bras'], target: [X + 32, ASSIS - 8], bend: -1 }],
    },
  },
  timeline: [[0, 'debout'], [0.2, 'assis'], [0.8, 'assis'], [0.95, 'debout'], [1, 'debout']],
};
