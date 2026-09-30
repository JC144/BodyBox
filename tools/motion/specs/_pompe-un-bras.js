// Module partagé (ignoré par build.js) : pompe sur un bras, de profil, tête à droite.
// Q (chaise), Q1 (support de 25 cm) et Q2 (au sol) ne diffèrent que par la hauteur de la main,
// l'inclinaison du corps et la jambe d'équilibre.
import { profil } from '../rig.js';

/**
 * @param {object} o
 * @param {string} o.id
 * @param {string} o.title
 * @param {number[]} o.main     position de la main en appui [x, y]
 * @param {number} o.pieds      x des pointes de pieds (jambe tendue)
 * @param {number} o.haut       inclinaison du corps en position haute (degrés au-dessus de l'horizontale)
 * @param {number} o.bas        inclinaison en position basse
 * @param {number[]} o.pied2    pied de la jambe d'équilibre [x, y] (côté éloigné)
 * @param {number} [o.bend2]    sens du genou de la jambe d'équilibre
 * @param {object[]} [o.props]
 */
export function pompeUnBras(o) {
  const pose = (a) => ({
    angles: {
      cuisse: 180 - a, tibia: 180 - a, tronc: -a, tete: -a,
      // Bras libre (côté éloigné) : main posée sur le bas du dos.
      'bras-2': 190 - a, 'avant-bras-2': 176 - a,
    },
    pin: { point: 'tibia', at: [o.pieds, 209] },
    ik: [
      { chain: ['bras', 'avant-bras'], target: o.main, bend: 1 },
      { chain: ['cuisse-2', 'tibia-2'], target: o.pied2, bend: o.bend2 ?? 1 },
    ],
  });
  return {
    id: o.id,
    title: o.title,
    cycle: 2.8,
    keyTime: 0.5,
    skeleton: profil({ double: true, pieds: false }),
    ground: 214,
    props: o.props || [],
    poses: { haut: pose(o.haut), bas: pose(o.bas) },
    timeline: [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.95, 'haut'], [1, 'haut']],
  };
}
