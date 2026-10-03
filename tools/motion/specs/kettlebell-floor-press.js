import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL } from './_kettlebell.js';

// Développé au sol à un bras : allongé sur le dos, tête à gauche, genoux fléchis. Départ coude posé
// au sol, avant-bras vertical, kettlebell dans la main ; on pousse jusqu'à tendre le bras à la
// verticale de l'épaule, arrêt, puis on redescend jusqu'à reposer le coude.
const jambes = { cuisse: -55, tibia: 55, pied: 0 };
const buste = { tronc: 190, tete: 190 };
const root = [124, 167];

export default {
  id: 'kettlebell-floor-press',
  title: 'Développé au sol',
  cycle: 2.6,
  keyTime: 0.45,
  skeleton: avecKettlebell(profil()),
  attach: KETTLEBELL,
  ground: 172,
  poses: {
    bas: { angles: { ...jambes, ...buste, bras: 16, 'avant-bras': -90, kb: -90 }, root },
    haut: { angles: { ...jambes, ...buste, bras: -90, 'avant-bras': -90, kb: -90 }, root },
  },
  timeline: [[0, 'bas'], [0.36, 'haut'], [0.5, 'haut'], [0.92, 'bas'], [1, 'bas']],
};
