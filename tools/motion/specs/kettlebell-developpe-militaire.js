import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL, REDUIT } from './_kettlebell.js';

// Développé militaire à un bras : debout, gainé, kettlebell en position de rack (cloche posée sur
// l'avant-bras). On pousse jusqu'à tendre le bras au-dessus de la tête, arrêt, puis on redescend au
// rack. Les jambes ne participent pas. Comme pour le clean & press, la cloche est dessinée au-dessus
// de la main en haut, pour rester lisible de profil.
const CHEVILLE = [112, 209];
const pin = { point: 'tibia', at: CHEVILLE };
const debout = { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90 };

export default {
  id: 'kettlebell-developpe-militaire',
  title: 'Développé militaire',
  cycle: 2.8,
  keyTime: 0.45,
  skeleton: avecKettlebell(profil({ lengths: REDUIT })),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    rack: { angles: { ...debout, bras: 80, 'avant-bras': -80, kb: 135 }, pin },
    press: { angles: { ...debout, bras: -76, 'avant-bras': -84, kb: -30 }, pin },
  },
  timeline: [[0, 'rack'], [0.08, 'rack'], [0.38, 'press'], [0.54, 'press'], [0.92, 'rack'], [1, 'rack']],
};
