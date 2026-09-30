import { face, profil } from '../rig.js';

// Tractions à la barre fixe (exercices I, I1…I5, I7), vues de dos comme dans le livre : la largeur
// de prise se lit, ce qui n'est pas le cas de profil. Les mains restent sur la barre (IK), le corps
// monte et descend d'un bloc ; jambes fléchies et croisées (tibias raccourcis par la perspective).
//
// Options :
//   prise : demi-écart des mains (le demi-écart des épaules vaut 16) ;
//   haut  : distance barre → épaules en position haute (≈ 2 nuque contre la barre, ≈ 8 menton au-dessus) ;
//   bas   : distance barre → épaules en position basse (≈ 50 bras tendus en prise large).
export const BARRE = 36;
const X = 120;

export function tractions({ id, title, prise, haut, bas, cycle = 2.8 }) {
  const mains = [[X - prise, BARRE - 1], [X + prise, BARRE - 1]];
  const pose = (d, hausse) => ({
    root: [X, BARRE + d + 60],
    angles: {
      'hanche-g': 180, 'hanche-d': 0, 'cuisse-g': 86, 'cuisse-d': 94, 'tibia-g': 62, 'tibia-d': 118,
      tronc: -90, tete: -90, 'epaule-g': 180 + hausse, 'epaule-d': -hausse,
    },
    ik: [
      { chain: ['bras-g', 'avant-bras-g'], target: mains[0], bend: -1 },
      { chain: ['bras-d', 'avant-bras-d'], target: mains[1], bend: 1 },
    ],
  });
  return {
    id,
    title,
    cycle,
    keyTime: 0.45,
    skeleton: face({ lengths: { cuisse: 36, tibia: 26 } }),
    ground: 234,
    props: [{ line: [24, BARRE, 216, BARRE], w: 5 }],
    poses: { bas: pose(bas, bas > 40 ? 10 : 4), haut: pose(haut, 0) },
    // Montée franche, arrêt en haut, descente contrôlée, court arrêt en bas.
    timeline: [[0, 'bas', { ease: 'out', samples: 3 }], [0.4, 'haut'], [0.5, 'haut'], [0.94, 'bas'], [1, 'bas']],
  };
}

// Tractions prise serrée ou à largeur d'épaules (I3, I5), vues de profil, tête à droite : les coudes
// travaillent vers l'avant, dans le plan du profil, et le menton passe au-dessus de la barre (vue en
// bout ; on la dessine pourtant en long, plus lisible). Mains fixes sur la barre, jambes fléchies, pieds croisés en arrière.
const BX = 148;
export function tractionsProfil({ id, title, cycle = 3 }) {
  const main = [BX, BARRE];
  // Racine (bassin) placée d'après la position voulue des épaules et l'inclinaison du tronc.
  const pose = (epaules, tronc, angles) => ({
    root: [epaules[0] - 60 * Math.cos((tronc * Math.PI) / 180), epaules[1] - 60 * Math.sin((tronc * Math.PI) / 180)],
    angles: { ...angles, tronc },
    ik: [{ chain: ['bras', 'avant-bras'], target: main, bend: 1 }],
  });
  return {
    id,
    title,
    cycle,
    keyTime: 0.45,
    skeleton: profil(),
    ground: 234,
    props: [{ line: [78, BARRE, 218, BARRE], w: 5 }],
    poses: {
      bas: pose([BX - 12, BARRE + 62], -90, { cuisse: 72, tibia: 162, pied: 120, tete: -88 }),
      haut: pose([BX - 24, BARRE + 8], -93, { cuisse: 70, tibia: 150, pied: 106, tete: -84 }),
    },
    timeline: [[0, 'bas', { ease: 'out', samples: 3 }], [0.4, 'haut'], [0.5, 'haut'], [0.94, 'bas'], [1, 'bas']],
  };
}
