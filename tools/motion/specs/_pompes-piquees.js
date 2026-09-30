// Module partagé (non construit : le nom commence par « _ ») : pompes piquées J, J1, J2, J3.
// Pieds sur un support d'environ 100 cm, mains (ou poings) sur des chaises, fesses vers le plafond.
// Les quatre variantes ne diffèrent que par l'écart des mains (invisible de profil) et l'appui
// sur les poings (serviette pliée sur l'assise, poing dessiné au bout de l'avant-bras).
import { profil } from '../rig.js';

const deg = (r) => (r * 180) / Math.PI;
const PIEDS = [52, 109]; // pointes de pieds sur le support (dessus à y = 114)

/** Corps en V dont les épaules tombent en `S` : bassin à 80 des pieds et 60 des épaules (côté haut). */
function corps(S, tete) {
  const [ax, ay] = PIEDS;
  const dx = S[0] - ax, dy = S[1] - ay, d = Math.hypot(dx, dy);
  const a = (80 * 80 - 60 * 60 + d * d) / (2 * d);
  const h = Math.sqrt(80 * 80 - a * a);
  const P = [ax + (a * dx) / d + (h * dy) / d, ay + (a * dy) / d - (h * dx) / d];
  const jambes = deg(Math.atan2(ay - P[1], ax - P[0]));
  const tronc = deg(Math.atan2(S[1] - P[1], S[0] - P[0]));
  return { cuisse: jambes, tibia: jambes, tronc, tete };
}

export function pompesPiquees({ id, title, poings = false }) {
  // Poing : l'appui est un peu plus haut (serviette et poing fermé).
  const dy = poings ? -7 : 0;
  const MAINS = [144, 164 + dy];
  const pose = (S, tete) => ({
    angles: corps(S, tete),
    pin: { point: 'tibia', at: PIEDS },
    ik: [{ chain: ['bras', 'avant-bras'], target: MAINS, bend: 1 }],
  });
  const props = [
    // Support (meuble) d'environ 100 cm
    { polyline: [14, 114, 62, 114, 62, 214] },
    // Chaise des mains, dossier à droite
    { line: [136, 169, 194, 169] }, { line: [140, 169, 140, 214] }, { line: [190, 169, 190, 214] }, { line: [190, 169, 196, 120] },
  ];
  if (poings) props.push({ line: [132, 164, 160, 164], w: 6 }); // serviette pliée
  return {
    id,
    title,
    cycle: 2.8,
    keyTime: 0.5,
    skeleton: profil({ pieds: false }),
    ground: 214,
    props,
    attach: poings ? { 'avant-bras': [{ circle: [30, 0, 7], fill: true }] } : {},
    poses: {
      haut: pose([124, 103 + dy], 50),
      bas: pose([134, 124 + dy], 58),
    },
    timeline: [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.95, 'haut'], [1, 'haut']],
  };
}
