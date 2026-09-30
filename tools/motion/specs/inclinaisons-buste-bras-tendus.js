import { profil } from '../rig.js';

// M1 : debout, genoux légèrement fléchis, bras tendus dans le prolongement du buste ;
// le buste bascule vers l'avant jusqu'à l'horizontale, dos droit, puis revient à la verticale.
// Bras tendus dans le prolongement du buste, tête un peu rentrée entre les bras pour rester lisible.
const buste = (t) => ({ tronc: t, tete: t + 28, bras: t - 12, 'avant-bras': t - 12 });
const PIED = { point: 'tibia', at: [92, 223] };

export default {
  id: 'inclinaisons-buste-bras-tendus',
  title: 'Inclinaisons du buste bras tendus',
  cycle: 3.4,
  keyTime: 0.5,
  skeleton: profil(),
  ground: 228,
  poses: {
    debout: { angles: { cuisse: 86, tibia: 96, pied: 0, ...buste(-86) }, pin: PIED },
    penche: { angles: { cuisse: 64, tibia: 100, pied: 0, ...buste(-4) }, pin: PIED },
  },
  timeline: [[0, 'debout'], [0.42, 'penche'], [0.6, 'penche'], [0.94, 'debout'], [1, 'debout']],
};
