// Module partagé (ignoré par build.js) : tractions à la barre fixe en supination, exercices C à C3.
// Vue de profil, tête à droite. La barre est dessinée comme un trait horizontal, lisible au premier
// coup d'œil, avec ses deux fixations.
import { profil } from '../rig.js';

const BARRE = [124, 30];

/** Pose : épaule `s`, inclinaison du tronc, jambes fléchies, pieds tendus. */
function pose({ s, tronc, tete = tronc + 6, cuisse = 70, tibia = 160, pied = 112 }) {
  return {
    angles: { tronc, tete, cuisse, tibia, pied },
    pin: { point: 'tronc', at: s },
    ik: [{ chain: ['bras', 'avant-bras'], target: BARRE, bend: 1 }],
  };
}

/** Positions types de l'épaule (la tête bascule en arrière bras tendus, pour dégager les bras). */
export const BAS = { s: [118, 94], tronc: -94, tete: -114, cuisse: 72, tibia: 164, pied: 115 }; // bras tendus
export const MENTON = { s: [100, 42], tronc: -96, tete: -86, cuisse: 64, tibia: 158, pied: 110 }; // menton au-dessus de la barre
export const MI = { s: [96, 64], tronc: -96, tete: -92, cuisse: 68, tibia: 160, pied: 112 }; // bras parallèles au sol

export function tractions({ id, title, cycle, keyTime, poses, timeline }) {
  const resolved = {};
  for (const [n, p] of Object.entries(poses)) resolved[n] = pose(p);
  return {
    id,
    title,
    cycle,
    keyTime,
    skeleton: profil(),
    ground: 226,
    props: [{ line: [60, 14, 60, 30] }, { line: [188, 14, 188, 30] }],
    front: [{ line: [56, 30, 192, 30], w: 5 }],
    poses: resolved,
    timeline,
  };
}
