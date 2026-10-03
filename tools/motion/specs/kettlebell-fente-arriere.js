import { profil } from '../rig.js';
import { avecKettlebell, KETTLEBELL, goblet } from './_kettlebell.js';

// Fente arrière en prise goblet : la jambe avant (côté éloigné) reste plantée, la jambe arrière
// recule jusqu'à ce que le genou frôle le sol, buste droit ; poussée sur le talon avant pour revenir.
const AVANT = [150, 209];
const ARRIERE = [60, 198];
const bras = (t) => {
  const g = goblet(t);
  return { ...g, 'bras-2': g.bras, 'avant-bras-2': g['avant-bras'] };
};

export default {
  id: 'kettlebell-fente-arriere',
  title: 'Fente arrière goblet',
  cycle: 3.4,
  keyTime: 0.45,
  skeleton: avecKettlebell(profil({ double: true })),
  attach: KETTLEBELL,
  ground: 214,
  poses: {
    debout: {
      angles: { 'cuisse-2': 90, 'tibia-2': 90, 'pied-2': 0, pied: 0, tronc: -90, tete: -90, ...bras(-90) },
      pin: { point: 'tibia-2', at: AVANT },
      ik: [{ chain: ['cuisse', 'tibia'], target: AVANT, bend: -1 }],
    },
    bas: {
      angles: { 'cuisse-2': 2, 'tibia-2': 92, 'pied-2': 0, pied: 48, tronc: -88, tete: -88, ...bras(-88) },
      pin: { point: 'tibia-2', at: AVANT },
      ik: [{ chain: ['cuisse', 'tibia'], target: ARRIERE, bend: -1 }],
    },
  },
  timeline: [[0, 'debout'], [0.34, 'bas'], [0.54, 'bas'], [0.92, 'debout'], [1, 'debout']],
};
