// Module partagé (ignoré par build.js) : fente latérale vue de face, exercices E4 et E5.
// Jambes très écartées ; on descend sur une jambe fléchie, l'autre reste tendue, pieds fixes.
import { face, FACE_DEBOUT } from '../rig.js';

const PIED_G = [76, 209];
const PIED_D = [172, 209];

const jambes = (bendG, bendD) => [
  { chain: ['cuisse-g', 'tibia-g'], target: PIED_G, bend: bendG },
  { chain: ['cuisse-d', 'tibia-d'], target: PIED_D, bend: bendD },
];

const debout = {
  root: [124, 141],
  angles: { ...FACE_DEBOUT, 'pied-g': 180, 'pied-d': 0, 'bras-g': 104, 'bras-d': 76, 'avant-bras-g': 95, 'avant-bras-d': 85 },
  ik: jambes(1, -1),
};

// Haut du corps d'un bloc, incliné de `d` degrés (sens horaire) par rapport à la pose debout.
const HAUT = ['tronc', 'tete', 'epaule-g', 'epaule-d', 'bras-g', 'bras-d', 'avant-bras-g', 'avant-bras-d'];
const incline = (d) => Object.fromEntries(HAUT.map((n) => [n, debout.angles[n] + d]));

// Fente sur la jambe droite de l'écran : bassin au-dessus du pied droit, jambe gauche tendue.
const droite = { root: [153, 173], angles: { ...debout.angles, ...incline(-6) }, ik: jambes(1, -1) };
// Symétrique, par rapport à l'axe x = 124.
const gauche = { root: [248 - droite.root[0], droite.root[1]], angles: { ...debout.angles, ...incline(6) }, ik: jambes(1, -1) };

export const fente = { skeleton: face({ pieds: true }), ground: 214, poses: { debout, droite, gauche } };
