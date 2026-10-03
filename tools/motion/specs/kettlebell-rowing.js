import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL } from './_kettlebell.js';

// Rowing penché à un bras : buste presque horizontal, dos plat, genoux souples. Le coude monte vers
// l'arrière en frôlant le buste jusqu'à amener la kettlebell à la hanche, arrêt, puis descente.
const CHEVILLE = [96, 209];
const pin = { point: 'tibia', at: CHEVILLE };
const corps = { cuisse: 70, tibia: 100, pied: 0, tronc: -18, tete: -14 };

export default {
  id: 'kettlebell-rowing',
  title: 'Rowing penché à un bras',
  cycle: 2.6,
  keyTime: 0.42,
  skeleton: avecKettlebell(profil()),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    bas: { angles: { ...corps, bras: 90, 'avant-bras': 90, kb: 90 }, pin },
    haut: { angles: { ...corps, bras: 195, 'avant-bras': 90, kb: 90 }, pin },
  },
  timeline: [[0, 'bas'], [0.34, 'haut'], [0.5, 'haut'], [0.92, 'bas'], [1, 'bas']],
};
