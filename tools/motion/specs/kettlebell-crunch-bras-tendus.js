import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL } from './_kettlebell.js';

// Crunch kettlebell bras tendus : allongé sur le dos, tête à gauche, genoux fléchis, kettlebell
// tenue à deux mains bras tendus au-dessus de la poitrine. Le buste s'enroule en poussant la
// kettlebell vers le plafond, les bras restant verticaux, puis redescend lentement.
const jambes = { cuisse: -55, tibia: 55, pied: 0 };
const bras = { bras: -90, 'avant-bras': -90, kb: -90 };

export default {
  id: 'kettlebell-crunch-bras-tendus',
  title: 'Crunch kettlebell bras tendus',
  cycle: 2.6,
  keyTime: 0.45,
  skeleton: avecKettlebell(profil()),
  attach: KETTLEBELL,
  ground: 172,
  poses: {
    bas: { angles: { ...jambes, tronc: 190, tete: 190, ...bras }, root: [124, 167] },
    haut: { angles: { ...jambes, tronc: 222, tete: 236, ...bras }, root: [124, 167] },
  },
  timeline: [[0, 'bas'], [0.38, 'haut'], [0.5, 'haut'], [0.94, 'bas'], [1, 'bas']],
};
