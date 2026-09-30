import { profil } from '../rig.js';

// H : suspendu à une barre, on ramène les genoux (jambes pliées) vers la poitrine, puis on
// redescend jusqu'aux cuisses parallèles au sol. Mains fixes sur la barre (vue en bout, un disque).
const BARRE = [128, 22];
const MAINS = [BARRE[0], BARRE[1] + 9];
const bras = { bras: -80, 'avant-bras': -84 };

export default {
  id: 'releve-genoux-suspendu',
  title: 'Relevé de genoux suspendu',
  cycle: 2.6,
  keyTime: 0.45,
  skeleton: profil(),
  ground: 226,
  props: [{ circle: [...BARRE, 5], fill: true }, { line: [BARRE[0] - 34, BARRE[1], BARRE[0] + 34, BARRE[1]], w: 3 }],
  poses: {
    bas: {
      angles: { ...bras, tronc: -92, tete: -58, cuisse: 2, tibia: 94, pied: 60 },
      pin: { point: 'avant-bras', at: MAINS },
    },
    haut: {
      angles: { ...bras, tronc: -118, tete: -66, cuisse: -88, tibia: 62, pied: 30 },
      pin: { point: 'avant-bras', at: MAINS },
    },
  },
  timeline: [[0, 'bas'], [0.4, 'haut'], [0.5, 'haut'], [0.95, 'bas'], [1, 'bas']],
};
