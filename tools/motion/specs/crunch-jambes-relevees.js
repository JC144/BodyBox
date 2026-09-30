import { profil } from '../rig.js';

// G : crunch jambes repliées en l'air (cuisses verticales, tibias horizontaux), mains aux tempes.
// Le buste s'enroule vers le bassin ; le bas du dos et les jambes ne bougent pas.
const SOL = 170;
const jambes = { cuisse: -96, tibia: -4, pied: -50 };
// Buste incliné de `a` degrés par rapport au sol (0 = allongé), tête et bras solidaires.
const buste = (a) => ({ tronc: 180 + a, tete: 200 + a, bras: 262 + a, 'avant-bras': 135 + a });

export default {
  id: 'crunch-jambes-relevees',
  title: 'Crunch jambes relevées',
  cycle: 2.2,
  keyTime: 0.45,
  skeleton: profil(),
  ground: SOL,
  poses: {
    bas: { root: [140, SOL - 7], angles: { ...jambes, ...buste(0) } },
    haut: { root: [140, SOL - 7], angles: { ...jambes, ...buste(30), tete: 238 } },
  },
  timeline: [[0, 'bas'], [0.4, 'haut'], [0.5, 'haut'], [0.95, 'bas'], [1, 'bas']],
};
