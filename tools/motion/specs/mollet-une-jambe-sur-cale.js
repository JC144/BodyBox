import { profil } from '../rig.js';

// Exercice W : debout sur une cale d'au moins 15 cm, en appui sur un seul pied (avant-pied sur
// le bord de la cale, talon dans le vide), l'autre jambe repliée derrière ; le bout des doigts
// contre un mur pour l'équilibre. Le talon descend le plus bas possible, puis on monte sur la
// pointe. L'avant-pied est épinglé sur l'arête de la cale ; le corps entier monte et descend.
// Personnage un peu raccourci pour tenir dans le cadre, cale comprise.
const CALE = 118; // arête arrière de la cale (dessus à y = 197)
const MUR = 170;
const pose = (pied) => ({
  angles: {
    cuisse: 90, tibia: 90, pied,
    'cuisse-2': 102, 'tibia-2': 152, 'pied-2': 104,
    tronc: -90, tete: -90, 'bras-2': 97, 'avant-bras-2': 102,
  },
  pin: { point: 'pied@0.7', at: [CALE + 3, 192] },
  ik: [{ chain: ['bras', 'avant-bras'], target: [MUR - 7, 104], bend: 1 }],
});

export default {
  id: 'mollet-une-jambe-sur-cale',
  title: 'Mollet sur une jambe, sur une cale',
  cycle: 3.2,
  keyTime: 0.47,
  skeleton: profil({ double: true, lengths: { cuisse: 37, tibia: 37, tronc: 55 } }),
  ground: 214,
  props: [
    { rect: [CALE, 199, 30, 15] }, // cale
    { line: [MUR, 30, MUR, 214] }, // mur
  ],
  poses: { bas: pose(-30), haut: pose(55) },
  timeline: [[0, 'bas'], [0.1, 'bas'], [0.42, 'haut'], [0.55, 'haut'], [1, 'bas']],
};
