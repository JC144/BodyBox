import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL, REDUIT, goblet } from './_kettlebell.js';

// Thruster goblet : depuis le bas d'un goblet squat, on remonte et on enchaîne d'un seul élan le
// développé de la kettlebell au-dessus de la tête ; retour à la poitrine, puis nouvelle descente.
const CHEVILLE = [104, 209];
const pin = { point: 'tibia', at: CHEVILLE };
const debout = { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90 };

export default {
  id: 'kettlebell-thruster',
  title: 'Thruster goblet',
  cycle: 3.2,
  keyTime: 0.36,
  skeleton: avecKettlebell(profil({ lengths: REDUIT })),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    bas: { angles: { cuisse: 6, tibia: 122, pied: 0, tronc: -64, tete: -70, ...goblet(-64) }, pin },
    haut: { angles: { ...debout, bras: -76, 'avant-bras': -84, kb: -30 }, pin },
    rack: { angles: { ...debout, ...goblet(-90) }, pin },
  },
  timeline: [
    [0, 'bas', { ease: 'out', samples: 2 }], [0.3, 'haut'], [0.42, 'haut'], [0.58, 'rack'], [0.62, 'rack'], [0.94, 'bas'], [1, 'bas'],
  ],
};
