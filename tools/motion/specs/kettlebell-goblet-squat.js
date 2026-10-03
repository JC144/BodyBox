import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL, goblet } from './_kettlebell.js';

// Goblet squat : kettlebell contre la poitrine, descente cuisses sous la parallèle, buste droit,
// deux secondes d'arrêt en bas. Les pieds restent à plat.
const CHEVILLE = [104, 209];
const pin = { point: 'tibia', at: CHEVILLE };

export default {
  id: 'kettlebell-goblet-squat',
  title: 'Goblet squat',
  cycle: 3.2,
  keyTime: 0.45,
  skeleton: avecKettlebell(profil()),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    haut: { angles: { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90, ...goblet(-90) }, pin },
    bas: { angles: { cuisse: 6, tibia: 122, pied: 0, tronc: -64, tete: -70, ...goblet(-64) }, pin },
  },
  timeline: [[0, 'haut'], [0.32, 'bas'], [0.58, 'bas'], [0.94, 'haut'], [1, 'haut']],
};
