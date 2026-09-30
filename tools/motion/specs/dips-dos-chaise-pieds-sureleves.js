import { profil } from '../rig.js';

// Exercice D : dips dos à une chaise, talons sur une autre chaise. Mains au bord de l'assise d'une chaise (à droite, derrière
// le dos), talons sur une autre chaise (à gauche), jambes presque tendues. Vue de profil, tête à gauche.
const G = 214;
const MAIN = [152, 165];
const TALON = [64, 160];

const pose = (bras, avantBras, tronc) => ({
  angles: { tronc, tete: tronc, bras, 'avant-bras': avantBras, pied: -110 },
  pin: { point: 'avant-bras', at: MAIN },
  ik: [{ chain: ['cuisse', 'tibia'], target: TALON, bend: 1 }],
});

export default {
  id: 'dips-dos-chaise-pieds-sureleves',
  title: 'Dips dos à la chaise, pieds surélevés',
  cycle: 2.6,
  keyTime: 0.475,
  skeleton: profil(),
  ground: G,
  props: [
    // Chaise des mains : assise, pieds, dossier à droite.
    { polyline: [148, 170, 200, 170] }, { line: [152, 170, 152, G] }, { line: [196, 170, 196, G] }, { line: [196, 170, 202, 110] },
    // Chaise (ou tabouret) des talons.
    { line: [50, 166, 88, 166] }, { line: [56, 166, 52, G] }, { line: [82, 166, 86, G] },
  ],
  poses: {
    haut: pose(80, 85, -87),
    bas: pose(10, 100, -95),
  },
  timeline: [[0, 'haut'], [0.45, 'bas'], [0.5, 'bas'], [0.92, 'haut'], [1, 'haut']],
};
