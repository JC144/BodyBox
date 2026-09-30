import { profil } from '../rig.js';

// F : sauts verticaux enchaînés ; réception sur l'avant du pied, flexion jusqu'aux cuisses
// parallèles au sol, et rebond immédiat. En l'air, bras levés, jambes à peine fléchies.
// Personnage réduit à 85 % : bras tendus au-dessus de la tête en plein saut, il doit tenir dans le cadre.
const ORTEILS = [124, 221];
const LONGUEURS = { cuisse: 34, tibia: 34, pied: 12, tronc: 51, tete: 21, bras: 27, avantBras: 27 };

export default {
  id: 'sauts-verticaux-flexion',
  title: 'Sauts verticaux avec flexion',
  cycle: 1.6,
  keyTime: 0.43,
  skeleton: profil({ lengths: LONGUEURS }),
  ground: 226,
  poses: {
    bas: {
      angles: { cuisse: 2, tibia: 112, pied: 22, tronc: -58, tete: -64, bras: 0, 'avant-bras': -4 },
      pin: { point: 'pied', at: ORTEILS },
    },
    appel: {
      angles: { cuisse: 86, tibia: 94, pied: 50, tronc: -86, tete: -86, bras: -58, 'avant-bras': -64 },
      pin: { point: 'pied', at: ORTEILS },
    },
    air: {
      angles: { cuisse: 80, tibia: 100, pied: 62, tronc: -88, tete: -88, bras: -70, 'avant-bras': -76 },
      pin: { point: 'pied', at: [ORTEILS[0], ORTEILS[1] - 28] },
    },
  },
  timeline: [
    [0, 'bas', { ease: 'out', samples: 1 }], [0.25, 'appel', { ease: 'out', samples: 1 }], [0.4, 'air'],
    [0.46, 'air', { ease: 'in', samples: 1 }], [0.61, 'appel', { ease: 'out', samples: 1 }], [1, 'bas'],
  ],
};
