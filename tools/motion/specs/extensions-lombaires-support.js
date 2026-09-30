import { profil } from '../rig.js';

// M : allongé à plat ventre sur un support haut (~110 cm), hanches au bord, pieds maintenus ;
// le buste descend vers le sol puis remonte jusqu'à l'horizontale, mains sur la nuque.
const HANCHE = [100, 94];
// Mains croisées sur la nuque, coudes vers l'avant.
const buste = (t) => ({ cuisse: 180, tibia: 180, tronc: t, tete: t, bras: t - 50, 'avant-bras': t + 152 });

export default {
  id: 'extensions-lombaires-support',
  title: 'Extensions lombaires sur support',
  cycle: 3,
  keyTime: 0.45,
  skeleton: profil({ pieds: false }),
  ground: 214,
  props: [
    // Tréteau : plateau et pieds écartés
    { line: [14, 104, 94, 104] },
    { line: [30, 104, 18, 214] }, { line: [30, 104, 42, 214] },
    { line: [80, 104, 68, 214] }, { line: [80, 104, 92, 214] },
  ],
  poses: {
    haut: { angles: buste(0), root: HANCHE },
    bas: { angles: buste(78), root: HANCHE },
  },
  timeline: [[0, 'haut'], [0.4, 'bas'], [0.5, 'bas'], [0.9, 'haut'], [1, 'haut']],
};
