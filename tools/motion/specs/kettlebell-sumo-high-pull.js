import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL } from './_kettlebell.js';

// Sumo deadlift high pull : pieds larges, charnière de hanche, kettlebell pendue entre les jambes.
// Extension explosive des hanches, puis les coudes tirent vers le haut et l'arrière jusqu'à amener
// la kettlebell sous le menton ; redescente contrôlée.
const CHEVILLE = [112, 209];
const pin = { point: 'tibia', at: CHEVILLE };
const debout = { cuisse: 90, tibia: 90, pied: 0, tronc: -92, tete: -90 };

export default {
  id: 'kettlebell-sumo-high-pull',
  title: 'Sumo deadlift high pull',
  cycle: 2.6,
  keyTime: 0.44,
  skeleton: avecKettlebell(profil()),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    bas: { angles: { cuisse: 62, tibia: 100, pied: 0, tronc: -38, tete: -32, bras: 90, 'avant-bras': 90, kb: 90 }, pin },
    extension: { angles: { ...debout, bras: 82, 'avant-bras': 82, kb: 90 }, pin },
    haut: { angles: { ...debout, bras: 205, 'avant-bras': 12, kb: 90 }, pin },
  },
  timeline: [
    [0, 'bas', { ease: 'out', samples: 2 }], [0.22, 'extension', { ease: 'out', samples: 2 }], [0.38, 'haut'],
    [0.5, 'haut'], [0.68, 'extension'], [1, 'bas'],
  ],
};
