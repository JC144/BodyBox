import { profil } from '../rig.js';

// K : départ en planche sur les avant-bras, mains à plat un peu devant la tête ;
// on tend les bras en gardant les paumes au sol, le corps reste droit et pivote autour des pieds.
const corps = (a, tete = a) => ({ cuisse: 180 + a, tibia: 180 + a, tronc: a, tete });
const PIEDS = [30, 209];
const MAINS = [198, 209];
const pose = (a, tete) => ({
  angles: corps(a, tete),
  pin: { point: 'tibia', at: PIEDS },
  ik: [{ chain: ['bras', 'avant-bras'], target: MAINS, bend: 1 }],
});

export default {
  id: 'extensions-triceps-avant-bras-sol',
  title: 'Extensions triceps sur les avant-bras',
  cycle: 2.6,
  keyTime: 0.45,
  skeleton: profil({ pieds: false }),
  ground: 214,
  poses: {
    bas: pose(-13.2, -8),
    haut: pose(-21.7, -14),
  },
  timeline: [[0, 'bas'], [0.4, 'haut'], [0.5, 'haut'], [0.95, 'bas'], [1, 'bas']],
};
