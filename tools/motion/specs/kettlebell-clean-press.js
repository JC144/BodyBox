import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL, REDUIT } from './_kettlebell.js';

// Clean & press à un bras : départ en charnière de hanche, kettlebell pendue ; extension des hanches
// et ramené en position de rack (cloche posée sur l'avant-bras) ; développé au-dessus de la tête ;
// retour au rack, puis descente entre les jambes. En haut, la cloche est dessinée au-dessus de la main
// pour rester lisible de profil.
const CHEVILLE = [112, 209];
const pin = { point: 'tibia', at: CHEVILLE };
const debout = { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90 };

export default {
  id: 'kettlebell-clean-press',
  title: 'Clean & press',
  cycle: 4,
  keyTime: 0.54,
  skeleton: avecKettlebell(profil({ lengths: REDUIT })),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    depart: { angles: { cuisse: 62, tibia: 100, pied: 0, tronc: -32, tete: -28, bras: 90, 'avant-bras': 90, kb: 90 }, pin },
    rack: { angles: { ...debout, bras: 80, 'avant-bras': -80, kb: 135 }, pin },
    press: { angles: { ...debout, bras: -76, 'avant-bras': -84, kb: -30 }, pin },
  },
  timeline: [
    [0, 'depart', { ease: 'out', samples: 2 }], [0.2, 'rack'], [0.3, 'rack', { ease: 'out', samples: 1 }], [0.46, 'press'],
    [0.6, 'press'], [0.76, 'rack'], [0.82, 'rack'], [1, 'depart'],
  ],
};
