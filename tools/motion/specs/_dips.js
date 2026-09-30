// Module partagé (ignoré par build.js) : dips entre deux chaises, exercices B, B1 et B2.
// Vue de profil, tête à droite. Les mains serrent le haut du dossier ; seule la chaise la plus
// proche est dessinée, estompée, puisqu'elle est à côté du personnage et non devant.
import { profil } from '../rig.js';

const rad = (d) => (d * Math.PI) / 180;
const MAIN = [120, 110];

/**
 * Position de l'épaule à partir de l'inclinaison de l'avant-bras (`beta`, degrés au-dessus de
 * l'horizontale, 90 = vertical, coude en arrière de la main) et de celle du bras (`alpha`, angle du
 * coude vers l'épaule : 0 = bras parallèle au sol, négatif = épaule au-dessus du coude).
 */
function epaule(alpha, beta) {
  const coude = [MAIN[0] - 32 * Math.cos(rad(beta)), MAIN[1] - 32 * Math.sin(rad(beta))];
  return [coude[0] + 31.5 * Math.cos(rad(alpha)), coude[1] + 31.5 * Math.sin(rad(alpha))];
}

/** Pose : { alpha, beta, tronc, cuisse, tibia, pied }. */
function pose({ alpha, beta, tronc, cuisse, tibia, pied }) {
  return {
    angles: { tronc, tete: tronc - 6, cuisse, tibia, pied },
    pin: { point: 'tronc', at: epaule(alpha, beta) },
    ik: [{ chain: ['bras', 'avant-bras'], target: MAIN, bend: 1 }],
  };
}

export const HAUT = { alpha: -84, beta: 90, tronc: -80, cuisse: 82, tibia: 150, pied: 125 };

export function dips({ id, title, cycle, keyTime, poses, timeline }) {
  const resolved = {};
  for (const [n, p] of Object.entries(poses)) resolved[n] = pose(p);
  return {
    id,
    title,
    cycle,
    keyTime,
    skeleton: profil(),
    ground: 214,
    props: [
      // Chaise vue de face (assise tournée vers l'extérieur, comme dans le livre) : traverse du
      // dossier sous la main, montants jusqu'au sol, assise.
      { line: [98, 115, 142, 115] },
      { line: [98, 115, 98, 214] },
      { line: [142, 115, 142, 214] },
      { line: [98, 168, 142, 168] },
    ],
    poses: resolved,
    timeline,
  };
}
