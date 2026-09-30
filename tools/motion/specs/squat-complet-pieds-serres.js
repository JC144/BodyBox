import { profil } from '../rig.js';

// E6 : squat complet pieds serrés, bras tendus devant ; deux secondes d'arrêt en bas.
const CHEVILLE = [104, 209];

export default {
  id: 'squat-complet-pieds-serres',
  title: 'Squat complet pieds serrés',
  cycle: 4,
  keyTime: 0.5,
  skeleton: profil(),
  ground: 214,
  poses: {
    haut: {
      angles: { cuisse: 90, tibia: 90, pied: 0, tronc: -90, tete: -90, bras: 88, 'avant-bras': 86 },
      pin: { point: 'tibia', at: CHEVILLE },
    },
    bas: {
      angles: { cuisse: 4, tibia: 124, pied: 0, tronc: -58, tete: -66, bras: -4, 'avant-bras': -4 },
      pin: { point: 'tibia', at: CHEVILLE },
    },
  },
  timeline: [[0, 'haut'], [0.25, 'bas'], [0.75, 'bas'], [0.95, 'haut'], [1, 'haut']],
};
