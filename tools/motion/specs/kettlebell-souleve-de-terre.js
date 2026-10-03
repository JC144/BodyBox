import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL } from './_kettlebell.js';

// Soulevé de terre : kettlebell posée au sol, hanches en arrière, dos plat, bras tendus. On se
// redresse en poussant le sol jusqu'à hanches tendues, kettlebell contre les cuisses, puis on la
// repose en reculant les hanches. Arrêt bref en haut et au sol.
const CHEVILLE = [100, 209];
const pin = { point: 'tibia', at: CHEVILLE };

export default {
  id: 'kettlebell-souleve-de-terre',
  title: 'Soulevé de terre',
  cycle: 3,
  keyTime: 0.45,
  skeleton: avecKettlebell(profil()),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    bas: { angles: { cuisse: 35, tibia: 108, pied: 0, tronc: -32, tete: -26, bras: 90, 'avant-bras': 90, kb: 90 }, pin },
    haut: { angles: { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90, bras: 86, 'avant-bras': 86, kb: 90 }, pin },
  },
  timeline: [[0, 'bas'], [0.1, 'bas'], [0.4, 'haut'], [0.55, 'haut'], [0.92, 'bas'], [1, 'bas']],
};
