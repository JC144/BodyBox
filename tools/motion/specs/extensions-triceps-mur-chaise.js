import { profil } from '../rig.js';

// K2, niveau « chaise, jambes très écartées » (niveaux 2 à 6 du livre ; l'écart des jambes ne se voit
// pas de profil). Mains sur l'assise, bassin haut ; les coudes fléchissent jusqu'à poser les
// avant-bras sur l'assise, la tête au bord du siège, puis les bras se tendent.
const deg = (r) => (r * 180) / Math.PI;
const PIEDS = [46, 209];
const MAINS = [184, 164];

/** Épaules en `S`, bassin à 80 des pieds et 60 des épaules (côté haut). */
function corps(S, tete) {
  const [ax, ay] = PIEDS;
  const dx = S[0] - ax, dy = S[1] - ay, d = Math.hypot(dx, dy);
  const a = (80 * 80 - 60 * 60 + d * d) / (2 * d);
  const h = Math.sqrt(80 * 80 - a * a);
  const P = [ax + (a * dx) / d + (h * dy) / d, ay + (a * dy) / d - (h * dx) / d];
  const jambes = deg(Math.atan2(ay - P[1], ax - P[0]));
  return { cuisse: jambes, tibia: jambes, tronc: deg(Math.atan2(S[1] - P[1], S[0] - P[0])), tete };
}
const pose = (S, tete) => ({
  angles: corps(S, tete),
  pin: { point: 'tibia', at: PIEDS },
  ik: [{ chain: ['bras', 'avant-bras'], target: MAINS, bend: 1 }],
});

export default {
  id: 'extensions-triceps-mur-chaise',
  title: 'Extensions triceps mur puis chaise',
  cycle: 2.8,
  keyTime: 0.5,
  skeleton: profil({ pieds: false }),
  ground: 214,
  props: [
    // Chaise de 45 cm, dossier à droite
    { line: [146, 169, 204, 169] }, { line: [150, 169, 150, 214] }, { line: [200, 169, 200, 214] }, { line: [200, 169, 206, 104] },
  ],
  poses: {
    haut: pose([129, 131], 72),
    bas: pose([126, 146], 85),
  },
  timeline: [[0, 'haut'], [0.45, 'bas'], [0.55, 'bas'], [0.95, 'haut'], [1, 'haut']],
};
